import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const institutionId = searchParams.get('institutionId') || '';
    const plan = searchParams.get('plan') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    if (plan) {
      where.plan = plan;
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          institution: {
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionPlan: true,
              frozen: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Summary stats — compute across ALL payments (not just current page)
    const [paidAgg, pendingAgg, failedAgg, totalPayments, paidCount, pendingCount, failedCount] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: 'FAILED' }, _sum: { amount: true } }),
      db.payment.count(),
      db.payment.count({ where: { status: 'PAID' } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.payment.count({ where: { status: 'FAILED' } }),
    ]);

    const paidAmount = paidAgg._sum.amount || 0;
    const pendingAmount = pendingAgg._sum.amount || 0;
    const failedAmount = failedAgg._sum.amount || 0;

    return NextResponse.json({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalAmount: paidAmount + pendingAmount + failedAmount,
        paidAmount,
        pendingAmount,
        failedAmount,
        totalPayments,
        paidCount,
        pendingCount,
        failedCount,
      },
    });
  } catch (error) {
    console.error('Admin payments list error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل المدفوعات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      institutionId,
      amount,
      plan,
      periodMonths = 1,
      paymentMethod,
      transactionRef,
      notes,
      dueDate,
      status = 'PENDING',
    } = body;

    if (!institutionId || !amount || !plan) {
      return NextResponse.json(
        { error: 'معرف المؤسسة والمبلغ والخطة مطلوبون' },
        { status: 400 }
      );
    }

    // Validate institution exists
    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 404 }
      );
    }

    const payment = await db.payment.create({
      data: {
        institutionId,
        amount: parseFloat(amount),
        plan,
        periodMonths,
        paymentMethod,
        transactionRef,
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Admin payment create error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء الدفعة' },
      { status: 500 }
    );
  }
}
