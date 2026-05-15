import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const userId = searchParams.get('userId');

    // Resolve parent record: accept either parentId or userId
    let parent;
    if (parentId) {
      parent = await db.parent.findUnique({
        where: { id: parentId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    } else if (userId) {
      parent = await db.parent.findFirst({
        where: { userId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    }

    if (!parent) {
      return NextResponse.json(
        { error: 'ولي الأمر غير موجود' },
        { status: 404 }
      );
    }

    const resolvedParentId = parent.id;

    // Get children with their sections and ALL weekly sessions
    const children = await db.student.findMany({
      where: { parentId: resolvedParentId },
      include: {
        section: {
          include: {
            year: { select: { name: true, level: true } },
            sessions: {
              where: {
                status: { not: 'CANCELLED' },
              },
              include: {
                subject: { select: { name: true } },
                teacher: { include: { user: { select: { name: true } } } },
              },
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
        },
      },
    });

    // Get recent absences for all children
    const childrenIds = children.map((c) => c.id);

    const [recentAbsences, recentActivities, latestNotifications, unpaidInvoices, todayAttendances] =
      await Promise.all([
        // Recent absences
        db.absence.findMany({
          where: {
            studentId: { in: childrenIds },
            absenceType: 'STUDENT',
          },
          include: {
            student: { select: { id: true, name: true } },
            session: {
              include: { subject: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // Recent activities
        db.studentActivity.findMany({
          where: { studentId: { in: childrenIds } },
          include: {
            student: { select: { id: true, name: true } },
            teacher: {
              include: {
                user: { select: { name: true } },
                subject: { select: { name: true } },
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 10,
        }),

        // Latest notifications
        db.notification.findMany({
          where: { userId: parent.user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),

        // Unpaid invoices
        db.invoice.findMany({
          where: {
            studentId: { in: childrenIds },
            status: { in: ['PENDING', 'OVERDUE'] },
          },
          include: { student: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        }),

        // Today's attendances
        db.attendance.findMany({
          where: {
            studentId: { in: childrenIds },
          },
          include: {
            session: {
              include: {
                subject: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Build today's schedule from children's sections
    const todayDay = new Date().getDay();
    const todaySchedule: Array<{
      studentId: string;
      studentName: string;
      subject: string;
      teacherName: string;
      startTime: string;
      endTime: string;
      sessionId: string;
    }> = [];

    for (const child of children) {
      if (child.section?.sessions) {
        for (const session of child.section.sessions) {
          if (session.dayOfWeek === todayDay) {
            todaySchedule.push({
              studentId: child.id,
              studentName: child.name,
              subject: session.subject.name,
              teacherName: session.teacher.user.name,
              startTime: session.startTime,
              endTime: session.endTime,
              sessionId: session.id,
            });
          }
        }
      }
    }

    // Build weekly timetable (all sessions grouped by day)
    const dayNames: Record<number, string> = {
      0: 'الأحد',
      1: 'الاثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس',
      5: 'الجمعة',
      6: 'السبت',
    };

    const weeklyTimetable: Array<{
      dayOfWeek: number;
      dayName: string;
      sessions: Array<{
        sessionId: string;
        subject: string;
        teacherName: string;
        startTime: string;
        endTime: string;
        studentName: string;
      }>;
    }> = [];

    // Build sessions per day
    for (let day = 0; day <= 6; day++) {
      const daySessions: Array<{
        sessionId: string;
        subject: string;
        teacherName: string;
        startTime: string;
        endTime: string;
        studentName: string;
      }> = [];

      for (const child of children) {
        if (child.section?.sessions) {
          for (const session of child.section.sessions) {
            if (session.dayOfWeek === day) {
              daySessions.push({
                sessionId: session.id,
                subject: session.subject.name,
                teacherName: session.teacher.user.name,
                startTime: session.startTime,
                endTime: session.endTime,
                studentName: child.name,
              });
            }
          }
        }
      }

      if (daySessions.length > 0) {
        weeklyTimetable.push({
          dayOfWeek: day,
          dayName: dayNames[day] || 'غير محدد',
          sessions: daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        });
      }
    }

    // Build attendance status for today
    const attendanceStatus: Array<{
      studentId: string;
      studentName: string;
      totalSessions: number;
      presentCount: number;
      absentCount: number;
      lateCount: number;
    }> = [];

    for (const child of children) {
      const todaySessionIds = todaySchedule
        .filter((s) => s.studentId === child.id)
        .map((s) => s.sessionId);

      const childAttendances = todayAttendances.filter(
        (a) => a.studentId === child.id && todaySessionIds.includes(a.sessionId)
      );

      attendanceStatus.push({
        studentId: child.id,
        studentName: child.name,
        totalSessions: todaySessionIds.length,
        presentCount: childAttendances.filter((a) => a.status === 'PRESENT').length,
        absentCount: childAttendances.filter((a) => a.status === 'ABSENT').length,
        lateCount: childAttendances.filter((a) => a.status === 'LATE').length,
      });
    }

    // Map children info
    const childrenInfo = children.map((child) => ({
      id: child.id,
      name: child.name,
      level: child.level,
      section: child.section
        ? {
            id: child.section.id,
            name: child.section.name,
            year: child.section.year,
          }
        : null,
      enrollmentDate: child.enrollmentDate.toISOString(),
    }));

    // Map absences
    const mappedAbsences = recentAbsences.map((abs) => ({
      id: abs.id,
      studentName: abs.student?.name || 'غير محدد',
      subject: abs.session?.subject?.name || 'غير محدد',
      reason: abs.reason,
      date: abs.createdAt.toISOString(),
      notificationSent: abs.notificationSent,
    }));

    // Map activities
    const mappedActivities = recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      typeLabel: getActivityTypeLabel(activity.type),
      title: activity.title,
      description: activity.description,
      grade: activity.grade,
      maxGrade: activity.maxGrade,
      date: activity.date.toISOString(),
      studentName: activity.student.name,
      teacherName: activity.teacher.user.name,
      subject: activity.teacher.subject.name,
    }));

    // Map notifications
    const mappedNotifications = latestNotifications.map((notif) => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      link: notif.link,
      createdAt: notif.createdAt.toISOString(),
    }));

    // Map unpaid invoices
    const mappedInvoices = unpaidInvoices.map((inv) => ({
      id: inv.id,
      studentName: inv.student.name,
      amount: inv.amount,
      month: inv.month,
      year: inv.year,
      status: inv.status,
    }));

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.user.name,
        email: parent.user.email,
        phone: parent.phone,
      },
      children: childrenInfo,
      todaySchedule,
      weeklyTimetable,
      attendanceStatus,
      recentAbsences: mappedAbsences,
      recentActivities: mappedActivities,
      latestNotifications: mappedNotifications,
      unpaidInvoices: mappedInvoices,
      stats: {
        totalChildren: children.length,
        totalAbsences: recentAbsences.length,
        unreadNotifications: latestNotifications.filter((n) => !n.read).length,
        unpaidInvoicesCount: unpaidInvoices.length,
      },
    });
  } catch (error) {
    console.error('Parent dashboard error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOMEWORK: 'واجب منزلي',
    EXAM: 'امتحان',
    QUIZ: 'اختبار قصير',
    PARTICIPATION: 'مشاركة',
    BEHAVIOR: 'سلوك',
    NOTE: 'ملاحظة',
  };
  return labels[type] || 'نشاط';
}
