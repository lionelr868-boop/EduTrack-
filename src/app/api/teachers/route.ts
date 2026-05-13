import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const search = searchParams.get('search');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { institutionId };

    if (search) {
      where.user = { name: { contains: search } };
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, level: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
