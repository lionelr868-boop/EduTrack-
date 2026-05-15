import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            userId: true,
            phone: true,
            user: { select: { name: true, email: true } },
          },
        },
        section: {
          include: {
            year: { select: { id: true, name: true, level: true, order: true } },
            supervisor: {
              include: { user: { select: { name: true } } },
            },
          },
        },
        absences: {
          include: {
            session: { include: { subject: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        attendances: {
          include: {
            session: { include: { subject: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        invoices: {
          include: { lineItems: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activities: {
          include: {
            teacher: { include: { user: { select: { name: true } }, subject: { select: { name: true } } } },
            section: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Compute attendance summary
    const totalAttendances = student.attendances.length;
    const presentCount = student.attendances.filter(a => a.status === 'PRESENT').length;
    const absentCount = student.attendances.filter(a => a.status === 'ABSENT').length;
    const lateCount = student.attendances.filter(a => a.status === 'LATE').length;

    return NextResponse.json({
      ...student,
      attendanceSummary: {
        total: totalAttendances,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendanceRate: totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, level, parentId, sectionId, dateOfBirth, gender, phone, address } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (level !== undefined) updateData.level = level;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (sectionId !== undefined) updateData.sectionId = sectionId || null;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;

    const student = await db.student.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            userId: true,
            phone: true,
            user: { select: { name: true, email: true } },
          },
        },
        section: {
          include: {
            year: { select: { name: true, level: true } },
          },
        },
      },
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.student.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
