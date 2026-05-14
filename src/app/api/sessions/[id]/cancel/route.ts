import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/sessions/[id]/cancel - Cancel session + create notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'يرجى إدخال سبب الإلغاء' },
        { status: 400 }
      );
    }

    const session = await db.session.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'الحصة غير موجودة' }, { status: 404 });
    }

    if (session.status === 'CANCELLED') {
      return NextResponse.json({ error: 'الحصة ملغاة بالفعل' }, { status: 400 });
    }

    // Update session status
    const updated = await db.session.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
      },
    });

    // Create absence record for the teacher
    await db.absence.create({
      data: {
        teacherId: session.teacherId,
        sessionId: session.id,
        reason,
        absenceType: 'TEACHER',
        notificationSent: true,
      },
    });

    // Create notifications for parents of students in this level
    const students = await db.student.findMany({
      where: {
        institutionId: session.institutionId,
        level: session.level,
      },
      include: {
        parent: { include: { user: true } },
      },
    });

    const notifications = students
      .filter(s => s.parent?.user)
      .map(s => ({
        userId: s.parent!.user.id,
        message: `تم إلغاء حصة ${session.subject.name} يوم ${['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][session.dayOfWeek]} الساعة ${session.startTime}. السبب: ${reason}`,
        type: 'CANCELLATION',
      }));

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      message: 'تم إلغاء الحصة وإشعار أولياء الأمور',
      session: updated,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    return NextResponse.json({ error: 'فشل في إلغاء الحصة' }, { status: 500 });
  }
}
