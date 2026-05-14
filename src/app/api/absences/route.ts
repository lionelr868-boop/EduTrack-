import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEMO_ABSENCES } from '@/lib/demo-data';

// GET /api/absences - Fetch absences with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const absenceType = searchParams.get('absenceType');
    const subjectName = searchParams.get('subjectName');
    const notificationSent = searchParams.get('notificationSent');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};
    if (institutionId) {
      where.session = { institutionId };
    }
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (absenceType) where.absenceType = absenceType;
    if (notificationSent !== null) where.notificationSent = notificationSent === 'true';

    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + 'T23:59:59');
      where.createdAt = createdAt;
    }

    const absences = await db.absence.findMany({
      where,
      include: {
        student: true,
        teacher: { include: { user: { select: { name: true } } } },
        session: { include: { subject: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no absences in DB, return demo data
    if (absences.length === 0) {
      let filtered = [...DEMO_ABSENCES];
      if (absenceType) filtered = filtered.filter(a => a.absenceType === absenceType);
      if (notificationSent !== null) {
        const sent = notificationSent === 'true';
        filtered = filtered.filter(a => a.notificationSent === sent);
      }
      if (subjectName) filtered = filtered.filter(a => a.subjectName === subjectName);
      if (dateFrom) filtered = filtered.filter(a => a.createdAt >= dateFrom);
      if (dateTo) filtered = filtered.filter(a => a.createdAt <= dateTo + 'T23:59:59');
      return NextResponse.json(filtered);
    }

    const mapped = absences.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student?.name || null,
      teacherId: a.teacherId,
      teacherName: a.teacher?.user?.name || null,
      sessionId: a.sessionId,
      subjectName: a.session?.subject?.name || '',
      reason: a.reason,
      absenceType: a.absenceType,
      notificationSent: a.notificationSent,
      createdAt: a.createdAt.toISOString(),
      sessionDay: a.session?.dayOfWeek || 0,
      sessionTime: a.session?.startTime || '',
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching absences:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الغيابات' },
      { status: 500 }
    );
  }
}

// POST /api/absences - Create new absence (teacher absence)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, sessionId, reason } = body;

    if (!teacherId || !sessionId || !reason?.trim()) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    // Create absence record
    const absence = await db.absence.create({
      data: {
        teacherId,
        sessionId,
        reason,
        absenceType: 'TEACHER',
        notificationSent: true,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        session: { include: { subject: true } },
      },
    });

    // Get affected students and notify their parents
    const session = await db.session.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      const students = await db.student.findMany({
        where: {
          institutionId: session.institutionId,
          level: session.level,
        },
        include: {
          parent: { include: { user: true } },
        },
      });

      const notifications = students
        .filter(s => s.parent?.user)
        .map(s => ({
          userId: s.parent!.user.id,
          message: `غاب الأستاذ عن حصة ${absence.session?.subject?.name || ''} يوم ${['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][session.dayOfWeek]}. السبب: ${reason}`,
          type: 'ABSENCE',
        }));

      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json({
      id: absence.id,
      teacherId: absence.teacherId,
      teacherName: absence.teacher?.user?.name,
      sessionId: absence.sessionId,
      subjectName: absence.session?.subject?.name,
      reason: absence.reason,
      absenceType: absence.absenceType,
      notificationSent: absence.notificationSent,
      createdAt: absence.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating absence:', error);
    return NextResponse.json(
      { error: 'فشل في تسجيل الغياب' },
      { status: 500 }
    );
  }
}
