import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_SESSIONS, DEMO_TEACHERS, DEMO_SUBJECTS } from '@/lib/demo-data';

// GET /api/sessions - Fetch sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const teacherId = searchParams.get('teacherId');
    const subjectId = searchParams.get('subjectId');
    const level = searchParams.get('level');
    const dayOfWeek = searchParams.get('dayOfWeek');

    const where: Record<string, unknown> = {};
    if (institutionId) where.institutionId = institutionId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;
    if (level) where.level = level;
    if (dayOfWeek !== null) where.dayOfWeek = Number(dayOfWeek);

    const sessions = await db.session.findMany({
      where,
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // If no sessions in DB, return demo data
    if (sessions.length === 0 && !institutionId) {
      return NextResponse.json(DEMO_SESSIONS);
    }

    // Map to include subject name and teacher name
    const mapped = sessions.map(s => ({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.user.name,
      institutionId: s.institutionId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      level: s.level,
      repeatType: s.repeatType,
      cancelReason: s.cancelReason,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الحصص' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subjectId, teacherId, institutionId, dayOfWeek, startTime, endTime, level, repeatType } = body;

    if (!subjectId || !teacherId || !institutionId || dayOfWeek === undefined || !startTime || !endTime || !level) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await db.session.findMany({
      where: {
        institutionId,
        status: { not: 'CANCELLED' },
        dayOfWeek: Number(dayOfWeek),
        OR: [
          { teacherId },
          { level },
        ],
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'يوجد تعارض في الجدول! يرجى اختيار وقت أو أستاذ آخر', conflicts },
        { status: 409 }
      );
    }

    const session = await db.session.create({
      data: {
        subjectId,
        teacherId,
        institutionId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        level,
        repeatType: repeatType || 'WEEKLY',
        status: 'SCHEDULED',
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      id: session.id,
      subjectId: session.subjectId,
      subjectName: session.subject.name,
      teacherId: session.teacherId,
      teacherName: session.teacher.user.name,
      institutionId: session.institutionId,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      level: session.level,
      repeatType: session.repeatType,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء الحصة' },
      { status: 500 }
    );
  }
}
