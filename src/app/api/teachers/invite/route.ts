import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subjectIds, institutionId } = body;

    if (!email || !institutionId) {
      return NextResponse.json({ error: 'email and institutionId are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser) {
      // Check if already a teacher in this institution
      const existingTeacher = await db.teacher.findFirst({
        where: { userId: existingUser.id, institutionId },
      });

      if (existingTeacher) {
        return NextResponse.json({ error: 'هذا الأستاذ مسجل بالفعل في المؤسسة' }, { status: 400 });
      }

      // Create teacher for existing user
      const teacher = await db.teacher.create({
        data: {
          userId: existingUser.id,
          institutionId,
          subjects: subjectIds?.length > 0
            ? {
                create: subjectIds.map((subjectId: string) => ({
                  subjectId,
                })),
              }
            : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          subjects: {
            include: {
              subject: { select: { id: true, name: true, level: true } },
            },
          },
        },
      });

      return NextResponse.json({ teacher, message: 'تم إضافة الأستاذ بنجاح' }, { status: 201 });
    }

    // Create new user with random password and teacher
    const newUser = await db.user.create({
      data: {
        name: email.split('@')[0],
        email,
        password: 'TEMP_PASSWORD_CHANGE_ME',
        role: 'TEACHER',
        institutionId,
      },
    });

    const teacher = await db.teacher.create({
      data: {
        userId: newUser.id,
        institutionId,
        subjects: subjectIds?.length > 0
          ? {
              create: subjectIds.map((subjectId: string) => ({
                subjectId,
              })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        subjects: {
          include: {
            subject: { select: { id: true, name: true, level: true } },
          },
        },
      },
    });

    return NextResponse.json({ teacher, message: 'تم إرسال الدعوة وإنشاء حساب الأستاذ بنجاح' }, { status: 201 });
  } catch (error) {
    console.error('Error inviting teacher:', error);
    return NextResponse.json({ error: 'Failed to invite teacher' }, { status: 500 });
  }
}
