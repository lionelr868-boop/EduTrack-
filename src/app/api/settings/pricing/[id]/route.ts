import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subjectId, level, pricePerSession } = body;

    const updateData: Record<string, unknown> = {};
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (level !== undefined) updateData.level = level;
    if (pricePerSession !== undefined) updateData.pricePerSession = parseFloat(pricePerSession);

    const pricing = await db.pricing.update({
      where: { id },
      data: updateData,
      include: {
        subject: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.pricing.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json({ error: 'Failed to delete pricing' }, { status: 500 });
  }
}
