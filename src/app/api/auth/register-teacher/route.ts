import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      institutionId,
      level,
      subjectId,
      phone,
      specialization,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !institutionId || !level || !subjectId) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      );
    }

    // Validate institution exists and is not frozen
    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 404 }
      );
    }

    if (institution.frozen) {
      return NextResponse.json(
        { error: 'المؤسسة مجمدة، لا يمكن إضافة معلمين جدد' },
        { status: 400 }
      );
    }

    // Validate subject belongs to institution
    const subject = await db.subject.findFirst({
      where: {
        id: subjectId,
        institutionId,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'المادة غير موجودة في هذه المؤسسة' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    // Create user with role TEACHER
    const user = await db.user.create({
      data: {
        name,
        email,
        password: `hashed_${password}`,
        role: 'TEACHER',
        active: true,
        institutionId,
        teacher: {
          create: {
            institutionId,
            level,
            subjectId,
            phone,
            specialization,
          },
        },
      },
      include: {
        teacher: {
          include: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
        institution: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'تم تسجيل المعلم بنجاح',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          teacher: user.teacher
            ? {
                id: user.teacher.id,
                level: user.teacher.level,
                subject: user.teacher.subject,
                phone: user.teacher.phone,
                specialization: user.teacher.specialization,
              }
            : null,
          institution: user.institution,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Teacher registration error:', error);
    return NextResponse.json(
      { error: 'خطأ في تسجيل المعلم' },
      { status: 500 }
    );
  }
}
