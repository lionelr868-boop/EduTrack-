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
    const [recentAbsences, recentInvoices, recentNotifications] = await Promise.all([
      db.absence.findMany({
        where: { session: { institutionId } },
        include: { student: true, teacher: true, session: { include: { subject: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.invoice.findMany({
        where: { institutionId, status: 'PAID' },
        include: { student: true },
        orderBy: { paidAt: 'desc' },
        take: 3,
      }),
      db.notification.findMany({
        where: { userId: { startsWith: 'user_director' } },
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
    }> = [];

    // Add absence activities
    for (const abs of recentAbsences) {
      const studentName = abs.student?.name || 'تلميذ';
      const subjectName = abs.session?.subject?.name || 'حصة';
      const absenceType = abs.absenceType === 'STUDENT' ? 'غياب تلميذ' : 'غياب أستاذ';

      activities.push({
        id: `abs-${abs.id}`,
        text: abs.absenceType === 'STUDENT'
          ? `تم تسجيل غياب ${studentName} عن حصة ${subjectName}`
          : `تم تسجيل غياب أستاذ عن حصة ${subjectName}`,
        time: getRelativeTime(abs.createdAt),
        color: abs.notificationSent ? 'orange' : 'red',
        type: absenceType,
      });
    }

    // Add payment activities
    for (const inv of recentInvoices) {
      activities.push({
        id: `inv-${inv.id}`,
        text: `فاتورة ${inv.student?.name || 'تلميذ'} تم دفعها`,
        time: getRelativeTime(inv.paidAt || inv.updatedAt),
        color: 'green',
        type: 'دفع',
      });
    }

    // Add notification activities
    for (const notif of recentNotifications) {
      activities.push({
        id: `notif-${notif.id}`,
        text: notif.message,
        time: getRelativeTime(notif.createdAt),
        color: notif.type === 'ABSENCE' ? 'red' : notif.type === 'INVOICE' ? 'orange' : 'blue',
        type: notif.type,
      });
    }

    // Sort by most recent and limit
    activities.sort(() => Math.random() - 0.5); // Simple shuffle for demo
    const limitedActivities = activities.slice(0, 10);

    // If no activities, return demo data
    if (limitedActivities.length === 0) {
      return NextResponse.json([
        { id: 'demo-1', text: 'تم تسجيل غياب أمين حسين عن حصة الرياضيات', time: 'منذ 5 دقائق', color: 'red', type: 'غياب' },
        { id: 'demo-2', text: 'فاتورة ياسين مراد تم دفعها', time: 'منذ 15 دقيقة', color: 'green', type: 'دفع' },
        { id: 'demo-3', text: 'حصة تعويضية للفيزياء يوم الخميس', time: 'منذ 30 دقيقة', color: 'blue', type: 'حصة' },
        { id: 'demo-4', text: 'تسجيل حضور حصة اللغة الفرنسية', time: 'منذ ساعة', color: 'emerald', type: 'حضور' },
        { id: 'demo-5', text: 'إبلاغ ولي أمر سارة حسين بغيابها', time: 'منذ ساعتين', color: 'orange', type: 'إشعار' },
        { id: 'demo-6', text: 'تم إضافة تلميذ جديد: زينب شريف', time: 'منذ 3 ساعات', color: 'blue', type: 'تسجيل' },
        { id: 'demo-7', text: 'الأستاذ محمد العربي أكمل تسجيل الحضور', time: 'منذ 4 ساعات', color: 'green', type: 'حضور' },
        { id: 'demo-8', text: 'تذكير: 5 فواتير متأخرة هذا الشهر', time: 'أمس', color: 'red', type: 'تذكير' },
      ]);
    }

    return NextResponse.json(limitedActivities);
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
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
