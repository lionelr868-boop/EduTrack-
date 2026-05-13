import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId مطلوب' },
        { status: 400 }
      );
    }

    const years = await db.year.findMany({
      where: { institutionId },
      include: {
        sections: {
          include: {
            students: { select: { id: true } },
            supervisor: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
    });

    // Group by level
    const groupedByLevel: Record<string, Array<{
      id: string;
      name: string;
      level: string;
      order: number;
      sections: Array<{
        id: string;
        name: string;
        studentCount: number;
        capacity: number;
        supervisor: { id: string; name: string } | null;
      }>;
    }>> = {};

    for (const year of years) {
      if (!groupedByLevel[year.level]) {
        groupedByLevel[year.level] = [];
      }

      groupedByLevel[year.level].push({
        id: year.id,
        name: year.name,
        level: year.level,
        order: year.order,
        sections: year.sections.map((section) => ({
          id: section.id,
          name: section.name,
          studentCount: section.students.length,
          capacity: section.capacity,
          supervisor: section.supervisor
            ? { id: section.supervisor.id, name: section.supervisor.user.name }
            : null,
        })),
      });
    }

    return NextResponse.json({
      years: years.map((year) => ({
        id: year.id,
        name: year.name,
        level: year.level,
        order: year.order,
        sections: year.sections.map((section) => ({
          id: section.id,
          name: section.name,
          studentCount: section.students.length,
          capacity: section.capacity,
          supervisor: section.supervisor
            ? { id: section.supervisor.id, name: section.supervisor.user.name }
            : null,
        })),
      })),
      groupedByLevel,
    });
  } catch (error) {
    console.error('Years error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
