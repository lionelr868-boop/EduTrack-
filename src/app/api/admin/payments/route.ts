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
    if (status) where.status = status;
    if (institutionId) where.institutionId = institutionId;
    if (plan) where.plan = plan;

    // Run paginated data + count in parallel
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
              subscriptionPlan: true,
              frozen: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Summary stats — lightweight approach: get all payments and compute in JS
    const allPayments = await db.payment.findMany({
      select: { amount: true, status: true },
    });

    const summary = {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      totalPayments: allPayments.length,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
    };

    for (const p of allPayments) {
      summary.totalAmount += p.amount || 0;
      if (p.status === 'PAID') {
        summary.paidAmount += p.amount || 0;
        summary.paidCount++;
      } else if (p.status === 'PENDING') {
        summary.pendingAmount += p.amount || 0;
        summary.pendingCount++;
      } else if (p.status === 'FAILED') {
        summary.failedAmount += p.amount || 0;
        summary.failedCount++;
      }
    }

    return NextResponse.json({
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
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
          select: { id: true, name: true, subscriptionPlan: true },
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
