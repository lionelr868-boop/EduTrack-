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

    const arabicDays = [
      'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];

    // Get all sessions for this institution
    const sessions = await db.session.findMany({
      where: { institutionId },
      select: { id: true, dayOfWeek: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    // Get all attendances for these sessions
    const attendances = await db.attendance.findMany({
      where: {
        sessionId: { in: sessionIds },
      },
      include: {
        session: { select: { dayOfWeek: true } },
      },
    });

    // Calculate attendance rate per day of week
    const dayStats: Record<number, { present: number; total: number }> = {};
    for (let day = 0; day < 7; day++) {
      dayStats[day] = { present: 0, total: 0 };
    }

    for (const att of attendances) {
      const dayOfWeek = att.session?.dayOfWeek;
      if (dayOfWeek !== undefined && dayOfWeek !== null) {
        dayStats[dayOfWeek].total++;
        if (att.status === 'PRESENT' || att.status === 'LATE') {
          dayStats[dayOfWeek].present++;
        }
      }
    }

    const data = Object.entries(dayStats).map(([day, stats]) => ({
      day: arabicDays[Number(day)],
      dayOfWeek: Number(day),
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      present: stats.present,
      total: stats.total,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Attendance chart error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
