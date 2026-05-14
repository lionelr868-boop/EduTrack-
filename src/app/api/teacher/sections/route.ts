import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/teacher/sections - Get sections for a teacher
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'معرف الأستاذ مطلوب' },
        { status: 400 }
      );
    }

    // Verify teacher exists
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, institutionId: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'الأستاذ غير موجود' },
        { status: 404 }
      );
    }

    // Get sections where this teacher has sessions
    const teacherSessions = await db.session.findMany({
      where: {
        teacherId,
        sectionId: { not: null },
        status: { not: 'CANCELLED' },
      },
      select: { sectionId: true },
      distinct: ['sectionId'],
    });

    const sessionSectionIds = teacherSessions
      .map((s) => s.sectionId)
      .filter((id): id is string => id !== null);

    // Get supervised sections
    const supervisedSections = await db.section.findMany({
      where: { supervisorId: teacherId },
      select: { id: true },
    });

    const supervisedSectionIds = supervisedSections.map((s) => s.id);

    // Combine all section IDs (unique)
    const allSectionIds = [...new Set([...sessionSectionIds, ...supervisedSectionIds])];

    if (allSectionIds.length === 0) {
      return NextResponse.json({
        grouped: {},
        sections: [],
        totalSections: 0,
      });
    }

    // Get section details with student counts
    const sections = await db.section.findMany({
      where: { id: { in: allSectionIds } },
      include: {
        year: { select: { name: true, level: true } },
        students: { select: { id: true } },
      },
    });

    const mappedSections = sections.map((s) => ({
      id: s.id,
      name: s.name,
      yearName: s.year?.name || '',
      level: s.year?.level || '',
      studentCount: s.students.length,
      isSupervisor: supervisedSectionIds.includes(s.id),
    }));

    // Group by level
    const grouped: Record<string, typeof mappedSections> = {};
    for (const section of mappedSections) {
      const sectionLevel = section.level || 'غير محدد';
      if (!grouped[sectionLevel]) {
        grouped[sectionLevel] = [];
      }
      grouped[sectionLevel].push(section);
    }

    return NextResponse.json({
      grouped,
      sections: mappedSections,
      totalSections: mappedSections.length,
    });
  } catch (error) {
    console.error('Error fetching teacher sections:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'فشل في جلب بيانات الأقسام', details: message },
      { status: 500 }
    );
  }
}
