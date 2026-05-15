import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teacher/settings - Get teacher account settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Find user with teacher profile
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        teacher: {
          include: {
            subject: { select: { id: true, name: true, level: true } },
            institution: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!user.teacher) {
      return NextResponse.json(
        { error: 'حساب الأستاذ غير موجود' },
        { status: 404 }
      );
    }

    const teacher = user.teacher;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      teacher: {
        id: teacher.id,
        phone: teacher.phone,
        specialization: teacher.specialization,
        level: teacher.level,
        subject: teacher.subject
          ? {
              id: teacher.subject.id,
              name: teacher.subject.name,
              level: teacher.subject.level,
            }
          : null,
      },
      institution: teacher.institution
        ? {
            id: teacher.institution.id,
            name: teacher.institution.name,
            logo: teacher.institution.logo,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching teacher settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات الحساب', details: message },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/settings - Update teacher account settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone, specialization } = body as {
      userId: string;
      name?: string;
      phone?: string;
      specialization?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Verify user exists and is a teacher
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    if (!user.teacher) {
      return NextResponse.json(
        { error: 'حساب الأستاذ غير موجود' },
        { status: 404 }
      );
    }

    // Update user name if provided
    if (name && name.trim()) {
      await db.user.update({
        where: { id: userId },
        data: { name: name.trim() },
      });
    }

    // Update teacher info
    const teacherUpdateData: Record<string, unknown> = {};
    if (phone !== undefined) {
      teacherUpdateData.phone = phone.trim() || null;
    }
    if (specialization !== undefined) {
      teacherUpdateData.specialization = specialization.trim() || null;
    }

    if (Object.keys(teacherUpdateData).length > 0) {
      await db.teacher.update({
        where: { id: user.teacher.id },
        data: teacherUpdateData,
      });
    }

    // Fetch updated data
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        teacher: {
          include: {
            subject: { select: { id: true, name: true, level: true } },
            institution: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'تم تحديث الإعدادات بنجاح',
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
      },
      teacher: {
        id: updatedUser!.teacher!.id,
        phone: updatedUser!.teacher!.phone,
        specialization: updatedUser!.teacher!.specialization,
        level: updatedUser!.teacher!.level,
        subject: updatedUser!.teacher!.subject
          ? {
              id: updatedUser!.teacher!.subject.id,
              name: updatedUser!.teacher!.subject.name,
              level: updatedUser!.teacher!.subject.level,
            }
          : null,
      },
      institution: updatedUser!.teacher!.institution
        ? {
            id: updatedUser!.teacher!.institution.id,
            name: updatedUser!.teacher!.institution.name,
            logo: updatedUser!.teacher!.institution.logo,
          }
        : null,
    });
  } catch (error) {
    console.error('Error updating teacher settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في تحديث الإعدادات', details: message },
      { status: 500 }
    );
  }
}

// POST /api/teacher/settings - Change password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body as {
      userId: string;
      currentPassword: string;
      newPassword: string;
    };

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Verify current password (plain text comparison for demo)
    if (!currentPassword.trim()) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية مطلوبة' },
        { status: 400 }
      );
    }

    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });

    return NextResponse.json({
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في تغيير كلمة المرور', details: message },
      { status: 500 }
    );
  }
}
