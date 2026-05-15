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

    const landingContent = await db.landingContent.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(landingContent);
  } catch (error) {
    console.error('Admin landing content list error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل محتوى الصفحة الرئيسية' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { section, title, subtitle, content, enabled = true, order = 0 } = body;

    if (!section) {
      return NextResponse.json(
        { error: 'اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    // Check if section already exists
    const existing = await db.landingContent.findUnique({
      where: { section },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هذا القسم موجود بالفعل' },
        { status: 409 }
      );
    }

    const landingItem = await db.landingContent.create({
      data: {
        section,
        title,
        subtitle,
        content,
        enabled,
        order,
      },
    });

    return NextResponse.json(landingItem, { status: 201 });
  } catch (error) {
    console.error('Admin landing content create error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء المحتوى' },
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
    const { id, section, title, subtitle, content, enabled, order } = body;

    if (!id && !section) {
      return NextResponse.json(
        { error: 'معرف أو اسم القسم مطلوب' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (content !== undefined) updateData.content = content;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (order !== undefined) updateData.order = order;

    let updated;

    if (id) {
      updated = await db.landingContent.update({
        where: { id },
        data: updateData,
      });
    } else {
      updated = await db.landingContent.update({
        where: { section: section as string },
        data: updateData,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin landing content update error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث المحتوى' },
      { status: 500 }
    );
  }
}
