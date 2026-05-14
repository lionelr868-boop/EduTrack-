import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/attendance - Submit attendance records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, records } = body as {
      sessionId: string;
      records: { studentId: string; status: string; note?: string }[];
    };

    if (!sessionId || !records || records.length === 0) {
      return NextResponse.json(
        { error: 'يرجى تقديم بيانات الحضور' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { subject: true, section: { include: { year: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'الحصة غير موجودة' },
        { status: 404 }
      );
    }

    // Upsert attendance records
    const results = [];
    for (const record of records) {
      const attendance = await db.attendance.upsert({
        where: {
          studentId_sessionId: {
            studentId: record.studentId,
            sessionId,
          },
        },
        create: {
          studentId: record.studentId,
          sessionId,
          status: record.status,
          note: record.note || null,
        },
        update: {
          status: record.status,
          note: record.note || null,
        },
      });
      results.push(attendance);
    }

    // Create absence records for absent students
    const absentRecords = records.filter(r => r.status === 'ABSENT');
    for (const record of absentRecords) {
      await db.absence.upsert({
        where: {
          id: `${record.studentId}_${sessionId}_abs`,
        },
        create: {
          studentId: record.studentId,
          sessionId,
          reason: record.note || 'غائب',
          absenceType: 'STUDENT',
          notificationSent: false,
        },
        update: {
          reason: record.note || 'غائب',
        },
      });
    }

    // Create notifications for parents of absent students
    const absentStudents = await db.student.findMany({
      where: {
        id: { in: absentRecords.map(r => r.studentId) },
      },
      include: {
        parent: { include: { user: true } },
      },
    });

    const notifications = absentStudents
      .filter(s => s.parent?.user)
      .map(s => ({
        userId: s.parent!.user.id,
        message: `تنبيه: غاب ${s.name} عن حصة ${session.subject?.name || ''} اليوم`,
        type: 'ABSENCE',
      }));

    if (notifications.length > 0) {
      await db.notification.createMany({ data: notifications });
    }

    // Notify the institution director about the attendance submission
    const lateRecords = records.filter(r => r.status === 'LATE');
    const absentCount = absentRecords.length;
    const lateCount = lateRecords.length;
    const sectionName = session.section?.name || 'غير محدد';

    const director = await db.user.findFirst({
      where: {
        institutionId: session.institutionId,
        role: 'DIRECTOR',
      },
    });

    if (director) {
      await db.notification.create({
        data: {
          userId: director.id,
          message: `تم تسجيل حضور قسم ${sectionName} - ${absentCount} غائب، ${lateCount} متأخر`,
          type: 'ATTENDANCE',
        },
      });
    }

    // Update absence notification status
    for (const record of absentRecords) {
      await db.absence.updateMany({
        where: {
          studentId: record.studentId,
          sessionId,
        },
        data: { notificationSent: true },
      });
    }

    return NextResponse.json({
      message: 'تم إرسال كشف الحضور بنجاح',
      recordsCreated: results.length,
      absentCount: absentRecords.length,
      notificationsSent: notifications.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال كشف الحضور' },
      { status: 500 }
    );
  }
}
