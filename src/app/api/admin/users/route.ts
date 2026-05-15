import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const institutionId = searchParams.get('institutionId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (institutionId) {
      where.institutionId = institutionId;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true,
          institution: {
            select: {
              id: true,
              name: true,
              subscriptionPlan: true,
              frozen: true,
            },
          },
          teacher: {
            select: {
              id: true,
              level: true,
              phone: true,
              specialization: true,
              subject: {
                select: { id: true, name: true },
              },
            },
          },
          parent: {
            select: {
              id: true,
              phone: true,
              _count: {
                select: { students: true },
              },
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل المستخدمين' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, active } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'حالة التفعيل مطلوبة' },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { active },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin user toggle error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث حالة المستخدم' },
      { status: 500 }
    );
  }
}
