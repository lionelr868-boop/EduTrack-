import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/attendance/session/[sessionId] - Get existing attendance for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const attendance = await db.attendance.findMany({
      where: { sessionId },
      include: {
        student: true,
      },
    });

    const mapped = attendance.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.name,
      sessionId: a.sessionId,
      status: a.status,
      note: a.note,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'فشل في جلب سجل الحضور' },
      { status: 500 }
    );
  }
}
