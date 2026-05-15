import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        teacher: true,
        parent: true,
        institution: {
          select: {
            id: true,
            name: true,
            frozen: true,
            frozenReason: true,
            subscriptionPlan: true,
          },
        },
      },
    });

    if (!user || user.password !== `hashed_${password}`) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { error: 'حسابك معطل، يرجى التواصل مع الإدارة' },
        { status: 403 }
      );
    }

    // Check if institution is frozen (for DIRECTOR and TEACHER roles)
    if (
      (user.role === 'DIRECTOR' || user.role === 'TEACHER') &&
      user.institution?.frozen
    ) {
      return NextResponse.json(
        {
          error: 'المؤسسة مجمدة، يرجى التواصل مع إدارة المنصة',
          institutionFrozen: true,
          frozenReason: user.institution.frozenReason,
        },
        { status: 403 }
      );
    }

    // Build response
    const response: Record<string, unknown> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      teacherId: user.teacher?.id || undefined,
      parentId: user.parent?.id || undefined,
      institutionFrozen: false,
    };

    // Admin-specific response
    if (user.role === 'ADMIN') {
      response.redirect = '/admin-dashboard';
    }

    // Include institution info for non-admin users
    if (user.institution && user.role !== 'ADMIN') {
      response.institution = {
        id: user.institution.id,
        name: user.institution.name,
        subscriptionPlan: user.institution.subscriptionPlan,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
