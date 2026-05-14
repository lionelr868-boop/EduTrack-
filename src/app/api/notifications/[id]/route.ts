import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// DELETE /api/notifications/[id] - Delete a notification by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الإشعار مطلوب' },
        { status: 400 }
      );
    }

    // Check if notification exists
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود' },
        { status: 404 }
      );
    }

    // Delete the notification
    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الإشعار بنجاح',
    });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
