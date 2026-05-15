import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/sections/[id] - Update a section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, capacity, supervisorId, yearId } = body;

    // Check section exists
    const existing = await db.section.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'القسم غير موجود' }, { status: 404 });
    }

    // Validate yearId if provided
    if (yearId) {
      const year = await db.year.findFirst({
        where: { id: yearId, institutionId: existing.institutionId },
      });
      if (!year) {
        return NextResponse.json(
          { error: 'السنة الدراسية غير موجودة أو لا تنتمي لهذه المؤسسة' },
          { status: 400 }
        );
      }
    }

    // Validate supervisor if provided
    if (supervisorId) {
      const supervisor = await db.teacher.findFirst({
        where: { id: supervisorId, institutionId: existing.institutionId },
      });
      if (!supervisor) {
        return NextResponse.json(
          { error: 'المشرف غير موجود أو لا ينتمي لهذه المؤسسة' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (capacity !== undefined) updateData.capacity = capacity;
    if (yearId !== undefined) updateData.yearId = yearId;
    if (supervisorId !== undefined) updateData.supervisorId = supervisorId || null;

    const section = await db.section.update({
      where: { id },
      data: updateData,
      include: {
        year: { select: { id: true, name: true, level: true, order: true } },
        supervisor: {
          include: {
            user: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        students: { select: { id: true } },
      },
    });

    const mapped = {
      id: section.id,
      name: section.name,
      capacity: section.capacity,
      year: section.year,
      supervisor: section.supervisor
        ? {
            id: section.supervisor.id,
            name: section.supervisor.user.name,
            subject: section.supervisor.subject.name,
          }
        : null,
      studentCount: section.students.length,
    };

    return NextResponse.json({ section: mapped });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'فشل في تحديث القسم' }, { status: 500 });
  }
}

// DELETE /api/sections/[id] - Delete a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check section exists
    const existing = await db.section.findUnique({
      where: { id },
      include: {
        students: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'القسم غير موجود' }, { status: 404 });
    }

    if (existing.students.length > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف القسم لأنه يحتوي على ${existing.students.length} تلميذ. يرجى نقل التلاميذ أولاً` },
        { status: 400 }
      );
    }

    await db.section.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف القسم بنجاح' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: 'فشل في حذف القسم' }, { status: 500 });
  }
}
