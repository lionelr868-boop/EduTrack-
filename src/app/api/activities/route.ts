import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/activities - Fetch student activities with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (sectionId) where.sectionId = sectionId;
    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      db.studentActivity.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, level: true } },
          teacher: {
            include: {
              user: { select: { name: true } },
              subject: { select: { name: true } },
            },
          },
          session: {
            include: {
              subject: { select: { name: true } },
            },
          },
          section: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.studentActivity.count({ where }),
    ]);

    const mapped = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      typeLabel: getActivityTypeLabel(activity.type),
      title: activity.title,
      description: activity.description,
      grade: activity.grade,
      maxGrade: activity.maxGrade,
      date: activity.date.toISOString(),
      createdAt: activity.createdAt.toISOString(),
      student: {
        id: activity.student.id,
        name: activity.student.name,
        level: activity.student.level,
      },
      teacher: {
        id: activity.teacher.id,
        name: activity.teacher.user.name,
        subject: activity.teacher.subject.name,
      },
      section: {
        id: activity.section.id,
        name: activity.section.name,
      },
      session: activity.session
        ? {
            id: activity.session.id,
            subject: activity.session.subject.name,
          }
        : null,
    }));

    return NextResponse.json({
      activities: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Activities GET error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create a new student activity (teacher fills in)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      teacherId,
      sessionId,
      sectionId,
      type,
      title,
      description,
      grade,
      maxGrade,
      date,
    } = body;

    if (!studentId || !teacherId || !sectionId || !type || !title) {
      return NextResponse.json(
        { error: 'studentId, teacherId, sectionId, type, and title are required' },
        { status: 400 }
      );
    }

    // Validate activity type
    const validTypes = ['HOMEWORK', 'EXAM', 'QUIZ', 'PARTICIPATION', 'BEHAVIOR', 'NOTE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate grade if provided
    if (grade !== undefined && grade !== null) {
      if (maxGrade === null || maxGrade === undefined) {
        return NextResponse.json(
          { error: 'maxGrade is required when grade is provided' },
          { status: 400 }
        );
      }
      if (grade > maxGrade) {
        return NextResponse.json(
          { error: 'Grade cannot exceed maxGrade' },
          { status: 400 }
        );
      }
    }

    const activity = await db.studentActivity.create({
      data: {
        studentId,
        teacherId,
        sessionId: sessionId || null,
        sectionId,
        type,
        title,
        description: description || null,
        grade: grade !== undefined ? grade : null,
        maxGrade: maxGrade !== undefined ? maxGrade : null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        student: { select: { id: true, name: true, level: true } },
        teacher: {
          include: {
            user: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
        section: { select: { id: true, name: true } },
      },
    });

    // Create a notification for the student's parent
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { parent: { include: { user: true } } },
    });

    if (student?.parent?.user) {
      const typeLabel = getActivityTypeLabel(type);
      let message = '';
      if (grade !== null && grade !== null && maxGrade !== null) {
        message = `${typeLabel}: ${title} - حصل ${student.name} على ${grade}/${maxGrade}`;
      } else {
        message = `${typeLabel}: ${title} - ${student.name}`;
      }

      await db.notification.create({
        data: {
          userId: student.parent.user.id,
          title: typeLabel,
          message,
          type: 'ACTIVITY',
          link: `parent-activities-${studentId}`,
        },
      });
    }

    return NextResponse.json(
      {
        id: activity.id,
        type: activity.type,
        typeLabel: getActivityTypeLabel(activity.type),
        title: activity.title,
        description: activity.description,
        grade: activity.grade,
        maxGrade: activity.maxGrade,
        date: activity.date.toISOString(),
        student: {
          id: activity.student.id,
          name: activity.student.name,
        },
        teacher: {
          id: activity.teacher.id,
          name: activity.teacher.user.name,
          subject: activity.teacher.subject.name,
        },
        section: {
          id: activity.section.id,
          name: activity.section.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Activities POST error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE /api/activities?id=XXX - Delete a student activity
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Activity id is required' },
        { status: 400 }
      );
    }

    const activity = await db.studentActivity.findUnique({
      where: { id },
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'النشاط غير موجود' },
        { status: 404 }
      );
    }

    await db.studentActivity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'تم حذف النشاط بنجاح' });
  } catch (error) {
    console.error('Activities DELETE error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}

function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOMEWORK: 'واجب منزلي',
    EXAM: 'امتحان',
    QUIZ: 'اختبار قصير',
    PARTICIPATION: 'مشاركة',
    BEHAVIOR: 'سلوك',
    NOTE: 'ملاحظة',
  };
  return labels[type] || 'نشاط';
}
