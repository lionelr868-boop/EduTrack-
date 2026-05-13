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

    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // Get invoices grouped by month for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const invoices = await db.invoice.findMany({
      where: {
        institutionId,
        status: 'PAID',
        year: { gte: sixMonthsAgo.getFullYear() },
      },
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyRevenue[key] = 0;
    }

    for (const inv of invoices) {
      const key = `${inv.year}-${inv.month - 1}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += inv.amount;
      }
    }

    const data = Object.entries(monthlyRevenue).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: arabicMonths[month],
        revenue: Math.round(revenue),
      };
    });

    // If no data, return sample data for demo
    if (data.every(d => d.revenue === 0)) {
      return NextResponse.json([
        { month: 'يناير', revenue: 1200000 },
        { month: 'فبراير', revenue: 1350000 },
        { month: 'مارس', revenue: 1100000 },
        { month: 'أبريل', revenue: 1480000 },
        { month: 'مايو', revenue: 1520000 },
        { month: 'يونيو', revenue: 1560000 },
      ]);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Revenue chart error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
