import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/parent/settings - Get parent account settings
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

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Find parent profile
    const parent = await db.parent.findFirst({
      where: { userId },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'حساب ولي الأمر غير موجود' },
        { status: 404 }
      );
    }

    // Get institution info
    const institution = await db.institution.findUnique({
      where: { id: user.institutionId },
      select: { id: true, name: true, logo: true },
    });

    // Get children list
    const children = await db.student.findMany({
      where: { parentId: parent.id },
      include: {
        section: {
          include: {
            year: true,
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      parent: {
        id: parent.id,
        phone: parent.phone,
      },
      institution: institution
        ? {
            id: institution.id,
            name: institution.name,
            logo: institution.logo,
          }
        : null,
      children: children.map((child) => ({
        id: child.id,
        name: child.name,
        level: child.level,
        section: child.section
          ? {
              id: child.section.id,
              name: child.section.name,
              year: child.section.year
                ? {
                    id: child.section.year.id,
                    name: child.section.year.name,
                  }
                : null,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching parent settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في جلب إعدادات الحساب', details: message },
      { status: 500 }
    );
  }
}

// PUT /api/parent/settings - Update parent account settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, phone } = body as {
      userId: string;
      name?: string;
      phone?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Verify user exists and is a parent
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const parent = await db.parent.findFirst({
      where: { userId },
    });

    if (!parent) {
      return NextResponse.json(
        { error: 'حساب ولي الأمر غير موجود' },
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

    // Update parent info
    const parentUpdateData: Record<string, unknown> = {};
    if (phone !== undefined) {
      parentUpdateData.phone = phone.trim() || null;
    }

    if (Object.keys(parentUpdateData).length > 0) {
      await db.parent.update({
        where: { id: parent.id },
        data: parentUpdateData,
      });
    }

    // Fetch updated data
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
    });

    const updatedParent = await db.parent.findFirst({
      where: { userId },
    });

    // Get institution info
    const institution = await db.institution.findUnique({
      where: { id: updatedUser!.institutionId },
      select: { id: true, name: true, logo: true },
    });

    // Get children list
    const children = await db.student.findMany({
      where: { parentId: updatedParent!.id },
      include: {
        section: {
          include: {
            year: true,
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
      parent: {
        id: updatedParent!.id,
        phone: updatedParent!.phone,
      },
      institution: institution
        ? {
            id: institution.id,
            name: institution.name,
            logo: institution.logo,
          }
        : null,
      children: children.map((child) => ({
        id: child.id,
        name: child.name,
        level: child.level,
        section: child.section
          ? {
              id: child.section.id,
              name: child.section.name,
              year: child.section.year
                ? {
                    id: child.section.year.id,
                    name: child.section.year.name,
                  }
                : null,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error updating parent settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في تحديث الإعدادات', details: message },
      { status: 500 }
    );
  }
}

// PATCH /api/parent/settings - Update children assignments
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, addStudentIds, removeStudentIds } = body as {
      userId: string;
      addStudentIds?: string[];
      removeStudentIds?: string[];
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const parent = await db.parent.findFirst({ where: { userId } });
    if (!parent) {
      return NextResponse.json({ error: 'حساب ولي الأمر غير موجود' }, { status: 404 });
    }

    // Remove students from this parent
    if (removeStudentIds && removeStudentIds.length > 0) {
      await db.student.updateMany({
        where: { id: { in: removeStudentIds }, parentId: parent.id },
        data: { parentId: null },
      });
    }

    // Add students to this parent
    if (addStudentIds && addStudentIds.length > 0) {
      // Verify students belong to the same institution and don't have a parent
      const students = await db.student.findMany({
        where: { id: { in: addStudentIds }, institutionId: user.institutionId },
      });

      const studentsWithParent = students.filter((s) => s.parentId !== null && s.parentId !== parent.id);
      if (studentsWithParent.length > 0) {
        const names = studentsWithParent.map((s) => s.name).join('، ');
        return NextResponse.json(
          { error: `التلميذ(ذة) "${names}" لديه(ا) ولي أمر آخر` },
          { status: 400 }
        );
      }

      const validIds = students.map((s) => s.id);
      await db.student.updateMany({
        where: { id: { in: validIds } },
        data: { parentId: parent.id },
      });
    }

    // Return updated children list
    const children = await db.student.findMany({
      where: { parentId: parent.id },
      include: {
        section: { include: { year: true } },
      },
    });

    return NextResponse.json({
      message: 'تم تحديث الأبناء بنجاح',
      children: children.map((child) => ({
        id: child.id,
        name: child.name,
        level: child.level,
        section: child.section
          ? {
              id: child.section.id,
              name: child.section.name,
              year: child.section.year
                ? { id: child.section.year.id, name: child.section.year.name }
                : null,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error updating children:', error);
    return NextResponse.json(
      { error: 'فشل في تحديث الأبناء' },
      { status: 500 }
    );
  }
}

// POST /api/parent/settings - Change password
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
