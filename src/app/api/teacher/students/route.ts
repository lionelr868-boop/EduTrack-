import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teacher/students - Get students for a teacher, organized by level and section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const sectionId = searchParams.get('sectionId');
    const level = searchParams.get('level');
    const search = searchParams.get('search');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'معرف الأستاذ مطلوب' },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, institutionId: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'الأستاذ غير موجود' },
        { status: 404 }
      );
    }

    // Get section IDs where this teacher has sessions
    const teacherSessions = await db.session.findMany({
      where: {
        teacherId,
        sectionId: { not: null },
      },
      select: { sectionId: true },
      distinct: ['sectionId'],
    });

    const sessionSectionIds = teacherSessions
      .map((s) => s.sectionId)
      .filter((id): id is string => id !== null);

    // Get section IDs where this teacher is a supervisor
    const supervisedSections = await db.section.findMany({
      where: { supervisorId: teacherId },
      select: { id: true },
    });

    const supervisedSectionIds = supervisedSections.map((s) => s.id);

    // Combine all section IDs (unique)
    const allSectionIds = [...new Set([...sessionSectionIds, ...supervisedSectionIds])];

    if (allSectionIds.length === 0) {
      return NextResponse.json({
        grouped: {},
        sections: [],
        totalStudents: 0,
      });
    }

    // Build student query filters
    const studentWhere: Record<string, unknown> = {
      sectionId: { in: allSectionIds },
    };

    if (sectionId) {
      studentWhere.sectionId = sectionId;
    }

    if (level) {
      studentWhere.level = level;
    }

    if (search && search.trim()) {
      studentWhere.name = { contains: search.trim() };
    }

    // Fetch students with their section and parent info
    const students = await db.student.findMany({
      where: studentWhere,
      include: {
        section: {
          include: {
            year: { select: { name: true, level: true } },
          },
        },
        parent: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    // Get attendance counts per student for the teacher's sessions only
    const teacherSessionRecords = await db.session.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const teacherSessionIds = teacherSessionRecords.map((s) => s.id);

    // Build attendance stats per student
    const studentAttendanceStats: Record<string, { attended: number; absent: number; total: number; rate: number }> = {};

    if (teacherSessionIds.length > 0 && students.length > 0) {
      const attendanceRecords = await db.attendance.findMany({
        where: {
          sessionId: { in: teacherSessionIds },
          studentId: { in: students.map((s) => s.id) },
        },
        select: { studentId: true, status: true },
      });

      // Group by student
      const byStudent: Record<string, { attended: number; absent: number; total: number }> = {};
      for (const record of attendanceRecords) {
        if (!byStudent[record.studentId]) {
          byStudent[record.studentId] = { attended: 0, absent: 0, total: 0 };
        }
        byStudent[record.studentId].total++;
        if (record.status === 'PRESENT' || record.status === 'LATE') {
          byStudent[record.studentId].attended++;
        }
        if (record.status === 'ABSENT') {
          byStudent[record.studentId].absent++;
        }
      }

      for (const [studentId, stats] of Object.entries(byStudent)) {
        studentAttendanceStats[studentId] = {
          ...stats,
          rate: stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0,
        };
      }
    }

    // Fill in students with no attendance records
    for (const student of students) {
      if (!studentAttendanceStats[student.id]) {
        studentAttendanceStats[student.id] = { attended: 0, absent: 0, total: 0, rate: 0 };
      }
    }

    // Map students to response format
    const mappedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      level: student.level,
      gender: student.gender,
      section: student.section
        ? {
            id: student.section.id,
            name: student.section.name,
            yearName: student.section.year?.name || '',
          }
        : null,
      attendance: studentAttendanceStats[student.id] || { attended: 0, absent: 0, total: 0, rate: 0 },
      parent: student.parent?.user
        ? {
            id: student.parent.user.id,
            name: student.parent.user.name,
            email: student.parent.user.email,
            phone: student.parent.phone || null,
          }
        : null,
    }));

    // Group by level -> section
    const grouped: Record<string, Record<string, { sectionInfo: { id: string; name: string; yearName: string }; students: typeof mappedStudents }>> = {};
    for (const student of mappedStudents) {
      const studentLevel = student.level || 'غير محدد';
      const sectionKey = student.section?.id || 'no-section';
      const sectionName = student.section?.name || 'بدون قسم';
      const sectionYearName = student.section?.yearName || '';

      if (!grouped[studentLevel]) {
        grouped[studentLevel] = {};
      }
      if (!grouped[studentLevel][sectionKey]) {
        grouped[studentLevel][sectionKey] = {
          sectionInfo: { id: sectionKey, name: sectionName, yearName: sectionYearName },
          students: [],
        };
      }
      grouped[studentLevel][sectionKey].students.push(student);
    }

    // Get section details for reference
    const sections = await db.section.findMany({
      where: { id: { in: allSectionIds } },
      include: {
        year: { select: { name: true, level: true } },
        students: { select: { id: true } },
      },
    });

    const sectionDetails = sections.map((s) => ({
      id: s.id,
      name: s.name,
      yearName: s.year?.name || '',
      level: s.year?.level || '',
      studentCount: s.students.length,
      isSupervisor: supervisedSectionIds.includes(s.id),
    }));

    return NextResponse.json({
      grouped,
      sections: sectionDetails,
      totalStudents: mappedStudents.length,
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في جلب بيانات التلاميذ', details: message },
      { status: 500 }
    );
  }
}
