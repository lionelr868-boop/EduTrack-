import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Arabic locale constants
const ARABIC_DAYS = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت',
];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const LEVEL_COLORS: Record<string, string> = {
  'ابتدائي': '#10B981',
  'متوسط': '#F59E0B',
  'ثانوي': '#8B5CF6',
};

// ─── Helper: Relative time in Arabic ──────────────────────────────────────────
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
}

// ─── Helper: Activity type label in Arabic ────────────────────────────────────
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

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const userId = searchParams.get('userId'); // optional, for notifications

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId مطلوب' },
        { status: 400 },
      );
    }

    const now = new Date();
    const todayDay = now.getDay(); // 0=Sunday
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // ──────────────────────────────────────────────────────────────────────────
    // PHASE 1: Parallel independent queries
    // ──────────────────────────────────────────────────────────────────────────
    const [
      totalStudents,
      totalTeachers,
      totalSections,
      totalYears,
      todaySessionsCount,
      allSessions,
      allInvoices,
      allStudents,
      allSectionsWithYear,
      yearsWithSections,
      teachersWithData,
      allAbsences,
      allAttendances,
      recentAbsences,
      recentPaidInvoices,
      recentStudents,
      recentStudentActivities,
      notificationsSummary,
    ] = await Promise.all([
      // 1. Basic counts
      db.student.count({ where: { institutionId } }),
      db.teacher.count({ where: { institutionId } }),
      db.section.count({ where: { institutionId } }),
      db.year.count({ where: { institutionId } }),
      db.session.count({ where: { institutionId, dayOfWeek: todayDay } }),

      // 2. All sessions (needed for attendance/absence queries + totalSessions + dayOfWeek mapping)
      db.session.findMany({
        where: { institutionId },
        select: { id: true, dayOfWeek: true },
      }),

      // 3. All invoices for revenue calculations
      db.invoice.findMany({
        where: { institutionId },
        select: {
          id: true,
          amount: true,
          month: true,
          year: true,
          status: true,
          paidAt: true,
          updatedAt: true,
        },
      }),

      // 4. All students for level distribution
      db.student.findMany({
        where: { institutionId },
        select: { level: true },
      }),

      // 5. Sections with year info for sections-by-level
      db.section.findMany({
        where: { institutionId },
        include: {
          year: { select: { level: true } },
          students: { select: { id: true } },
        },
      }),

      // 6. Years with sections hierarchy
      db.year.findMany({
        where: { institutionId },
        include: {
          sections: {
            include: {
              students: { select: { id: true } },
              supervisor: {
                include: { user: { select: { name: true } } },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [{ level: 'asc' }, { order: 'asc' }],
      }),

      // 7. Teachers with their subject and supervised sections
      db.teacher.findMany({
        where: { institutionId },
        include: {
          user: { select: { name: true, email: true } },
          subject: { select: { id: true, name: true } },
          supervisedSections: {
            include: {
              year: { select: { name: true, level: true } },
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
      }),

      // 8. All absences for this institution's sessions
      db.absence.findMany({
        where: { session: { institutionId } },
        select: {
          id: true,
          absenceType: true,
          notificationSent: true,
          createdAt: true,
          student: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { name: true } } } },
          session: { include: { subject: { select: { name: true } } } },
        },
      }),

      // 9. All attendances for this institution's sessions
      db.attendance.findMany({
        where: { session: { institutionId } },
        include: {
          session: { select: { dayOfWeek: true } },
        },
      }),

      // 10. Recent absences for activity feed
      db.absence.findMany({
        where: { session: { institutionId } },
        include: {
          student: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { name: true } } } },
          session: { include: { subject: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 11. Recent paid invoices for activity feed
      db.invoice.findMany({
        where: { institutionId, status: 'PAID' },
        include: { student: { select: { id: true, name: true } } },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),

      // 12. Recent new students for activity feed
      db.student.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, createdAt: true },
      }),

      // 13. Recent student activities for activity feed
      db.studentActivity.findMany({
        where: { section: { institutionId } },
        include: {
          student: { select: { id: true, name: true } },
          teacher: {
            include: {
              user: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 14. Notifications summary (for the director user)
      userId
        ? Promise.all([
            db.notification.count({
              where: { userId, read: false },
            }),
            db.notification.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                title: true,
                message: true,
                type: true,
                read: true,
                createdAt: true,
              },
            }),
          ])
        : Promise.resolve([0, []] as const),
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // PHASE 2: Compute all derived data
    // ──────────────────────────────────────────────────────────────────────────
    const sessionIds = allSessions.map((s) => s.id);
    const totalSessions = allSessions.length;

    // ─── 1. Basic Stats ──────────────────────────────────────────────────────
    const totalAttendanceRecords = allAttendances.length;
    const presentCount = allAttendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.min(Math.round((presentCount / totalAttendanceRecords) * 100), 100)
        : 100;

    const paidInvoices = allInvoices.filter((inv) => inv.status === 'PAID');
    const monthlyRevenue = paidInvoices
      .filter((inv) => inv.month === currentMonth && inv.year === currentYear)
      .reduce((sum, inv) => sum + inv.amount, 0);

    const unexcusedAbsences = allAbsences.filter(
      (a) => a.absenceType === 'STUDENT' && !a.notificationSent,
    ).length;

    const studentAbsenceCount = allAbsences.filter(
      (a) => a.absenceType === 'STUDENT',
    ).length;
    const teacherAbsenceCount = allAbsences.filter(
      (a) => a.absenceType === 'TEACHER',
    ).length;

    const pendingInvoices = allInvoices.filter(
      (inv) => inv.status === 'PENDING',
    ).length;
    const overdueInvoices = allInvoices.filter(
      (inv) => inv.status === 'OVERDUE',
    ).length;

    // ─── 2. Revenue Trend (last 6 months) ───────────────────────────────────
    const revenueTrend: Array<{ month: string; revenue: number; paidInvoices: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      const monthPaid = paidInvoices.filter(
        (inv) => inv.month === monthNum && inv.year === yearNum,
      );
      const monthRevenue = monthPaid.reduce((sum, inv) => sum + inv.amount, 0);
      revenueTrend.push({
        month: ARABIC_MONTHS[date.getMonth()],
        revenue: Math.round(monthRevenue),
        paidInvoices: monthPaid.length,
      });
    }

    // ─── 3. Attendance Trend (by day of week) ───────────────────────────────
    const attendanceTrend: Array<{ day: string; rate: number }> = [];
    for (let day = 0; day < 7; day++) {
      const daySessionIds = allSessions
        .filter((s) => s.dayOfWeek === day)
        .map((s) => s.id);
      const dayAttendances = allAttendances.filter((a) =>
        daySessionIds.includes(a.sessionId),
      );
      const dayPresent = dayAttendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE',
      ).length;
      const dayTotal = dayAttendances.length;
      attendanceTrend.push({
        day: ARABIC_DAYS[day],
        rate: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0,
      });
    }

    // ─── 4. Students by Level ───────────────────────────────────────────────
    const studentsByLevelMap: Record<string, number> = {};
    for (const student of allStudents) {
      studentsByLevelMap[student.level] =
        (studentsByLevelMap[student.level] || 0) + 1;
    }
    const studentsByLevel = Object.entries(studentsByLevelMap).map(
      ([level, count]) => ({
        level,
        count,
        color: LEVEL_COLORS[level] || '#94A3B8',
      }),
    );

    // ─── 5. Sections by Level ───────────────────────────────────────────────
    const sectionsByLevelMap: Record<string, number> = {};
    for (const section of allSectionsWithYear) {
      const level = section.year?.level || 'غير محدد';
      sectionsByLevelMap[level] = (sectionsByLevelMap[level] || 0) + 1;
    }
    const sectionsByLevel = Object.entries(sectionsByLevelMap).map(
      ([level, count]) => ({ level, count }),
    );

    // ─── 6. Years with Sections hierarchy ───────────────────────────────────
    const yearsHierarchy = yearsWithSections.map((year) => ({
      id: year.id,
      name: year.name,
      level: year.level,
      order: year.order,
      sections: year.sections.map((section) => ({
        id: section.id,
        name: section.name,
        studentCount: section.students.length,
        supervisorName: section.supervisor?.user?.name || null,
        capacity: section.capacity,
      })),
    }));

    // ─── 7. Teachers with their data ────────────────────────────────────────
    const teachers = teachersWithData.map((teacher) => ({
      id: teacher.id,
      name: teacher.user.name,
      subjectName: teacher.subject.name,
      level: teacher.level,
      phone: teacher.phone || null,
      supervisedSections: teacher.supervisedSections.map((sec) => ({
        id: sec.id,
        name: sec.name,
        yearName: sec.year?.name || '',
      })),
    }));

    // ─── 8. Absence Distribution ────────────────────────────────────────────
    const absenceDistribution = {
      student: studentAbsenceCount,
      teacher: teacherAbsenceCount,
    };

    // ─── 9. Recent Activities (last 15) ────────────────────────────────────
    const activities: Array<{
      id: string;
      text: string;
      time: string;
      color: string;
      type: string;
      timestamp: string;
    }> = [];

    // Absence activities
    for (const abs of recentAbsences) {
      const studentName = abs.student?.name || 'تلميذ';
      const subjectName = abs.session?.subject?.name || 'حصة';
      activities.push({
        id: `abs-${abs.id}`,
        text:
          abs.absenceType === 'STUDENT'
            ? `تم تسجيل غياب ${studentName} عن حصة ${subjectName}`
            : `تم تسجيل غياب أستاذ عن حصة ${subjectName}`,
        time: getRelativeTime(abs.createdAt),
        color: abs.notificationSent ? 'orange' : 'red',
        type: abs.absenceType === 'STUDENT' ? 'غياب تلميذ' : 'غياب أستاذ',
        timestamp: new Date(abs.createdAt).toISOString(),
      });
    }

    // Payment activities
    for (const inv of recentPaidInvoices) {
      activities.push({
        id: `inv-${inv.id}`,
        text: `فاتورة ${inv.student?.name || 'تلميذ'} تم دفعها - ${Math.round(inv.amount).toLocaleString()} دج`,
        time: getRelativeTime(inv.paidAt || inv.updatedAt),
        color: 'green',
        type: 'دفع',
        timestamp: new Date(inv.paidAt || inv.updatedAt).toISOString(),
      });
    }

    // New student registrations
    for (const student of recentStudents) {
      activities.push({
        id: `student-${student.id}`,
        text: `تم تسجيل تلميذ جديد: ${student.name}`,
        time: getRelativeTime(student.createdAt),
        color: 'blue',
        type: 'تسجيل',
        timestamp: new Date(student.createdAt).toISOString(),
      });
    }

    // Student activity/grade activities
    for (const activity of recentStudentActivities) {
      const teacherName = activity.teacher?.user?.name || 'أستاذ';
      const typeLabel = getActivityTypeLabel(activity.type);
      let text = '';

      if (activity.grade !== null && activity.maxGrade !== null) {
        text = `${activity.student.name} حصل على ${activity.grade}/${activity.maxGrade} في ${activity.title} (${teacherName})`;
      } else {
        text = `${teacherName} أضاف ${typeLabel}: ${activity.title} لـ ${activity.student.name}`;
      }

      activities.push({
        id: `act-${activity.id}`,
        text,
        time: getRelativeTime(activity.createdAt),
        color: 'emerald',
        type: typeLabel,
        timestamp: new Date(activity.createdAt).toISOString(),
      });
    }

    // Sort by timestamp (most recent first) and limit to 15
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const recentActivities = activities.slice(0, 15).map(({ timestamp, ...rest }) => rest);

    // ─── 10. Notifications Summary ──────────────────────────────────────────
    const [unreadCount, latestNotifications] = notificationsSummary;
    const notifications = {
      unreadCount,
      latest: latestNotifications.map((n: { id: string; title: string | null; message: string; type: string; read: boolean; createdAt: Date }) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: new Date(n.createdAt).toISOString(),
      })),
    };

    // ──────────────────────────────────────────────────────────────────────────
    // PHASE 3: Return unified response
    // ──────────────────────────────────────────────────────────────────────────
    return NextResponse.json({
      // 1. Basic Stats
      totalStudents,
      totalTeachers,
      totalSections,
      totalYears,
      attendanceRate,
      monthlyRevenue: Math.round(monthlyRevenue),
      revenue: Math.round(monthlyRevenue),
      unexcusedAbsences,
      todaySessionsCount,
      totalSessions,
      studentAbsences: studentAbsenceCount,
      teacherAbsences: teacherAbsenceCount,
      pendingInvoices,
      overdueInvoices,

      // 2. Revenue Trend (last 6 months)
      revenueTrend,

      // 3. Attendance Trend (by day of week)
      attendanceTrend,

      // 4. Students by Level
      studentsByLevel,

      // 5. Sections by Level
      sectionsByLevel,

      // 6. Years with Sections hierarchy
      yearsHierarchy,

      // 7. Teachers with their data
      teachers,

      // 8. Absence Distribution
      absenceDistribution,

      // 9. Recent Activities (last 15)
      recentActivities,

      // 10. Notifications Summary
      notifications,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 },
    );
  }
}
