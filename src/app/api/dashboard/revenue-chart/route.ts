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

    const now = new Date();

    // Fetch all paid invoices for this institution
    const invoices = await db.invoice.findMany({
      where: {
        institutionId,
        status: 'PAID',
      },
      select: {
        amount: true,
        month: true,
        year: true,
      },
    });

    // Build 6-month revenue data
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyRevenue[key] = 0;
    }

    for (const inv of invoices) {
      const key = `${inv.year}-${inv.month}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += inv.amount;
      }
    }

    const data = Object.entries(monthlyRevenue).map(([key, revenue]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month: arabicMonths[month - 1],
        revenue: Math.round(revenue),
        year,
        monthNumber: month,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Revenue chart error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
