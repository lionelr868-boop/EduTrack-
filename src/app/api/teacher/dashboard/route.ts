import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const userId = searchParams.get('userId');

    // Resolve teacherId from userId if not provided
    let resolvedTeacherId = teacherId;
    if (!resolvedTeacherId && userId) {
      const teacherRecord = await db.teacher.findFirst({
        where: { userId },
      });
      resolvedTeacherId = teacherRecord?.id || null;
    }

    if (!resolvedTeacherId) {
      return NextResponse.json(
        { error: 'teacherId أو userId مطلوب' },
        { status: 400 }
      );
    }

    // Get teacher info with subject
    const teacher = await db.teacher.findUnique({
      where: { id: resolvedTeacherId },
      include: {
        user: { select: { name: true, email: true } },
        subject: { select: { id: true, name: true, level: true } },
        institution: { select: { id: true, name: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'الأستاذ غير موجود' },
        { status: 404 }
      );
    }

    const now = new Date();
    const todayDay = now.getDay();

    // Get all session IDs for this teacher
    const teacherSessions = await db.session.findMany({
      where: {
        teacherId: resolvedTeacherId,
        sectionId: { not: null },
      },
      select: { id: true, sectionId: true },
      distinct: ['sectionId'],
    });

    const sectionIds = teacherSessions
      .map((s) => s.sectionId)
      .filter((id): id is string => id !== null);

    // Run all independent queries in parallel
    const [
      todaySessions,
      supervisedSections,
      recentActivities,
      allAttendances,
      recentAbsences,
      totalStudents,
    ] = await Promise.all([
      // Today's sessions for this teacher
      db.session.findMany({
        where: {
          teacherId: resolvedTeacherId,
          dayOfWeek: todayDay,
          status: { not: 'CANCELLED' },
        },
        include: {
          subject: { select: { name: true } },
          section: {
            include: {
              year: { select: { name: true, level: true } },
              students: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),

      // Sections supervised by this teacher
      db.section.findMany({
        where: { supervisorId: resolvedTeacherId },
        include: {
          year: { select: { name: true, level: true } },
          students: { select: { id: true } },
        },
      }),

      // Recent activities created by this teacher
      db.studentActivity.findMany({
        where: { teacherId: resolvedTeacherId },
        include: {
          student: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Attendance stats for this teacher's sessions
      db.session.findMany({
        where: { teacherId: resolvedTeacherId },
        select: { id: true },
      }).then(async (sessions) => {
        const sIds = sessions.map((s) => s.id);
        if (sIds.length === 0) return [];
        return db.attendance.findMany({
          where: { sessionId: { in: sIds } },
          select: { status: true },
        });
      }),

      // Recent absences for this teacher's sessions
      db.session.findMany({
        where: { teacherId: resolvedTeacherId },
        select: { id: true },
      }).then(async (sessions) => {
        const sIds = sessions.map((s) => s.id);
        if (sIds.length === 0) return [];
        return db.absence.findMany({
          where: {
            sessionId: { in: sIds },
            absenceType: 'STUDENT',
          },
          include: {
            student: { select: { name: true } },
            session: {
              include: { subject: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
      }),

      // Count total students across all teacher's sessions
      db.student.count({
        where: { sectionId: { in: sectionIds } },
      }),
    ]);

    // Calculate attendance stats
    const totalAttendanceRecords = allAttendances.length;
    const presentCount = allAttendances.filter(
      (a) => a.status === 'PRESENT'
    ).length;
    const absentCount = allAttendances.filter(
      (a) => a.status === 'ABSENT'
    ).length;
    const lateCount = allAttendances.filter(
      (a) => a.status === 'LATE'
    ).length;
    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.round(
            ((presentCount + lateCount) / totalAttendanceRecords) * 100
          )
        : 0;

    // Map today's sessions - determine status based on time
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const mappedSessions = todaySessions.map((session) => {
      const [startH] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);
      let status: 'upcoming' | 'done' | 'cancelled' = 'upcoming';
      if (session.status === 'CANCELLED') {
        status = 'cancelled';
      } else if (currentHour > endH || (currentHour === endH && currentMinute > endM)) {
        status = 'done';
      } else if (currentHour >= startH) {
        status = 'upcoming'; // currently in progress, show as upcoming
      }
      return {
        id: session.id,
        subjectName: session.subject.name,
        subject: session.subject.name,
        startTime: session.startTime,
        endTime: session.endTime,
        status,
        sectionName: session.section?.name || '',
        yearName: session.section?.year?.name || '',
        level: session.section?.year?.level || '',
        section: session.section
          ? {
              id: session.section.id,
              name: session.section.name,
              year: session.section.year,
              studentCount: session.section.students.length,
            }
          : null,
      };
    });

    // Map supervised sections
    const mappedSupervisedSections = supervisedSections.map((section) => ({
      id: section.id,
      name: section.name,
      yearName: section.year.name,
      level: section.year.level,
      studentCount: section.students.length,
    }));

    // Build sections with students (for activity form)
    const sectionsWithStudents = await db.section.findMany({
      where: {
        id: { in: sectionIds },
      },
      include: {
        year: { select: { name: true, level: true } },
        students: { select: { id: true, name: true } },
      },
    });
    const mappedSectionsWithStudents = sectionsWithStudents.map((section) => ({
      id: section.id,
      name: section.name,
      yearName: section.year.name,
      level: section.year.level,
      students: section.students,
    }));

    // Build weekly attendance chart
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weeklyAttendanceChart = [];
    const teacherSessionIds = (await db.session.findMany({
      where: { teacherId: resolvedTeacherId },
      select: { id: true, dayOfWeek: true },
    }));

    for (let day = 0; day <= 4; day++) { // Sunday to Thursday
      const daySessionIds = teacherSessionIds
        .filter(s => s.dayOfWeek === day)
        .map(s => s.id);

      if (daySessionIds.length === 0) {
        weeklyAttendanceChart.push({ day: dayNames[day], rate: 0 });
        continue;
      }

      const dayAttendances = await db.attendance.findMany({
        where: { sessionId: { in: daySessionIds } },
        select: { status: true },
      });

      const total = dayAttendances.length;
      const present = dayAttendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      weeklyAttendanceChart.push({ day: dayNames[day], rate });
    }

    // Map recent activities
    const mappedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      typeLabel: activity.type,
      title: activity.title,
      description: null,
      grade: activity.grade,
      maxGrade: activity.maxGrade,
      date: activity.date.toISOString(),
      createdAt: activity.createdAt?.toISOString() || activity.date.toISOString(),
      student: activity.student,
      section: activity.section,
    }));

    // Map recent absences
    const mappedAbsences = recentAbsences.map((absence) => ({
      id: absence.id,
      studentName: absence.student?.name || 'غير معروف',
      subjectName: absence.session?.subject?.name || 'غير محدد',
      date: absence.createdAt.toISOString(),
    }));

    // Count sessions without attendance (sessions that happened but no attendance recorded)
    const sessionsWithoutAttendance = Math.max(0, teacherSessions.length - allAttendances.length);

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
        email: teacher.user.email,
        subjectName: teacher.subject.name,
        subject: teacher.subject,
        level: teacher.level,
        institution: teacher.institution,
        phone: teacher.phone,
        specialization: teacher.specialization,
      },
      todaySessions: mappedSessions,
      supervisedSections: mappedSupervisedSections,
      sectionsWithStudents: mappedSectionsWithStudents,
      weeklyAttendanceChart,
      recentActivities: mappedActivities,
      recentAbsences: mappedAbsences,
      stats: {
        weeklyAttendanceRate: attendanceRate,
        sessionsWithoutAttendance,
        totalStudents,
        totalSessions: teacherSessions.length,
        attendanceRate,
        presentCount,
        absentCount,
        lateCount,
        supervisedSectionsCount: supervisedSections.length,
      },
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'خطأ في الخادم', details: message },
      { status: 500 }
    );
  }
}
