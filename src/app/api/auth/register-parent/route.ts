import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/auth/register-parent - Register a parent with their children
export async function POST(request: Request) {
  try {
    const { name, email, password, phone, institutionId, children } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبون' },
        { status: 400 }
      );
    }

    if (!institutionId) {
      return NextResponse.json(
        { error: 'يجب اختيار المؤسسة' },
        { status: 400 }
      );
    }

    if (!children || !Array.isArray(children) || children.length === 0) {
      return NextResponse.json(
        { error: 'يجب اختيار ابن واحد على الأقل' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      );
    }

    // Verify institution exists
    const institution = await db.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) {
      return NextResponse.json(
        { error: 'المؤسسة غير موجودة' },
        { status: 400 }
      );
    }

    // Verify all student IDs exist and belong to the institution
    const studentIds = children.map((c: { studentId: string }) => c.studentId);
    const students = await db.student.findMany({
      where: {
        id: { in: studentIds },
        institutionId,
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'بعض التلاميذ المحددين غير موجودين أو لا ينتمون لهذه المؤسسة' },
        { status: 400 }
      );
    }

    // Check if any of these students already have a parent
    const studentsWithParent = students.filter((s) => s.parentId !== null);
    if (studentsWithParent.length > 0) {
      const names = studentsWithParent.map((s) => s.name).join('، ');
      return NextResponse.json(
        { error: `التلميذ(ذة) "${names}" لديه(ا) ولي أمر مسجل بالفعل` },
        { status: 400 }
      );
    }

    // Create user with PARENT role
    const user = await db.user.create({
      data: {
        name,
        email,
        password: `hashed_${password}`,
        role: 'PARENT',
        institutionId,
      },
    });

    // Create parent record
    const parent = await db.parent.create({
      data: {
        userId: user.id,
        phone: phone || null,
      },
    });

    // Link students to this parent
    await db.student.updateMany({
      where: { id: { in: studentIds } },
      data: { parentId: parent.id },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: institution.id,
      parentId: parent.id,
    });
  } catch (error) {
    console.error('Parent register error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
