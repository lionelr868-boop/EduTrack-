import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    // Get all parents whose students belong to this institution
    const parents = await db.parent.findMany({
      where: {
        students: {
          some: { institutionId },
        },
      },
      select: {
        id: true,
        phone: true,
        user: { select: { name: true, email: true } },
      },
    });

    const formatted = parents.map((p) => ({
      id: p.id,
      name: p.user.name,
      phone: p.phone,
    }));

    return NextResponse.json({ parents: formatted });
  } catch (error) {
    console.error('Error fetching parents:', error);
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
  }
}
