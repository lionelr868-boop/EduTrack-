import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, month, year } = body;

    if (!institutionId || !month || !year) {
      return NextResponse.json({ error: 'institutionId, month, and year are required' }, { status: 400 });
    }

    // Check if invoices already exist for this month/year
    const existingInvoices = await db.invoice.findMany({
      where: { institutionId, month, year },
    });

    if (existingInvoices.length > 0) {
      return NextResponse.json(
        { error: 'الفواتير لهذا الشهر موجودة مسبقاً', existingCount: existingInvoices.length },
        { status: 409 }
      );
    }

    // Get all students for this institution
    const students = await db.student.findMany({
      where: { institutionId },
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'لا يوجد تلاميذ في المؤسسة' }, { status: 404 });
    }

    // Get pricing data
    const pricings = await db.pricing.findMany({
      where: { institutionId },
    });

    // Get sessions for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const sessions = await db.session.findMany({
      where: {
        institutionId,
        date: { gte: startDate, lte: endDate },
        status: { in: ['DONE', 'SCHEDULED', 'COMPENSATED'] },
      },
    });

    // Get absences for the month
    const absences = await db.absence.findMany({
      where: {
        session: {
          institutionId,
          date: { gte: startDate, lte: endDate },
        },
        absenceType: 'STUDENT',
      },
    });

    const createdInvoices = [];

    for (const student of students) {
      // Count sessions for this student's level
      const studentSessions = sessions.filter((s) => s.level === student.level);
      const totalSessions = studentSessions.length || 8; // Default to 8 if no sessions

      // Count absences for this student
      const studentAbsences = absences.filter((a) => a.studentId === student.id);
      const absentSessions = studentAbsences.length;

      // Count compensated sessions
      const compensatedSessions = studentSessions.filter((s) => s.status === 'COMPENSATED').length;

      // Calculate amount based on pricing
      const studentPricings = pricings.filter((p) => p.level === student.level);
      const avgPricePerSession = studentPricings.length > 0
        ? studentPricings.reduce((sum, p) => sum + p.pricePerSession, 0) / studentPricings.length
        : 600;

      const amount = (totalSessions - absentSessions) * avgPricePerSession;

      // Create invoice
      const invoice = await db.invoice.create({
        data: {
          studentId: student.id,
          institutionId,
          month,
          year,
          totalSessions,
          absentSessions,
          compensatedSessions,
          amount,
          status: 'PENDING',
        },
      });

      // Create line items per subject
      const studentSubjectNames = [...new Set(studentSessions.map((s) => s.subjectId))];
      const subjects = await db.subject.findMany({
        where: { id: { in: studentSubjectNames } },
        include: { pricing: true },
      });

      if (subjects.length > 0) {
        for (const subject of subjects) {
          const subjectSessions = studentSessions.filter((s) => s.subjectId === subject.id);
          const subjectAbsences = absences.filter((a) => {
            const session = studentSessions.find((s) => s.id === a.sessionId);
            return session?.subjectId === subject.id && a.studentId === student.id;
          });
          const pricePerSession = subject.pricing.find((p) => p.level === student.level)?.pricePerSession || avgPricePerSession;
          const sessCount = subjectSessions.length || 4;
          const absCount = subjectAbsences.length;

          await db.invoiceLineItem.create({
            data: {
              invoiceId: invoice.id,
              subjectName: subject.name,
              totalSessions: sessCount,
              absentSessions: absCount,
              pricePerSession,
              subtotal: (sessCount - absCount) * pricePerSession,
            },
          });
        }
      } else {
        // Create default line items
        const defaultSubjects = [
          { name: 'الرياضيات', sessions: 4, price: avgPricePerSession },
          { name: 'الفيزياء', sessions: 3, price: avgPricePerSession * 0.9 },
          { name: 'اللغة العربية', sessions: 3, price: avgPricePerSession * 0.8 },
        ];

        for (const sub of defaultSubjects) {
          await db.invoiceLineItem.create({
            data: {
              invoiceId: invoice.id,
              subjectName: sub.name,
              totalSessions: sub.sessions,
              absentSessions: Math.random() > 0.7 ? 1 : 0,
              pricePerSession: sub.price,
              subtotal: sub.sessions * sub.price,
            },
          });
        }
      }

      createdInvoices.push(invoice);
    }

    return NextResponse.json({
      message: `تم توليد ${createdInvoices.length} فاتورة بنجاح`,
      count: createdInvoices.length,
    });
  } catch (error) {
    console.error('Error generating invoices:', error);
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
}
