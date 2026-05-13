import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const search = searchParams.get('search');
    const level = searchParams.get('level');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { institutionId };

    if (level) where.level = level;
    if (search) {
      where.user = { name: { contains: search } };
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, name: true, level: true } },
        supervisedSections: {
          include: {
            year: { select: { name: true, level: true } },
            students: { select: { id: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const mapped = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      level: teacher.level,
      subject: teacher.subject,
      phone: teacher.phone,
      specialization: teacher.specialization,
      supervisedSections: teacher.supervisedSections.map((s) => ({
        id: s.id,
        name: s.name,
        year: s.year,
        studentCount: s.students.length,
      })),
    }));

    return NextResponse.json({ teachers: mapped });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
