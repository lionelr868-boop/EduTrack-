import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paidAt, paymentMethod } = body;

    if (!paymentMethod) {
      return NextResponse.json({ error: 'paymentMethod is required' }, { status: 400 });
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMethod,
        updatedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true, level: true } },
        lineItems: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json({ error: 'Failed to mark invoice as paid' }, { status: 500 });
  }
}
