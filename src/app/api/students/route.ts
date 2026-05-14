import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const search = searchParams.get('search');
    const level = searchParams.get('level');
    const sectionId = searchParams.get('sectionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { institutionId };

    if (level) where.level = level;
    if (sectionId) where.sectionId = sectionId;
    if (search) {
      where.name = { contains: search };
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              userId: true,
              phone: true,
              user: { select: { name: true, email: true } },
            },
          },
          section: {
            include: {
              year: { select: { id: true, name: true, level: true, order: true } },
              supervisor: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, level, institutionId, parentId, sectionId } = body;

    if (!name || !level || !institutionId) {
      return NextResponse.json({ error: 'name, level, and institutionId are required' }, { status: 400 });
    }

    const student = await db.student.create({
      data: {
        name,
        level,
        institutionId,
        parentId: parentId || null,
        sectionId: sectionId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            userId: true,
            phone: true,
            user: { select: { name: true, email: true } },
          },
        },
        section: {
          include: {
            year: { select: { name: true, level: true } },
          },
        },
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
