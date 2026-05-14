import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/sections - Create a new section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, yearId, institutionId, capacity, supervisorId } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم القسم مطلوب' }, { status: 400 });
    }
    if (!yearId) {
      return NextResponse.json({ error: 'السنة الدراسية مطلوبة' }, { status: 400 });
    }
    if (!institutionId) {
      return NextResponse.json({ error: 'معرف المؤسسة مطلوب' }, { status: 400 });
    }

    // Verify year exists and belongs to the institution
    const year = await db.year.findFirst({
      where: { id: yearId, institutionId },
    });
    if (!year) {
      return NextResponse.json({ error: 'السنة الدراسية غير موجودة أو لا تنتمي لهذه المؤسسة' }, { status: 400 });
    }

    // Validate supervisor if provided
    if (supervisorId) {
      const supervisor = await db.teacher.findFirst({
        where: { id: supervisorId, institutionId },
      });
      if (!supervisor) {
        return NextResponse.json({ error: 'المشرف غير موجود أو لا ينتمي لهذه المؤسسة' }, { status: 400 });
      }
    }

    const section = await db.section.create({
      data: {
        name: name.trim(),
        yearId,
        institutionId,
        capacity: capacity || 30,
        supervisorId: supervisorId || null,
      },
      include: {
        year: { select: { id: true, name: true, level: true, order: true } },
        supervisor: {
          include: {
            user: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        students: { select: { id: true } },
      },
    });

    const mapped = {
      id: section.id,
      name: section.name,
      capacity: section.capacity,
      year: section.year,
      supervisor: section.supervisor
        ? {
            id: section.supervisor.id,
            name: section.supervisor.user.name,
            subject: section.supervisor.subject.name,
          }
        : null,
      studentCount: section.students.length,
    };

    return NextResponse.json({ section: mapped }, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'فشل في إنشاء القسم' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const yearId = searchParams.get('yearId');
    const level = searchParams.get('level');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId مطلوب' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { institutionId };
    if (yearId) where.yearId = yearId;
    if (level) where.year = { level };

    const sections = await db.section.findMany({
      where,
      include: {
        year: { select: { id: true, name: true, level: true, order: true } },
        supervisor: {
          include: {
            user: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        students: {
          select: { id: true, name: true, level: true },
        },
        sessions: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            subject: { select: { name: true } },
            teacher: { include: { user: { select: { name: true } } } },
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ year: { order: 'asc' } }, { name: 'asc' }],
    });

    const arabicDays = [
      'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];

    const mapped = sections.map((section) => ({
      id: section.id,
      name: section.name,
      capacity: section.capacity,
      year: section.year,
      supervisor: section.supervisor
        ? {
            id: section.supervisor.id,
            name: section.supervisor.user.name,
            subject: section.supervisor.subject.name,
          }
        : null,
      studentCount: section.students.length,
      students: section.students,
      // Timetable summary: sessions grouped by day
      timetable: section.sessions.reduce(
        (acc, session) => {
          const dayName = arabicDays[session.dayOfWeek] || 'غير محدد';
          if (!acc[dayName]) acc[dayName] = [];
          acc[dayName].push({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            subject: session.subject.name,
            teacher: session.teacher.user.name,
          });
          return acc;
        },
        {} as Record<string, Array<{
          id: string;
          startTime: string;
          endTime: string;
          subject: string;
          teacher: string;
        }>>
      ),
      totalSessions: section.sessions.length,
    }));

    return NextResponse.json({ sections: mapped });
  } catch (error) {
    console.error('Sections error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
