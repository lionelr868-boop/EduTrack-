import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { institutionName, address, phone, directorName, email, password, plan } = await request.json();

    // Validate required fields
    if (!institutionName || !directorName || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
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

    // Create institution
    const institution = await db.institution.create({
      data: {
        name: institutionName,
        address: address || null,
        phone: phone || null,
        subscriptionPlan: plan || 'FREE',
      },
    });

    // Create director user
    const user = await db.user.create({
      data: {
        name: directorName,
        email,
        password: `hashed_${password}`,
        role: 'DIRECTOR',
        institutionId: institution.id,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: institution.id,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
