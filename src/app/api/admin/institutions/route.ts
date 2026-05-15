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
    const plan = searchParams.get('plan') || '';
    const frozenParam = searchParams.get('frozen');
    const city = searchParams.get('city') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
        { directorName: { contains: search } },
      ];
    }

    if (plan) {
      where.subscriptionPlan = plan;
    }

    if (frozenParam !== null && frozenParam !== '') {
      where.frozen = frozenParam === 'true';
    }

    if (city) {
      where.city = { contains: city };
    }

    const [institutions, total] = await Promise.all([
      db.institution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          wilaya: true,
          phone: true,
          directorName: true,
          subscriptionPlan: true,
          frozen: true,
          frozenAt: true,
          frozenReason: true,
          subscriptionExpiresAt: true,
          maxStudents: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
              teachers: true,
              users: true,
              payments: true,
            },
          },
          payments: {
            where: { status: 'PAID' },
            select: { amount: true },
          },
        },
      }),
      db.institution.count({ where }),
    ]);

    const institutionsWithStats = institutions.map((inst) => ({
      ...inst,
      revenue: inst.payments.reduce((sum, p) => sum + p.amount, 0),
      payments: undefined,
    }));

    return NextResponse.json({
      institutions: institutionsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin institutions list error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل المؤسسات' },
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
    const {
      name,
      address,
      phone,
      email,
      website,
      city,
      wilaya,
      directorName,
      academicYear,
      subscriptionPlan = 'FREE',
      maxStudents = 50,
      directorEmail,
      directorPassword,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المؤسسة مطلوب' },
        { status: 400 }
      );
    }

    // Create institution
    const institution = await db.institution.create({
      data: {
        name,
        address,
        phone,
        email,
        website,
        city,
        wilaya,
        directorName,
        academicYear,
        subscriptionPlan,
        maxStudents,
      },
    });

    // Create director user if credentials provided
    if (directorEmail && directorPassword) {
      await db.user.create({
        data: {
          name: directorName || 'مدير المؤسسة',
          email: directorEmail,
          password: `hashed_${directorPassword}`,
          role: 'DIRECTOR',
          institutionId: institution.id,
        },
      });
    }

    return NextResponse.json(institution, { status: 201 });
  } catch (error) {
    console.error('Admin institution create error:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء المؤسسة' },
      { status: 500 }
    );
  }
}
