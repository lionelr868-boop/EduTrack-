import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 403 });
    }

    // Sequential lightweight queries to avoid memory spikes
    const totalInstitutions = await db.institution.count();
    const activeInstitutions = await db.institution.count({ where: { frozen: false } });
    const frozenInstitutions = await db.institution.count({ where: { frozen: true } });
    const institutionsByPlan = await db.institution.groupBy({ by: ['subscriptionPlan'], _count: { id: true } });
    const usersByRole = await db.user.groupBy({ by: ['role'], _count: { id: true } });
    const totalStudents = await db.student.count();
    const totalTeachers = await db.teacher.count();
    const totalParents = await db.parent.count();

    const paidInvoicesAggregate = await db.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } });
    const pendingInvoicesAggregate = await db.invoice.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } });

    const recentInstitutions = await db.institution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, subscriptionPlan: true, frozen: true, createdAt: true, city: true,
        _count: { select: { students: true, teachers: true, users: true } },
      },
    });

    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { institution: { select: { id: true, name: true } } },
    });

    // Simplified monthly revenue - single query approach
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const recentPaidInvoices = await db.invoice.findMany({
      where: { status: 'PAID', paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    });

    const recentPaidPayments = await db.payment.findMany({
      where: { status: 'PAID', paidAt: { gte: sixMonthsAgo } },
      select: { amount: true, paidAt: true },
    });

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const invSum = recentPaidInvoices
        .filter(inv => inv.paidAt && new Date(inv.paidAt) >= monthStart && new Date(inv.paidAt) <= monthEnd)
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const paySum = recentPaidPayments
        .filter(p => p.paidAt && new Date(p.paidAt) >= monthStart && new Date(p.paidAt) <= monthEnd)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' }),
        invoiceRevenue: invSum,
        paymentRevenue: paySum,
        total: invSum + paySum,
      });
    }

    // Growth
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const newInstThis = await db.institution.count({ where: { createdAt: { gte: lastMonth } } });
    const newInstLast = await db.institution.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } });
    const newStuThis = await db.student.count({ where: { createdAt: { gte: lastMonth } } });
    const newStuLast = await db.student.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } });
    const newUsrThis = await db.user.count({ where: { createdAt: { gte: lastMonth } } });
    const newUsrLast = await db.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } });

    const calcGrowth = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : curr > 0 ? '100.0' : '0.0';

    return NextResponse.json({
      institutions: {
        total: totalInstitutions, active: activeInstitutions, frozen: frozenInstitutions,
        byPlan: institutionsByPlan.map(item => ({ plan: item.subscriptionPlan, count: item._count.id })),
      },
      users: {
        byRole: usersByRole.map(item => ({ role: item.role, count: item._count.id })),
        total: usersByRole.reduce((sum, item) => sum + item._count.id, 0),
      },
      students: totalStudents,
      teachers: totalTeachers,
      parents: totalParents,
      revenue: { total: paidInvoicesAggregate._sum.amount || 0, pending: pendingInvoicesAggregate._sum.amount || 0 },
      recentInstitutions,
      recentPayments,
      monthlyRevenue,
      growth: {
        institutions: { thisMonth: newInstThis, lastMonth: newInstLast, growthPercent: calcGrowth(newInstThis, newInstLast) },
        students: { thisMonth: newStuThis, lastMonth: newStuLast, growthPercent: calcGrowth(newStuThis, newStuLast) },
        users: { thisMonth: newUsrThis, lastMonth: newUsrLast, growthPercent: calcGrowth(newUsrThis, newUsrLast) },
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل لوحة التحكم' }, { status: 500 });
  }
}
