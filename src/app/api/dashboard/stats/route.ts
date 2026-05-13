import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId مطلوب' },
        { status: 400 }
      );
    }

    const [totalStudents, totalTeachers, sessions, absences, invoices] = await Promise.all([
      db.student.count({ where: { institutionId } }),
      db.teacher.count({ where: { institutionId } }),
      db.session.findMany({ where: { institutionId } }),
      db.absence.findMany({
        where: { session: { institutionId } },
        include: { student: true, teacher: true, session: true },
      }),
      db.invoice.findMany({ where: { institutionId, status: 'PAID' } }),
    ]);

    const studentAbsences = absences.filter(a => a.absenceType === 'STUDENT').length;
    const attendanceRate = sessions.length > 0
      ? Math.round(((sessions.length - studentAbsences) / sessions.length) * 100)
      : 100;
    const revenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const todayDay = new Date().getDay();
    const todaySessions = sessions.filter(s => s.dayOfWeek === todayDay).length;
    const unexcusedAbsences = absences.filter(a => a.absenceType === 'STUDENT' && !a.notificationSent).length;
    const totalSessionsCount = sessions.length;

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      attendanceRate: Math.min(attendanceRate, 100),
      revenue,
      unexcusedAbsences,
      todaySessions,
      totalSessions: totalSessionsCount,
      studentAbsences,
      teacherAbsences: absences.filter(a => a.absenceType === 'TEACHER').length,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
