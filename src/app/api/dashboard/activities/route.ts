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

    // Fetch recent data from different sources
    const [
      recentAbsences,
      recentInvoices,
      recentStudents,
      recentActivities,
    ] = await Promise.all([
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
      db.invoice.findMany({
        where: { institutionId, status: 'PAID' },
        include: { student: { select: { id: true, name: true } } },
        orderBy: { paidAt: 'desc' },
        take: 3,
      }),
      db.student.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, name: true, createdAt: true },
      }),
      db.studentActivity.findMany({
        where: { section: { institutionId } },
        include: {
          student: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { name: true } }, subject: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Build activity feed
    const activities: Array<{
      id: string;
      text: string;
      time: string;
      color: string;
      type: string;
      timestamp: string;
    }> = [];

    // Add absence activities
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

    // Add payment activities
    for (const inv of recentInvoices) {
      activities.push({
        id: `inv-${inv.id}`,
        text: `فاتورة ${inv.student?.name || 'تلميذ'} تم دفعها - ${Math.round(inv.amount).toLocaleString()} دج`,
        time: getRelativeTime(inv.paidAt || inv.updatedAt),
        color: 'green',
        type: 'دفع',
        timestamp: new Date(inv.paidAt || inv.updatedAt).toISOString(),
      });
    }

    // Add new student activities
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

    // Add student activity/grade activities
    for (const activity of recentActivities) {
      const teacherName = activity.teacher?.user?.name || 'أستاذ';
      let text = '';
      const typeLabel = getActivityTypeLabel(activity.type);

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

    // Sort by timestamp (most recent first) and limit
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const limitedActivities = activities.slice(0, 15);

    return NextResponse.json(limitedActivities);
  } catch (error) {
    console.error('Activities error:', error);
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
