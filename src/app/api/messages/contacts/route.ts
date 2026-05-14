import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/messages/contacts - Get contacts for messaging
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const institutionId = searchParams.get('institutionId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      );
    }

    // Get the current user to determine role
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const role = currentUser.role;

    // Helper to format a user as a contact
    interface ContactUser {
      id: string;
      name: string;
      role: string;
      teacher?: { id: string; subject: { name: string } } | null;
      parent?: { id: string; students: { name: string }[] } | null;
    }

    const formatContact = (user: ContactUser) => ({
      userId: user.id,
      name: user.name,
      role: user.role,
      subjectName: user.teacher?.subject?.name ?? null,
      childrenNames: user.parent?.students?.map((s) => s.name) ?? [],
    });

    let directors: ContactUser[] = [];
    let teachers: ContactUser[] = [];
    let parents: ContactUser[] = [];

    if (role === 'TEACHER') {
      // Teacher can message:
      // 1. DIRECTORs (admins) in same institution
      // 2. PARENTs of students in teacher's sessions
      // 3. Other TEACHERs in same institution

      // Get teacher record
      const teacher = await db.teacher.findUnique({
        where: { userId },
        select: { id: true },
      });

      // 1. Directors
      directors = await db.user.findMany({
        where: {
          institutionId,
          role: 'DIRECTOR',
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      });

      // 2. Parents of students in teacher's sessions
      if (teacher) {
        const sessions = await db.session.findMany({
          where: { teacherId: teacher.id },
          select: {
            sectionId: true,
          },
        });

        const sectionIds = sessions
          .map((s) => s.sectionId)
          .filter((id): id is string => id !== null);

        if (sectionIds.length > 0) {
          const studentsInSections = await db.student.findMany({
            where: {
              sectionId: { in: sectionIds },
              parentId: { not: null },
            },
            select: { parentId: true },
            distinct: ['parentId'],
          });

          const parentIds = studentsInSections
            .map((s) => s.parentId)
            .filter((id): id is string => id !== null);

          if (parentIds.length > 0) {
            parents = await db.user.findMany({
              where: {
                id: {
                  in: (
                    await db.parent.findMany({
                      where: { id: { in: parentIds } },
                      select: { userId: true },
                    })
                  ).map((p) => p.userId),
                },
              },
              select: {
                id: true,
                name: true,
                role: true,
                parent: {
                  select: {
                    id: true,
                    students: { select: { name: true } },
                  },
                },
              },
            });
          }
        }
      }

      // 3. Other teachers in same institution
      teachers = await db.user.findMany({
        where: {
          institutionId,
          role: 'TEACHER',
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          role: true,
          teacher: {
            select: {
              id: true,
              subject: { select: { name: true } },
            },
          },
        },
      });
    } else if (role === 'DIRECTOR') {
      // Director can message all teachers and parents
      teachers = await db.user.findMany({
        where: {
          institutionId,
          role: 'TEACHER',
        },
        select: {
          id: true,
          name: true,
          role: true,
          teacher: {
            select: {
              id: true,
              subject: { select: { name: true } },
            },
          },
        },
      });

      parents = await db.user.findMany({
        where: {
          institutionId,
          role: 'PARENT',
        },
        select: {
          id: true,
          name: true,
          role: true,
          parent: {
            select: {
              id: true,
              students: { select: { name: true } },
            },
          },
        },
      });
    } else if (role === 'PARENT') {
      // Parent can message teachers who teach their children
      const parent = await db.parent.findUnique({
        where: { userId },
        select: { id: true, students: { select: { sectionId: true } } },
      });

      if (parent) {
        const sectionIds = parent.students
          .map((s) => s.sectionId)
          .filter((id): id is string => id !== null);

        if (sectionIds.length > 0) {
          // Find teachers who have sessions in these sections
          const sessions = await db.session.findMany({
            where: { sectionId: { in: sectionIds } },
            select: { teacherId: true },
            distinct: ['teacherId'],
          });

          const teacherIds = sessions.map((s) => s.teacherId);

          if (teacherIds.length > 0) {
            const teacherUsers = await db.teacher.findMany({
              where: { id: { in: teacherIds } },
              select: { userId: true },
            });

            teachers = await db.user.findMany({
              where: {
                id: { in: teacherUsers.map((t) => t.userId) },
              },
              select: {
                id: true,
                name: true,
                role: true,
                teacher: {
                  select: {
                    id: true,
                    subject: { select: { name: true } },
                  },
                },
              },
            });
          }
        }
      }
    }

    // Group by role
    const contacts = {
      directors: directors.map(formatContact),
      teachers: teachers.map(formatContact),
      parents: parents.map(formatContact),
    };

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
