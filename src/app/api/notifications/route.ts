import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/notifications - Fetch notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId مطلوب' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;
    if (unreadOnly) where.read = false;

    const [notifications, unreadCount, totalCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({
        where: { userId, read: false },
      }),
      db.notification.count({ where: { userId } }),
    ]);

    const mapped = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: mapped,
      unreadCount,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAll, userId } = body;

    if (markAll && userId) {
      // Mark all notifications as read for this user
      const result = await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      return NextResponse.json({
        success: true,
        message: `تم تعليم ${result.count} إشعار كمقروء`,
        updatedCount: result.count,
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'يرجى تحديد الإشعار أو تمرير markAll مع userId' },
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
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        link: notification.link,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
