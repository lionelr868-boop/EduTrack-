import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/absences/[id]/notify - Resend notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const absence = await db.absence.findUnique({
      where: { id },
      include: {
        student: { include: { parent: { include: { user: true } } } },
        teacher: { include: { user: true } },
        session: { include: { subject: true } },
      },
    });

    if (!absence) {
      return NextResponse.json(
        { error: 'سجل الغياب غير موجود' },
        { status: 404 }
      );
    }

    // Create notification
    const targetUser = absence.absenceType === 'STUDENT'
      ? absence.student?.parent?.user
      : null;

    if (targetUser) {
      await db.notification.create({
        data: {
          userId: targetUser.id,
          message: `تذكير: غياب ${absence.student?.name || 'التلميذ'} عن حصة ${absence.session?.subject?.name || ''}`,
          type: 'ABSENCE',
        },
      });
    }

    // Update notification status
    await db.absence.update({
      where: { id },
      data: { notificationSent: true },
    });

    return NextResponse.json({
      message: 'تم إعادة إرسال الإشعار بنجاح',
    });
  } catch (error) {
    console.error('Error resending notification:', error);
    return NextResponse.json(
      { error: 'فشل في إعادة إرسال الإشعار' },
      { status: 500 }
    );
  }
}
