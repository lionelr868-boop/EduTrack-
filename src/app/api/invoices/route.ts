import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const level = searchParams.get('level');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { institutionId };

    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;
    if (level) {
      where.student = { level };
    }
    if (search) {
      where.student = {
        ...(where.student as Record<string, unknown>),
        name: { contains: search },
      };
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, level: true } },
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    // Summary stats
    const allInvoices = await db.invoice.findMany({
      where: { institutionId, ...(month ? { month: parseInt(month) } : {}), ...(year ? { year: parseInt(year) } : {}) },
      select: { amount: true, status: true },
    });

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = allInvoices.filter((inv) => inv.status === 'PAID');
    const pendingInvoices = allInvoices.filter((inv) => inv.status === 'PENDING');
    const overdueInvoices = allInvoices.filter((inv) => inv.status === 'OVERDUE');

    const summary = {
      totalRevenue,
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      pendingCount: pendingInvoices.length,
      pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    };

    return NextResponse.json({
      invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
