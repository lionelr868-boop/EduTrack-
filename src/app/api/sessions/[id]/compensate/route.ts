import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/sessions/[id]/compensate - Schedule compensating session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body;

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'يرجى تحديد اليوم والوقت للحصة التعويضية' },
        { status: 400 }
      );
    }

    const originalSession = await db.session.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    if (!originalSession) {
      return NextResponse.json({ error: 'الحصة الأصلية غير موجودة' }, { status: 404 });
    }

    // Create compensating session
    const compensatingSession = await db.session.create({
      data: {
        subjectId: originalSession.subjectId,
        teacherId: originalSession.teacherId,
        institutionId: originalSession.institutionId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        level: originalSession.level,
        status: 'SCHEDULED',
        repeatType: 'EXCEPTIONAL',
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    // Update original session status to COMPENSATED
    await db.session.update({
      where: { id },
      data: { status: 'COMPENSATED' },
    });

    // Notify parents
    const students = await db.student.findMany({
      where: {
        institutionId: originalSession.institutionId,
        level: originalSession.level,
      },
      include: {
        parent: { include: { user: true } },
      },
    });

    const notifications = students
      .filter(s => s.parent?.user)
      .map(s => ({
        userId: s.parent!.user.id,
        message: `تم برمجة حصة تعويضية لمادة ${originalSession.subject.name} يوم ${['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][Number(dayOfWeek)]} من ${startTime} إلى ${endTime}`,
        type: 'CANCELLATION',
      }));

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      message: 'تم برمجة حصة تعويضية بنجاح',
      compensatingSession: {
        id: compensatingSession.id,
        subjectId: compensatingSession.subjectId,
        subjectName: compensatingSession.subject.name,
        teacherId: compensatingSession.teacherId,
        teacherName: compensatingSession.teacher.user.name,
        dayOfWeek: compensatingSession.dayOfWeek,
        startTime: compensatingSession.startTime,
        endTime: compensatingSession.endTime,
        level: compensatingSession.level,
        status: compensatingSession.status,
        repeatType: compensatingSession.repeatType,
      },
      notificationsSent: notifications.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error compensating session:', error);
    return NextResponse.json({ error: 'فشل في برمجة الحصة التعويضية' }, { status: 500 });
  }
}
