import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
    const { status, paymentMethod, transactionRef, notes } = body;

    // Check payment exists
    const existingPayment = await db.payment.findUnique({
      where: { id },
      include: { institution: true },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'الدفعة غير موجودة' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;
    if (notes !== undefined) updateData.notes = notes;

    if (status) {
      updateData.status = status;

      // When marking as paid
      if (status === 'PAID') {
        updateData.paidAt = new Date();

        // Update institution subscription plan and expiration
        const now = new Date();
        const currentExpiry = existingPayment.institution.subscriptionExpiresAt;
        const baseDate = currentExpiry && new Date(currentExpiry) > now
          ? new Date(currentExpiry)
          : now;

        const newExpiry = new Date(baseDate);
        newExpiry.setMonth(newExpiry.getMonth() + existingPayment.periodMonths);

        await db.institution.update({
          where: { id: existingPayment.institutionId },
          data: {
            subscriptionPlan: existingPayment.plan,
            subscriptionExpiresAt: newExpiry,
            // Unfreeze if currently frozen due to payment issues
            frozen: false,
            frozenAt: null,
            frozenReason: null,
          },
        });
      }

      // When marking as failed
      if (status === 'FAILED') {
        updateData.paidAt = null;
      }

      // When marking as refunded
      if (status === 'REFUNDED') {
        // Optionally revert subscription - keep plan but note refund
        updateData.paidAt = null;
      }
    }

    const updatedPayment = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Admin payment update error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث الدفعة' },
      { status: 500 }
    );
  }
}
