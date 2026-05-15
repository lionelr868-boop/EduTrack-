import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/years - Create a new year
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, level, order, institutionId } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم السنة الدراسية مطلوب' }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: 'الطور الدراسي مطلوب' }, { status: 400 });
    }
    if (!institutionId) {
      return NextResponse.json({ error: 'معرف المؤسسة مطلوب' }, { status: 400 });
    }

    const validLevels = ['ابتدائي', 'متوسط', 'ثانوي'];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'الطور الدراسي غير صالح' }, { status: 400 });
    }

    // Check for duplicate year name in same institution and level
    const existing = await db.year.findFirst({
      where: { name: name.trim(), institutionId, level },
    });
    if (existing) {
      return NextResponse.json({ error: 'يوجد سنة دراسية بنفس الاسم في هذا الطور' }, { status: 409 });
    }

    const year = await db.year.create({
      data: {
        name: name.trim(),
        level,
        order: order || 1,
        institutionId,
      },
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
    });

    const mapped = {
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
    };

    return NextResponse.json({ year: mapped }, { status: 201 });
  } catch (error) {
    console.error('Error creating year:', error);
    return NextResponse.json({ error: 'فشل في إنشاء السنة الدراسية' }, { status: 500 });
  }
}

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
