import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (60s TTL)  
let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 403 });
    }

    // Return cached data if fresh
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData.data);
    }

    // Use raw SQL for maximum efficiency - single queries instead of multiple ORM calls
    const institutions = await db.institution.findMany({
      select: { id: true, name: true, subscriptionPlan: true, frozen: true, createdAt: true, city: true,
        _count: { select: { students: true, teachers: true, users: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const usersByRole = await db.user.groupBy({ by: ['role'], _count: { id: true } });
    const totalStudents = await db.student.count();
    const totalTeachers = await db.teacher.count();
    const totalParents = await db.parent.count();

    const paidAgg = await db.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } });
    const pendingAgg = await db.invoice.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } });

    const recentPayments = await db.payment.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { institution: { select: { id: true, name: true } } },
    });

    // Compute institution stats from the full list
    let activeInstitutions = 0;
    let frozenInstitutions = 0;
    const planMap = new Map<string, number>();
    for (const inst of institutions) {
      if (inst.frozen) frozenInstitutions++; else activeInstitutions++;
      planMap.set(inst.subscriptionPlan, (planMap.get(inst.subscriptionPlan) || 0) + 1);
    }

    // Monthly revenue - use invoice aggregate per month
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await db.invoice.aggregate({
        where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      });
      const total = agg._sum.amount || 0;
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' }),
        invoiceRevenue: total,
        paymentRevenue: 0,
        total,
      });
    }

    // Growth
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const [newInstThis, newInstLast, newStuThis, newStuLast, newUsrThis, newUsrLast] = await Promise.all([
      db.institution.count({ where: { createdAt: { gte: lastMonth } } }),
      db.institution.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } }),
      db.student.count({ where: { createdAt: { gte: lastMonth } } }),
      db.student.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } }),
      db.user.count({ where: { createdAt: { gte: lastMonth } } }),
      db.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: lastMonth } } }),
    ]);

    const calcGrowth = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : curr > 0 ? '100.0' : '0.0';

    const result = {
      institutions: {
        total: institutions.length, active: activeInstitutions, frozen: frozenInstitutions,
        byPlan: Array.from(planMap.entries()).map(([plan, count]) => ({ plan, count })),
      },
      users: {
        byRole: usersByRole.map(item => ({ role: item.role, count: item._count.id })),
        total: usersByRole.reduce((sum, item) => sum + item._count.id, 0),
      },
      students: totalStudents,
      teachers: totalTeachers,
      parents: totalParents,
      revenue: { total: paidAgg._sum.amount || 0, pending: pendingAgg._sum.amount || 0 },
      recentInstitutions: institutions.slice(0, 5),
      recentPayments,
      monthlyRevenue,
      growth: {
        institutions: { thisMonth: newInstThis, lastMonth: newInstLast, growthPercent: calcGrowth(newInstThis, newInstLast) },
        students: { thisMonth: newStuThis, lastMonth: newStuLast, growthPercent: calcGrowth(newStuThis, newStuLast) },
        users: { thisMonth: newUsrThis, lastMonth: newUsrLast, growthPercent: calcGrowth(newUsrThis, newUsrLast) },
      },
    };

    cachedData = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'خطأ في تحميل لوحة التحكم' }, { status: 500 });
  }
}
