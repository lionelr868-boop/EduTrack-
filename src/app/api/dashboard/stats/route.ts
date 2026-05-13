import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId مطلوب' },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayDay = now.getDay();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Run queries in separate try-catches to identify issues
    const totalStudents = await db.student.count({ where: { institutionId } });
    const totalTeachers = await db.teacher.count({ where: { institutionId } });
    const todaySessions = await db.session.findMany({
      where: { institutionId, dayOfWeek: todayDay },
    });

    // Get all session IDs for this institution for attendance/absence queries
    const institutionSessions = await db.session.findMany({
      where: { institutionId },
      select: { id: true, dayOfWeek: true },
    });
    const sessionIds = institutionSessions.map((s) => s.id);

    // Attendance
    const allAttendances = sessionIds.length > 0
      ? await db.attendance.findMany({
          where: { sessionId: { in: sessionIds } },
        })
      : [];

    // Absences
    const allAbsences = sessionIds.length > 0
      ? await db.absence.findMany({
          where: { sessionId: { in: sessionIds } },
        })
      : [];

    // Paid invoices
    const paidInvoices = await db.invoice.findMany({
      where: { institutionId, status: 'PAID' },
    });

    // Students for level distribution
    const students = await db.student.findMany({
      where: { institutionId },
      select: { level: true },
    });

    // Sections for level grouping
    const sections = await db.section.findMany({
      where: { institutionId },
      include: {
        year: { select: { level: true } },
        students: { select: { id: true } },
      },
    });

    // Calculate attendance rate
    const totalAttendanceRecords = allAttendances.length;
    const presentCount = allAttendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100)
        : 100;

    // Monthly revenue (current month)
    const monthlyRevenue = paidInvoices
      .filter((inv) => inv.month === currentMonth && inv.year === currentYear)
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Unexcused absences
    const unexcusedAbsences = allAbsences.filter(
      (a) => a.absenceType === 'STUDENT' && !a.notificationSent
    ).length;

    // Students by level distribution
    const studentsByLevel: Record<string, number> = {};
    for (const student of students) {
      studentsByLevel[student.level] = (studentsByLevel[student.level] || 0) + 1;
    }

    // Sections by level
    const sectionsByLevel: Record<string, number> = {};
    for (const section of sections) {
      const level = section.year?.level || 'غير محدد';
      sectionsByLevel[level] = (sectionsByLevel[level] || 0) + 1;
    }

    // Revenue trend (last 6 months)
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const revenueTrend: Array<{ month: string; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      const monthRevenue = paidInvoices
        .filter((inv) => inv.month === monthNum && inv.year === yearNum)
        .reduce((sum, inv) => sum + inv.amount, 0);
      revenueTrend.push({
        month: arabicMonths[date.getMonth()],
        revenue: Math.round(monthRevenue),
      });
    }

    // Attendance trend (by day of week)
    const arabicDays = [
      'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];

    const attendanceTrend: Array<{ day: string; rate: number }> = [];
    for (let day = 0; day < 7; day++) {
      const daySessionIds = institutionSessions
        .filter((s) => s.dayOfWeek === day)
        .map((s) => s.id);
      const dayAttendances = allAttendances.filter(
        (a) => daySessionIds.includes(a.sessionId)
      );
      const dayPresent = dayAttendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const dayTotal = dayAttendances.length;
      attendanceTrend.push({
        day: arabicDays[day],
        rate: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
      });
    }

    // Absence distribution (student vs teacher)
    const studentAbsenceCount = allAbsences.filter(
      (a) => a.absenceType === 'STUDENT'
    ).length;
    const teacherAbsenceCount = allAbsences.filter(
      (a) => a.absenceType === 'TEACHER'
    ).length;

    const totalSessions = institutionSessions.length;

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      attendanceRate: Math.min(attendanceRate, 100),
      revenue: Math.round(monthlyRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      unexcusedAbsences,
      todaySessions: todaySessions.length,
      totalSessions,
      studentAbsences: studentAbsenceCount,
      teacherAbsences: teacherAbsenceCount,
      studentsByLevel,
      sectionsByLevel,
      revenueTrend,
      attendanceTrend,
      absenceDistribution: {
        student: studentAbsenceCount,
        teacher: teacherAbsenceCount,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
