import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/years/[id] - Update a year
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, level, order } = body;

    // Check year exists
    const existing = await db.year.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'السنة الدراسية غير موجودة' }, { status: 404 });
    }

    // Validate level if provided
    if (level) {
      const validLevels = ['ابتدائي', 'متوسط', 'ثانوي'];
      if (!validLevels.includes(level)) {
        return NextResponse.json({ error: 'الطور الدراسي غير صالح' }, { status: 400 });
      }
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existing.name) {
      const duplicate = await db.year.findFirst({
        where: {
          name: name.trim(),
          institutionId: existing.institutionId,
          level: level || existing.level,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'يوجد سنة دراسية بنفس الاسم في هذا الطور' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (level !== undefined) updateData.level = level;
    if (order !== undefined) updateData.order = order;

    const year = await db.year.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ year: mapped });
  } catch (error) {
    console.error('Error updating year:', error);
    return NextResponse.json({ error: 'فشل في تحديث السنة الدراسية' }, { status: 500 });
  }
}

// DELETE /api/years/[id] - Delete a year (cascades to sections)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check year exists
    const existing = await db.year.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            students: { select: { id: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'السنة الدراسية غير موجودة' }, { status: 404 });
    }

    // Check if any sections have students
    const sectionsWithStudents = existing.sections.filter(
      (section) => section.students.length > 0
    );
    if (sectionsWithStudents.length > 0) {
      const totalStudents = sectionsWithStudents.reduce(
        (acc, section) => acc + section.students.length,
        0
      );
      return NextResponse.json(
        { error: `لا يمكن حذف السنة الدراسية لأن أقسامها تحتوي على ${totalStudents} تلميذ. يرجى نقل التلاميذ أولاً` },
        { status: 400 }
      );
    }

    // Delete will cascade to sections (which have no students)
    await db.year.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف السنة الدراسية وجميع أقسامها بنجاح' });
  } catch (error) {
    console.error('Error deleting year:', error);
    return NextResponse.json({ error: 'فشل في حذف السنة الدراسية' }, { status: 500 });
  }
}
