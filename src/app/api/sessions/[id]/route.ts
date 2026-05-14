import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT /api/sessions/[id] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subjectId, teacherId, dayOfWeek, startTime, endTime, level, repeatType, status } = body;

    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
    }

    // Check for conflicts if time/teacher/level changed
    if (dayOfWeek !== undefined || startTime !== undefined || endTime !== undefined || teacherId !== undefined || level !== undefined) {
      const checkDay = dayOfWeek ?? existing.dayOfWeek;
      const checkStart = startTime ?? existing.startTime;
      const checkEnd = endTime ?? existing.endTime;
      const checkTeacher = teacherId ?? existing.teacherId;
      const checkLevel = level ?? existing.level;

      const conflicts = await db.session.findMany({
        where: {
          id: { not: id },
          institutionId: existing.institutionId,
          status: { not: 'CANCELLED' },
          dayOfWeek: Number(checkDay),
          OR: [
            { teacherId: checkTeacher },
            { level: checkLevel },
          ],
          startTime: { lt: checkEnd },
          endTime: { gt: checkStart },
        },
      });

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'يوجد تعارض في الجدول!', conflicts },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = Number(dayOfWeek);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (level !== undefined) updateData.level = level;
    if (repeatType !== undefined) updateData.repeatType = repeatType;
    if (status !== undefined) updateData.status = status;

    const session = await db.session.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      id: session.id,
      subjectId: session.subjectId,
      subjectName: session.subject.name,
      teacherId: session.teacherId,
      teacherName: session.teacher.user.name,
      institutionId: session.institutionId,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      level: session.level,
      repeatType: session.repeatType,
      cancelReason: session.cancelReason,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'فشل في تحديث الحصة' }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
    }

    await db.session.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف الحصة بنجاح' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'فشل في حذف الحصة' }, { status: 500 });
  }
}
