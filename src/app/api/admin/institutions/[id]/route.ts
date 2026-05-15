import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const institution = await db.institution.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            subjects: true,
            sessions: true,
            invoices: true,
            payments: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        subjects: {
          select: {
            id: true,
            name: true,
            level: true,
            _count: {
              select: { teachers: true, sessions: true },
            },
          },
        },
      },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 404 }
      );
    }

    // Revenue stats
    const revenueStats = await db.payment.aggregate({
      where: {
        institutionId: id,
        status: 'PAID',
      },
      _sum: { amount: true },
    });

    const pendingPayments = await db.payment.aggregate({
      where: {
        institutionId: id,
        status: 'PENDING',
      },
      _sum: { amount: true },
    });

    // Invoice stats
    const invoiceStats = await db.invoice.aggregate({
      where: { institutionId: id },
      _sum: { amount: true },
      _count: true,
    });

    const paidInvoiceStats = await db.invoice.aggregate({
      where: {
        institutionId: id,
        status: 'PAID',
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      ...institution,
      stats: {
        revenue: revenueStats._sum.amount || 0,
        pendingPayments: pendingPayments._sum.amount || 0,
        totalInvoices: invoiceStats._count,
        totalInvoiceAmount: invoiceStats._sum.amount || 0,
        paidInvoices: paidInvoiceStats._count,
        paidInvoiceAmount: paidInvoiceStats._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Admin institution detail error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل بيانات المؤسسة' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      address,
      phone,
      email,
      website,
      city,
      wilaya,
      directorName,
      subscriptionPlan,
      maxStudents,
      freeze,
      frozen: frozenField,
      frozenReason,
    } = body;

    // Support both `freeze` and `frozen` field names
    const frozenValue = frozenField !== undefined ? frozenField : freeze;

    // Check institution exists
    const existing = await db.institution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Regular field updates
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (city !== undefined) updateData.city = city;
    if (wilaya !== undefined) updateData.wilaya = wilaya;
    if (directorName !== undefined) updateData.directorName = directorName;
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
    if (maxStudents !== undefined) updateData.maxStudents = maxStudents;

    // Freeze/unfreeze logic (supports both `freeze` and `frozen` fields)
    if (frozenValue === true) {
      updateData.frozen = true;
      updateData.frozenAt = new Date();
      updateData.frozenReason = frozenReason || 'تم تجميد الحساب من قبل الإدارة';
    } else if (frozenValue === false) {
      updateData.frozen = false;
      updateData.frozenAt = null;
      updateData.frozenReason = null;
    }

    const updated = await db.institution.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin institution update error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المؤسسة' },
      { status: 500 }
    );
  }
}
