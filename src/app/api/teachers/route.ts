import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/teachers - Create a new teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, institutionId, level, subjectId, phone, specialization } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الأستاذ مطلوب' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }
    if (!institutionId) {
      return NextResponse.json({ error: 'معرف المؤسسة مطلوب' }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: 'الطور الدراسي مطلوب' }, { status: 400 });
    }
    if (!subjectId) {
      return NextResponse.json({ error: 'المادة الدراسية مطلوبة' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email: email.trim() } });
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
    }

    // Verify subject exists and belongs to this institution and level
    const subject = await db.subject.findFirst({
      where: { id: subjectId, institutionId, level },
    });
    if (!subject) {
      return NextResponse.json({ error: 'المادة غير موجودة أو لا تنتمي لهذا الطور' }, { status: 400 });
    }

    // Create user first
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: `hashed_${password}`,
        role: 'TEACHER',
        institutionId,
      },
    });

    // Create teacher profile
    const teacher = await db.teacher.create({
      data: {
        userId: newUser.id,
        institutionId,
        level,
        subjectId,
        phone: phone?.trim() || null,
        specialization: specialization?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, name: true, level: true } },
        supervisedSections: {
          include: {
            year: { select: { name: true, level: true } },
            students: { select: { id: true } },
          },
        },
      },
    });

    // Create welcome notification for the teacher
    await db.notification.create({
      data: {
        userId: newUser.id,
        title: 'مرحباً بك',
        message: `تم إنشاء حسابك بنجاح في المنصة كمستاذ لمادة ${subject.name}`,
        type: 'SYSTEM',
        read: false,
      },
    });

    // Create notification for the director
    const directors = await db.user.findMany({
      where: { institutionId, role: 'DIRECTOR' },
    });
    for (const director of directors) {
      await db.notification.create({
        data: {
          userId: director.id,
          title: 'أستاذ جديد',
          message: `تم إضافة الأستاذ ${name.trim()} لمادة ${subject.name} (${level})`,
          type: 'SYSTEM',
          read: false,
          link: 'director-teachers',
        },
      });
    }

    const mapped = {
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      level: teacher.level,
      subject: teacher.subject,
      phone: teacher.phone,
      specialization: teacher.specialization,
      supervisedSections: teacher.supervisedSections.map((s) => ({
        id: s.id,
        name: s.name,
        year: s.year,
        studentCount: s.students.length,
      })),
    };

    return NextResponse.json({ teacher: mapped }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الأستاذ' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const search = searchParams.get('search');
    const level = searchParams.get('level');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { institutionId };

    if (level) where.level = level;
    if (search) {
      where.user = { name: { contains: search } };
    }

    const teachers = await db.teacher.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, name: true, level: true } },
        supervisedSections: {
          include: {
            year: { select: { name: true, level: true } },
            students: { select: { id: true } },
          },
        },
      },
      orderBy: { user: { name: 'asc' } },
    });

    const mapped = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.user.name,
      email: teacher.user.email,
      level: teacher.level,
      subject: teacher.subject,
      phone: teacher.phone,
      specialization: teacher.specialization,
      supervisedSections: teacher.supervisedSections.map((s) => ({
        id: s.id,
        name: s.name,
        year: s.year,
        studentCount: s.students.length,
      })),
    }));

    return NextResponse.json({ teachers: mapped });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
