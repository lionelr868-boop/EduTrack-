import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const pricing = await db.pricing.findMany({
      where: { institutionId },
      include: {
        subject: { select: { id: true, name: true, level: true } },
      },
      orderBy: { subject: { name: 'asc' } },
    });

    const formatted = pricing.map((p) => ({
      id: p.id,
      subjectId: p.subjectId,
      subjectName: p.subject.name,
      level: p.level,
      pricePerSession: p.pricePerSession,
    }));

    return NextResponse.json({ pricing: formatted });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, subjectId, level, pricePerSession } = body;

    if (!institutionId || !subjectId || !level || pricePerSession === undefined) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const pricing = await db.pricing.create({
      data: {
        institutionId,
        subjectId,
        level,
        pricePerSession: parseFloat(pricePerSession),
      },
      include: {
        subject: { select: { id: true, name: true, level: true } },
      },
    });

    return NextResponse.json(pricing, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing:', error);
    return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 });
  }
}
