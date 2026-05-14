import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teacher/attendance-sessions - Get teacher's sessions for attendance recording
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const sectionId = searchParams.get('sectionId');
    const dateParam = searchParams.get('date');

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

    // Determine the date and day of week
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayOfWeek = targetDate.getDay();

    // Build session query
    const sessionWhere: Record<string, unknown> = {
      teacherId,
      dayOfWeek,
      status: { not: 'CANCELLED' },
      sectionId: { not: null },
    };

    if (sectionId) {
      sessionWhere.sectionId = sectionId;
    }

    // Get sessions for this teacher on the specified day
    const sessions = await db.session.findMany({
      where: sessionWhere,
      include: {
        subject: { select: { id: true, name: true } },
        section: {
          include: {
            year: { select: { name: true, level: true } },
            students: { select: { id: true } },
          },
        },
        attendances: {
          select: { id: true, status: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Map sessions with attendance info
    const mappedSessions = sessions.map((session) => {
      const recordedCount = session.attendances.length;
      const totalStudents = session.section?.students.length || 0;

      return {
        id: session.id,
        subjectName: session.subject.name,
        startTime: session.startTime,
        endTime: session.endTime,
        section: session.section
          ? {
              id: session.section.id,
              name: session.section.name,
              yearName: session.section.year?.name || '',
              level: session.section.year?.level || '',
            }
          : null,
        level: session.level,
        recordedAttendanceCount: recordedCount,
        totalStudents,
        isFullyRecorded: recordedCount > 0 && recordedCount >= totalStudents,
      };
    });

    // Get all sections the teacher teaches (for filter dropdown)
    const allTeacherSessions = await db.session.findMany({
      where: {
        teacherId,
        sectionId: { not: null },
        status: { not: 'CANCELLED' },
      },
      select: { sectionId: true },
      distinct: ['sectionId'],
    });

    const teacherSectionIds = allTeacherSessions
      .map((s) => s.sectionId)
      .filter((id): id is string => id !== null);

    // Also add supervised sections
    const supervisedSections = await db.section.findMany({
      where: { supervisorId: teacherId },
      select: { id: true },
    });

    const allSectionIds = [...new Set([...teacherSectionIds, ...supervisedSections.map((s) => s.id)])];

    const sections = await db.section.findMany({
      where: { id: { in: allSectionIds } },
      include: {
        year: { select: { name: true, level: true } },
        students: { select: { id: true } },
      },
    });

    const sectionOptions = sections.map((s) => ({
      id: s.id,
      name: s.name,
      yearName: s.year?.name || '',
      level: s.year?.level || '',
      studentCount: s.students.length,
      isSupervisor: supervisedSections.some((sup) => sup.id === s.id),
    }));

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek,
      sessions: mappedSessions,
      sections: sectionOptions,
    });
  } catch (error) {
    console.error('Error fetching teacher attendance sessions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في جلب حصص الحضور', details: message },
      { status: 500 }
    );
  }
}
