import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/institutions - List all institutions (for parent registration dropdown)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? { name: { contains: search } }
      : {};

    const institutions = await db.institution.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        wilaya: true,
        logo: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Institutions fetch error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
