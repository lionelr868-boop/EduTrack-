import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/conversations/[id] - Get a single conversation with messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const conversation = await db.conversation.findUnique({
      where: { id },
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

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update participant's lastReadAt to mark messages as read
    if (userId) {
      await db.conversationParticipant.updateMany({
        where: {
          conversationId: id,
          userId,
        },
        data: { lastReadAt: new Date() },
      });
    }

    // Calculate unread count for the requesting user
    let unreadCount = 0;
    if (userId) {
      const participant = conversation.participants.find(
        (p) => p.userId === userId
      );
      const lastReadAt = participant?.lastReadAt || new Date(0);

      unreadCount = await db.message.count({
        where: {
          conversationId: id,
          senderId: { not: userId },
          createdAt: { gt: lastReadAt },
        },
      });
    }

    const result = {
      id: conversation.id,
      type: conversation.type,
      institutionId: conversation.institutionId,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      participants: conversation.participants.map((p) => ({
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
      messages: conversation.messages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt.toISOString(),
        sender: m.sender,
      })),
      unreadCount,
    };

    return NextResponse.json({ conversation: result });
  } catch (error) {
    console.error('Conversation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRoleLabelAr(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'المدير';
    case 'TEACHER': return 'الأستاذ';
    case 'PARENT': return 'ولي الأمر';
    default: return 'مستخدم';
  }
}

// POST /api/conversations/[id] - Send a message in a conversation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { senderId, content } = body;

    if (!senderId) {
      return NextResponse.json(
        { error: 'senderId is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Verify conversation exists and get participants info
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Verify sender is a participant
    const senderParticipant = conversation.participants.find(
      (p) => p.userId === senderId
    );

    if (!senderParticipant) {
      return NextResponse.json(
        { error: 'Sender is not a participant in this conversation' },
        { status: 403 }
      );
    }

    const senderName = senderParticipant.user.name;
    const senderRole = senderParticipant.user.role;

    // Create the message and update conversation in a transaction
    const message = await db.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderId,
          content: content.trim(),
          type: 'TEXT',
        },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
      });

      // Update conversation's updatedAt
      await tx.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // Create notifications for all OTHER participants in the conversation
    const otherParticipants = conversation.participants.filter(
      (p) => p.userId !== senderId
    );

    if (otherParticipants.length > 0) {
      try {
        const truncatedContent = content.trim().length > 50
          ? content.trim().slice(0, 50) + '...'
          : content.trim();

        await db.notification.createMany({
          data: otherParticipants.map((p) => ({
            userId: p.userId,
            title: `رسالة جديدة من ${getRoleLabelAr(senderRole)}`,
            message: `${senderName}: ${truncatedContent}`,
            type: 'ACTIVITY',
            link: 'messages',
          })),
        });
      } catch (notifError) {
        // Don't fail the message send if notification creation fails
        console.error('Failed to create message notification:', notifError);
      }
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      },
    });
  } catch (error) {
    console.error('Conversation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
