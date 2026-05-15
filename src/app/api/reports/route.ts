import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const institutionId = searchParams.get('institutionId');
    const type = searchParams.get('type') || 'daily';
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');

    if (!institutionId) {
      return NextResponse.json({ error: 'institutionId is required' }, { status: 400 });
    }

    if (type === 'daily') {
      const targetDate = date ? new Date(date) : new Date();
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const [sessions, studentAbsences, teacherAbsences] = await Promise.all([
        db.session.findMany({
          where: {
            institutionId,
            date: { gte: dayStart, lte: dayEnd },
          },
        }),
        db.absence.findMany({
          where: {
            session: { institutionId },
            absenceType: 'STUDENT',
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          include: {
            student: { select: { id: true, name: true } },
            session: { include: { subject: { select: { name: true } } } },
          },
        }),
        db.absence.findMany({
          where: {
            session: { institutionId },
            absenceType: 'TEACHER',
            createdAt: { gte: dayStart, lte: dayEnd },
          },
          include: {
            teacher: { include: { user: { select: { name: true } } } },
            session: { include: { subject: { select: { name: true } } } },
          },
        }),
      ]);

      return NextResponse.json({
        type: 'daily',
        date: targetDate.toISOString(),
        sessionsCompleted: sessions.filter((s) => s.status === 'DONE').length,
        sessionsCancelled: sessions.filter((s) => s.status === 'CANCELLED').length,
        sessionsCompensated: sessions.filter((s) => s.status === 'COMPENSATED').length,
        studentAbsences: studentAbsences.map((a) => ({
          id: a.id,
          name: a.student?.name || 'غير معروف',
          subject: a.session.subject.name,
          reason: a.reason,
        })),
        teacherAbsences: teacherAbsences.map((a) => ({
          id: a.id,
          name: a.teacher?.user.name || 'غير معروف',
          subject: a.session.subject.name,
          reason: a.reason,
        })),
        notificationsSent: await db.notification.count({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            user: { institutionId },
          },
        }),
      });
    }

    if (type === 'monthly') {
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const [sessions, invoices] = await Promise.all([
        db.session.findMany({
          where: { institutionId },
        }),
        db.invoice.findMany({
          where: { institutionId, month: targetMonth, year: targetYear },
          select: { amount: true, status: true },
        }),
      ]);

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter((s) => s.status === 'DONE').length;
      const attendanceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
      const pendingInvoices = invoices.filter((inv) => inv.status === 'PENDING');

      return NextResponse.json({
        type: 'monthly',
        month: targetMonth,
        year: targetYear,
        totalSessions,
        attendanceRate,
        revenue: totalRevenue,
        paidInvoices: paidInvoices.length,
        pendingInvoices: pendingInvoices.length,
      });
    }

    if (type === 'student' && studentId) {
      const student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          absences: {
            include: {
              session: { include: { subject: { select: { name: true } } } },
            },
          },
          attendances: {
            include: {
              session: { include: { subject: { select: { name: true } } } },
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Calculate attendance per subject
      const subjectMap: Record<string, { total: number; present: number }> = {};
      for (const att of student.attendances) {
        const name = att.session.subject.name;
        if (!subjectMap[name]) subjectMap[name] = { total: 0, present: 0 };
        subjectMap[name].total++;
        if (att.status === 'PRESENT') subjectMap[name].present++;
      }

      const lowAttendanceSubjects = Object.entries(subjectMap)
        .map(([name, { total, present }]) => ({
          name,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        }))
        .filter((s) => s.rate < 80);

      return NextResponse.json({
        type: 'student',
        student: { id: student.id, name: student.name, level: student.level },
        lowAttendanceSubjects,
        absencesTimeline: student.absences.map((a) => ({
          date: a.createdAt.toISOString().split('T')[0],
          subject: a.session.subject.name,
          reason: a.reason || 'غير مبرر',
        })),
      });
    }

    if (type === 'teacher' && teacherId) {
      const teacher = await db.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: { select: { name: true } },
          subjects: { include: { subject: { select: { name: true, level: true } } } },
          sessions: { select: { id: true, status: true, level: true } },
          absences: { select: { id: true } },
        },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      return NextResponse.json({
        type: 'teacher',
        teacher: { id: teacher.id, name: teacher.user.name },
        sessionsCompleted: teacher.sessions.filter((s) => s.status === 'DONE').length,
        sessionsAbsent: teacher.absences.length,
        levelsTaught: [...new Set(teacher.sessions.map((s) => s.level))],
        subjects: teacher.subjects.map((ts) => ts.subject.name),
      });
    }

    return NextResponse.json({ error: 'Invalid report type or missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
