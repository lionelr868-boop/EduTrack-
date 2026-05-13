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
      allTeacherSessions,
      monthlyActivities,
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
          select: { status: true, studentId: true },
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

      // All sessions for weekly schedule
      db.session.findMany({
        where: {
          teacherId: resolvedTeacherId,
          status: { not: 'CANCELLED' },
        },
        include: {
          subject: { select: { name: true } },
          section: {
            include: {
              year: { select: { name: true, level: true } },
            },
          },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),

      // Activities this month for performance summary
      db.studentActivity.findMany({
        where: {
          teacherId: resolvedTeacherId,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
        select: {
          id: true,
          grade: true,
          maxGrade: true,
        },
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
      const [startH, startM] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);
      let status: 'upcoming' | 'in_progress' | 'done' | 'cancelled' = 'upcoming';
      if (session.status === 'CANCELLED') {
        status = 'cancelled';
      } else if (currentHour > endH || (currentHour === endH && currentMinute > endM)) {
        status = 'done';
      } else if (
        (currentHour > startH || (currentHour === startH && currentMinute >= startM)) &&
        (currentHour < endH || (currentHour === endH && currentMinute <= endM))
      ) {
        status = 'in_progress';
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

    // Build weekly schedule - group by day
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const weeklySchedule: Record<string, Array<{
      id: string;
      subjectName: string;
      startTime: string;
      endTime: string;
      sectionName: string;
      yearName: string;
      dayOfWeek: number;
    }>> = {};

    for (let day = 0; day <= 4; day++) {
      weeklySchedule[dayNames[day]] = [];
    }

    allTeacherSessions.forEach((session) => {
      if (session.dayOfWeek >= 0 && session.dayOfWeek <= 4 && session.section) {
        const dayName = dayNames[session.dayOfWeek];
        weeklySchedule[dayName]?.push({
          id: session.id,
          subjectName: session.subject.name,
          startTime: session.startTime,
          endTime: session.endTime,
          sectionName: session.section.name,
          yearName: session.section.year?.name || '',
          dayOfWeek: session.dayOfWeek,
        });
      }
    });

    // Build supervised sections with enhanced details
    const supervisedSectionIds = supervisedSections.map((s) => s.id);

    // Get attendance data per supervised section
    const sectionAttendanceData = await Promise.all(
      supervisedSectionIds.map(async (sectionId) => {
        const sectionSessions = await db.session.findMany({
          where: { sectionId },
          select: { id: true },
        });
        const sIds = sectionSessions.map((s) => s.id);
        if (sIds.length === 0) return { sectionId, rate: 0, total: 0, present: 0 };

        const attendances = await db.attendance.findMany({
          where: { sessionId: { in: sIds } },
          select: { status: true },
        });
        const total = attendances.length;
        const present = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        return { sectionId, rate, total, present };
      })
    );

    // Get recent grades per supervised section
    const sectionRecentGrades = await Promise.all(
      supervisedSectionIds.map(async (sectionId) => {
        const activities = await db.studentActivity.findMany({
          where: { sectionId },
          include: {
            student: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        return {
          sectionId,
          grades: activities.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            grade: a.grade,
            maxGrade: a.maxGrade,
            studentName: a.student.name,
            date: a.date.toISOString(),
          })),
        };
      })
    );

    // Get students per supervised section
    const sectionStudents = await Promise.all(
      supervisedSectionIds.map(async (sectionId) => {
        const students = await db.student.findMany({
          where: { sectionId },
          select: { id: true, name: true },
        });
        return { sectionId, students };
      })
    );

    const mappedSupervisedSections = supervisedSections.map((section) => {
      const attendanceInfo = sectionAttendanceData.find((d) => d.sectionId === section.id);
      const gradesInfo = sectionRecentGrades.find((d) => d.sectionId === section.id);
      const studentsInfo = sectionStudents.find((d) => d.sectionId === section.id);
      return {
        id: section.id,
        name: section.name,
        yearName: section.year.name,
        level: section.year.level,
        studentCount: section.students.length,
        attendanceRate: attendanceInfo?.rate || 0,
        recentGrades: gradesInfo?.grades || [],
        students: studentsInfo?.students || [],
      };
    });

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
    const weeklyAttendanceChart = [];
    const teacherSessionIds = allTeacherSessions.map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek }));

    for (let day = 0; day <= 4; day++) {
      const daySessionIds = teacherSessionIds
        .filter((s) => s.dayOfWeek === day)
        .map((s) => s.id);

      if (daySessionIds.length === 0) {
        weeklyAttendanceChart.push({ day: dayNames[day], rate: 0 });
        continue;
      }

      const dayAttendances = await db.attendance.findMany({
        where: { sessionId: { in: daySessionIds } },
        select: { status: true },
      });

      const total = dayAttendances.length;
      const present = dayAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
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

    // Count sessions without attendance
    const sessionsWithoutAttendance = Math.max(0, teacherSessions.length - allAttendances.length);

    // Performance summary
    const activitiesThisMonth = monthlyActivities.length;
    const activitiesWithGrades = monthlyActivities.filter((a) => a.grade !== null && a.maxGrade !== null && a.maxGrade > 0);
    const avgGrade = activitiesWithGrades.length > 0
      ? Math.round(
          (activitiesWithGrades.reduce((sum, a) => sum! + ((a.grade || 0) / (a.maxGrade || 1)) * 100, 0)!) /
          activitiesWithGrades.length
        )
      : 0;

    // Perfect attendance: students with no absences in supervised sections
    const supervisedStudentIds = supervisedSections.flatMap((s) => s.students.map((st) => st.id));
    const studentsWithAbsences = await db.absence.findMany({
      where: {
        studentId: { in: supervisedStudentIds },
        absenceType: 'STUDENT',
      },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const studentsWithAbsenceIds = new Set(studentsWithAbsences.map((a) => a.studentId));
    const perfectAttendanceCount = supervisedStudentIds.filter((id) => !studentsWithAbsenceIds.has(id)).length;

    // Sessions completed vs planned this week
    const sessionsCompletedThisWeek = mappedSessions.filter((s) => s.status === 'done').length;
    const sessionsPlannedThisWeek = allTeacherSessions.length;

    const performanceSummary = {
      activitiesThisMonth,
      avgGrade,
      perfectAttendanceCount,
      sessionsCompletedThisWeek,
      sessionsPlannedThisWeek,
    };

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
      weeklySchedule,
      recentActivities: mappedActivities,
      recentAbsences: mappedAbsences,
      performanceSummary,
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
