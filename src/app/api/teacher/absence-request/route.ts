import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/teacher/absence-request - Create a teacher absence request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherUserId, date, reason, canCompensate, institutionId } = body;

    if (!teacherUserId || !date || !reason?.trim() || !institutionId) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع الحقول المطلوبة' },
        { status: 400 }
      );
    }

    // Find the teacher by userId
    const teacher = await db.teacher.findFirst({
      where: { userId: teacherUserId },
      include: { user: { select: { name: true, institutionId: true } } },
    });

    if (!teacher) {
      // If no teacher found, still create a notification for the director
      // Get the director user for this institution
      const director = await db.user.findFirst({
        where: { institutionId, role: 'DIRECTOR' },
      });

      if (director) {
        await db.notification.create({
          data: {
            userId: director.id,
            message: `طلب غياب من أستاذ: ${reason} - التاريخ: ${new Date(date).toLocaleDateString('ar-DZ')}${canCompensate ? ' (قابل للتعويض)' : ''}`,
            type: 'ABSENCE',
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'تم إرسال طلب الغياب',
        notificationSent: !!director,
      }, { status: 201 });
    }

    // Find sessions for this teacher on the given day of week
    const absenceDate = new Date(date);
    const dayOfWeek = absenceDate.getDay();

    const sessions = await db.session.findMany({
      where: {
        teacherId: teacher.id,
        dayOfWeek,
        institutionId,
        status: 'SCHEDULED',
      },
      include: { subject: true },
    });

    // Create absence records for each affected session
    const absenceRecords = [];
    for (const session of sessions) {
      const absence = await db.absence.create({
        data: {
          teacherId: teacher.id,
          sessionId: session.id,
          reason,
          absenceType: 'TEACHER',
          notificationSent: false,
        },
      });
      absenceRecords.push(absence);
    }

    // Notify the director
    const director = await db.user.findFirst({
      where: { institutionId, role: 'DIRECTOR' },
    });

    if (director) {
      const subjectNames = sessions.map(s => s.subject?.name).filter(Boolean).join('، ');
      await db.notification.create({
        data: {
          userId: director.id,
          message: `طلب غياب من الأستاذ ${teacher.user.name}: ${reason}${subjectNames ? ` - الحصص المتأثرة: ${subjectNames}` : ''}${canCompensate ? ' (قابل للتعويض)' : ''}`,
          type: 'ABSENCE',
        },
      });
    }

    // Notify parents of affected students
    for (const session of sessions) {
      const students = await db.student.findMany({
        where: {
          institutionId,
          level: session.level,
        },
        include: {
          parent: { include: { user: true } },
        },
      });

      const parentNotifications = students
        .filter(s => s.parent?.user)
        .map(s => ({
          userId: s.parent!.user.id,
          message: `غاب الأستاذ ${teacher.user.name} عن حصة ${session.subject?.name || ''}${canCompensate ? '. سيتم جدولة حصة تعويضية' : ''}`,
          type: 'CANCELLATION',
        }));

      if (parentNotifications.length > 0) {
        await db.notification.createMany({ data: parentNotifications });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الغياب وإشعار الإدارة',
      affectedSessions: sessions.length,
      notificationSent: !!director,
      absenceRecords: absenceRecords.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher absence request:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال طلب الغياب' },
      { status: 500 }
    );
  }
}
