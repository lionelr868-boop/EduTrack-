import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/conversations - List conversations for a user
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

    const where: Record<string, unknown> = {
      participants: {
        some: { userId },
      },
    };

    if (institutionId) {
      where.institutionId = institutionId;
    }

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teacher: {
                  select: { id: true, subject: { select: { name: true } } },
                },
                parent: {
                  select: {
                    id: true,
                    students: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            type: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt || new Date(0);

        const unreadCount = await db.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        });

        return {
          id: conv.id,
          type: conv.type,
          institutionId: conv.institutionId,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          participants: conv.participants.map((p) => ({
            id: p.id,
            userId: p.user.id,
            name: p.user.name,
            email: p.user.email,
            role: p.user.role,
            teacher: p.user.teacher
              ? { id: p.user.teacher.id, subject: p.user.teacher.subject }
              : null,
            parent: p.user.parent
              ? {
                  id: p.user.parent.id,
                  children: p.user.parent.students.map((s) => s.name),
                }
              : null,
            lastReadAt: p.lastReadAt.toISOString(),
          })),
          lastMessage: conv.messages[0]
            ? {
                id: conv.messages[0].id,
                content: conv.messages[0].content,
                type: conv.messages[0].type,
                createdAt: conv.messages[0].createdAt.toISOString(),
                sender: conv.messages[0].sender,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get a conversation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantIds, institutionId, initialMessage } = body;

    if (
      !participantIds ||
      !Array.isArray(participantIds) ||
      participantIds.length < 2
    ) {
      return NextResponse.json(
        { error: 'participantIds must be an array with at least 2 users' },
        { status: 400 }
      );
    }

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      );
    }

    // Determine conversation type
    const type = participantIds.length === 2 ? 'DIRECT' : 'GROUP';

    // For DIRECT conversations, check if one already exists between these 2 users
    if (type === 'DIRECT') {
      const existing = await db.conversation.findFirst({
        where: {
          type: 'DIRECT',
          institutionId,
          participants: {
            every: {
              userId: { in: participantIds },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  teacher: {
                    select: { id: true, subject: { select: { name: true } } },
                  },
                  parent: {
                    select: {
                      id: true,
                      students: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              type: true,
              createdAt: true,
              senderId: true,
              sender: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      // Verify it's exactly between these 2 users (not a conversation with more participants that happens to include them)
      if (
        existing &&
        existing.participants.length === participantIds.length &&
        existing.participants.every((p) => participantIds.includes(p.userId))
      ) {
        return NextResponse.json({ conversation: existing, isNew: false });
      }
    }

    // Create a new conversation
    const conversation = await db.conversation.create({
      data: {
        type,
        institutionId,
        participants: {
          create: participantIds.map((userId: string) => ({
            userId,
            lastReadAt: new Date(),
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teacher: {
                  select: { id: true, subject: { select: { name: true } } },
                },
                parent: {
                  select: {
                    id: true,
                    students: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // If initialMessage is provided, create the first message
    if (initialMessage && initialMessage.content && initialMessage.senderId) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: initialMessage.senderId,
          content: initialMessage.content,
          type: 'TEXT',
        },
      });

      // Set sender's lastReadAt to now so they don't see their own message as unread
      await db.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: initialMessage.senderId,
        },
        data: { lastReadAt: new Date() },
      });
    }

    // Fetch the full conversation with the message
    const fullConversation = await db.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                teacher: {
                  select: { id: true, subject: { select: { name: true } } },
                },
                parent: {
                  select: {
                    id: true,
                    students: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ conversation: fullConversation, isNew: true });
  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
