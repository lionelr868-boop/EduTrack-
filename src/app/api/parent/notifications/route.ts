import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parent/notifications - Fetch notifications for a parent user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'يرجى تحديد معرف المستخدم' },
        { status: 400 }
      );
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = notifications.map(n => ({
      id: n.id,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: mapped });
  } catch (error) {
    console.error('Error fetching parent notifications:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الإشعارات' },
      { status: 500 }
    );
  }
}

// PUT /api/parent/notifications - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAll, userId } = body;

    if (markAll && userId) {
      // Mark all notifications as read for this user
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({ success: true, message: 'تم تعليم الكل كمقروء' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'يرجى تحديد الإشعار' },
        { status: 400 }
      );
    }

    // Mark single notification as read
    const notification = await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث الإشعار' },
      { status: 500 }
    );
  }
}
