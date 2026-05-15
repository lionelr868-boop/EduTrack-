import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    // Total institutions
    const totalInstitutions = await db.institution.count();
    const activeInstitutions = await db.institution.count({
      where: { frozen: false },
    });
    const frozenInstitutions = await db.institution.count({
      where: { frozen: true },
    });

    // Institutions by plan
    const institutionsByPlan = await db.institution.groupBy({
      by: ['subscriptionPlan'],
      _count: { id: true },
    });

    // Total users by role
    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    // Total students, teachers, parents
    const totalStudents = await db.student.count();
    const totalTeachers = await db.teacher.count();
    const totalParents = await db.parent.count();

    // Revenue from paid invoices
    const paidInvoicesAggregate = await db.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });
    const totalRevenue = paidInvoicesAggregate._sum.amount || 0;

    // Pending payments
    const pendingInvoicesAggregate = await db.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    });
    const pendingPayments = pendingInvoicesAggregate._sum.amount || 0;

    // Recent institutions (last 5)
    const recentInstitutions = await db.institution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        frozen: true,
        createdAt: true,
        city: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
          },
        },
      },
    });

    // Recent payments
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        institution: {
          select: { id: true, name: true },
        },
      },
    });

    // Monthly revenue trend (last 6 months)
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = await db.invoice.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
        _sum: { amount: true },
      });

      const paymentRevenue = await db.payment.aggregate({
        where: {
          status: 'PAID',
          paidAt: {
            gte: monthDate,
            lte: monthEnd,
          },
        },
        _sum: { amount: true },
      });

      monthlyRevenue.push({
        month: monthDate.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' }),
        invoiceRevenue: monthRevenue._sum.amount || 0,
        paymentRevenue: paymentRevenue._sum.amount || 0,
        total: (monthRevenue._sum.amount || 0) + (paymentRevenue._sum.amount || 0),
      });
    }

    // Platform growth metrics
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const newInstitutionsThisMonth = await db.institution.count({
      where: { createdAt: { gte: lastMonth } },
    });
    const newInstitutionsLastMonth = await db.institution.count({
      where: {
        createdAt: { gte: twoMonthsAgo, lt: lastMonth },
      },
    });

    const newStudentsThisMonth = await db.student.count({
      where: { createdAt: { gte: lastMonth } },
    });
    const newStudentsLastMonth = await db.student.count({
      where: {
        createdAt: { gte: twoMonthsAgo, lt: lastMonth },
      },
    });

    const newUsersThisMonth = await db.user.count({
      where: { createdAt: { gte: lastMonth } },
    });
    const newUsersLastMonth = await db.user.count({
      where: {
        createdAt: { gte: twoMonthsAgo, lt: lastMonth },
      },
    });

    const institutionGrowth = newInstitutionsLastMonth > 0
      ? ((newInstitutionsThisMonth - newInstitutionsLastMonth) / newInstitutionsLastMonth * 100).toFixed(1)
      : newInstitutionsThisMonth > 0 ? '100.0' : '0.0';

    const studentGrowth = newStudentsLastMonth > 0
      ? ((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth * 100).toFixed(1)
      : newStudentsThisMonth > 0 ? '100.0' : '0.0';

    const userGrowth = newUsersLastMonth > 0
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : newUsersThisMonth > 0 ? '100.0' : '0.0';

    return NextResponse.json({
      institutions: {
        total: totalInstitutions,
        active: activeInstitutions,
        frozen: frozenInstitutions,
        byPlan: institutionsByPlan.map((item) => ({
          plan: item.subscriptionPlan,
          count: item._count.id,
        })),
      },
      users: {
        byRole: usersByRole.map((item) => ({
          role: item.role,
          count: item._count.id,
        })),
        total: usersByRole.reduce((sum, item) => sum + item._count.id, 0),
      },
      students: totalStudents,
      teachers: totalTeachers,
      parents: totalParents,
      revenue: {
        total: totalRevenue,
        pending: pendingPayments,
      },
      recentInstitutions,
      recentPayments,
      monthlyRevenue,
      growth: {
        institutions: {
          thisMonth: newInstitutionsThisMonth,
          lastMonth: newInstitutionsLastMonth,
          growthPercent: institutionGrowth,
        },
        students: {
          thisMonth: newStudentsThisMonth,
          lastMonth: newStudentsLastMonth,
          growthPercent: studentGrowth,
        },
        users: {
          thisMonth: newUsersThisMonth,
          lastMonth: newUsersLastMonth,
          growthPercent: userGrowth,
        },
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل لوحة التحكم' },
      { status: 500 }
    );
  }
}
