import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

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
