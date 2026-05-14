'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  MessageCircle,
  Send,
  Search,
  ArrowRight,
  User,
  Users,
  ChevronLeft,
  Plus,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── TypeScript Types ────────────────────────────────────────

interface Participant {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'DIRECTOR' | 'TEACHER' | 'PARENT';
  teacher: { id: string; subject: { name: string } } | null;
  parent: { id: string; children: string[] } | null;
  lastReadAt: string;
}

interface LastMessage {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface ConversationSummary {
  id: string;
  type: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface ConversationDetail {
  id: string;
  type: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  messages: ChatMessage[];
  unreadCount: number;
}

interface ContactItem {
  userId: string;
  name: string;
  role: string;
  subjectName: string | null;
  childrenNames: string[];
}

interface ContactsData {
  directors: ContactItem[];
  teachers: ContactItem[];
  parents: ContactItem[];
}

// ─── Animation Variants ──────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const slideFromRight = {
  hidden: { x: 30, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { x: 30, opacity: 0, transition: { duration: 0.2 } },
};

const slideFromLeft = {
  hidden: { x: -30, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { x: -30, opacity: 0, transition: { duration: 0.2 } },
};

// ─── Helper Functions ────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  return date.toLocaleDateString('ar-DZ');
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'مدير';
    case 'TEACHER': return 'أستاذ';
    case 'PARENT': return 'ولي أمر';
    default: return 'مستخدم';
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'TEACHER': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'PARENT': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getAvatarColor(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'bg-amber-500';
    case 'TEACHER': return 'bg-teal-500';
    case 'PARENT': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

function getOtherParticipant(conversation: { participants: Participant[] }, currentUserId: string): Participant | null {
  return conversation.participants.find(p => p.userId !== currentUserId) || conversation.participants[0] || null;
}

function getParticipantDisplayName(participant: Participant): string {
  return participant.name;
}

function getParticipantRoleInfo(participant: Participant): string | null {
  if (participant.role === 'TEACHER' && participant.teacher?.subject?.name) {
    return participant.teacher.subject.name;
  }
  if (participant.role === 'PARENT' && participant.parent?.children?.length) {
    return `ولي: ${participant.parent.children.join('، ')}`;
  }
  if (participant.role === 'DIRECTOR') {
    return 'مدير المؤسسة';
  }
  return null;
}

// ─── Main Component ──────────────────────────────────────────

export default function MessagingView() {
  const user = useAppStore(s => s.user);

  // State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [contacts, setContacts] = useState<ContactsData>({ directors: [], teachers: [], parents: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Fetch Conversations ───────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingConversations(true);
    try {
      const res = await fetch(`/api/conversations?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل المحادثات');
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ─── Fetch Contacts ────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    if (!user?.id || !user?.institutionId) return;
    setLoadingContacts(true);
    try {
      const res = await fetch(`/api/messages/contacts?userId=${user.id}&institutionId=${user.institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || { directors: [], teachers: [], parents: [] });
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل جهات الاتصال');
    } finally {
      setLoadingContacts(false);
    }
  }, [user?.id, user?.institutionId]);

  // ─── Open Conversation ─────────────────────────────────────
  const openConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMobileShowChat(true);
        // Update unread count in conversations list
        setConversations(prev =>
          prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل الرسائل');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  // ─── Send Message ──────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!user?.id || !activeConversation || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      const res = await fetch(`/api/conversations/${activeConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, content }),
      });

      if (res.ok) {
        const data = await res.json();
        const sentMessage: ChatMessage = data.message;

        // Add message to active conversation
        setActiveConversation(prev =>
          prev ? { ...prev, messages: [...prev.messages, sentMessage] } : null
        );

        // Update last message in conversations list
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  lastMessage: {
                    id: sentMessage.id,
                    content: sentMessage.content,
                    type: sentMessage.type,
                    createdAt: sentMessage.createdAt,
                    sender: sentMessage.sender,
                  },
                  updatedAt: sentMessage.createdAt,
                }
              : c
          )
        );
      } else {
        toast.error('حدث خطأ أثناء إرسال الرسالة');
        setNewMessage(content);
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال الرسالة');
      setNewMessage(content);
    } finally {
      setSendingMessage(false);
    }
  }, [user?.id, activeConversation, newMessage]);

  // ─── Start New Conversation ────────────────────────────────
  const startConversation = useCallback(async (contactUserId: string) => {
    if (!user?.id || !user?.institutionId) return;
    setCreatingConversation(true);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: [user.id, contactUserId],
          institutionId: user.institutionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const conversation = data.conversation;

        setShowNewConversationDialog(false);

        if (data.isNew) {
          // Refresh conversations list
          await fetchConversations();
        } else {
          // Update unread count locally
          setConversations(prev =>
            prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
          );
        }

        // Open the conversation
        await openConversation(conversation.id);
      } else {
        toast.error('حدث خطأ أثناء إنشاء المحادثة');
      }
    } catch {
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    } finally {
      setCreatingConversation(false);
    }
  }, [user?.id, user?.institutionId, fetchConversations, openConversation]);

  // ─── Auto-scroll to bottom ─────────────────────────────────
  useEffect(() => {
    if (activeConversation?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages?.length]);

  // ─── Filter conversations by search ────────────────────────
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const other = getOtherParticipant(conv, user?.id || '');
    const query = searchQuery.toLowerCase();
    return (
      other?.name?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  });

  // ─── Handle key press in message input ─────────────────────
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Back to conversations list (mobile) ───────────────────
  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  // ─── Render: Conversation List Item ────────────────────────
  const renderConversationItem = (conv: ConversationSummary) => {
    const other = getOtherParticipant(conv, user?.id || '');
    if (!other) return null;

    const isActive = activeConversation?.id === conv.id;
    const roleInfo = getParticipantRoleInfo(other);

    return (
      <motion.button
        key={conv.id}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => openConversation(conv.id)}
        className={`w-full text-right p-3 rounded-xl transition-all duration-200 relative group ${
          isActive
            ? 'bg-edutrack-primary/10 border border-edutrack-primary/20 shadow-sm'
            : 'hover:bg-gray-50 border border-transparent'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
              <AvatarFallback className={`${getAvatarColor(other.role)} text-white text-sm font-bold`}>
                {other.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {conv.unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -left-1 h-5 min-w-[20px] flex items-center justify-center px-1 bg-edutrack-primary text-white text-[10px] font-bold rounded-full"
              >
                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
              </motion.span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-edutrack-dark truncate">
                {getParticipantDisplayName(other)}
              </h4>
              {conv.lastMessage && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                  {formatRelativeTime(conv.lastMessage.createdAt)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border ${getRoleBadgeColor(other.role)}`}>
                {getRoleLabel(other.role)}
              </Badge>
              {roleInfo && (
                <span className="text-[10px] text-muted-foreground truncate">{roleInfo}</span>
              )}
            </div>

            {conv.lastMessage && (
              <p className={`text-xs mt-1.5 truncate ${
                conv.unreadCount > 0 ? 'text-edutrack-dark font-medium' : 'text-muted-foreground'
              }`}>
                {conv.lastMessage.sender?.id === user?.id ? 'أنت: ' : ''}
                {conv.lastMessage.content}
              </p>
            )}
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeConversation"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-edutrack-primary rounded-l-full"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </motion.button>
    );
  };

  // ─── Render: Chat Message ──────────────────────────────────
  const renderMessage = (msg: ChatMessage, index: number) => {
    const isOwnMessage = msg.sender?.id === user?.id;
    const isGroupChat = activeConversation?.type === 'GROUP';
    const showSenderName = isGroupChat && !isOwnMessage;

    // Check if previous message is from same sender
    const prevMsg = activeConversation?.messages[index - 1];
    const isSameSenderAsPrev = prevMsg?.sender?.id === msg.sender?.id;

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={`flex ${isOwnMessage ? 'justify-start' : 'justify-end'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-3'}`}
      >
        <div className={`max-w-[75%] ${isOwnMessage ? 'order-1' : 'order-1'}`}>
          {showSenderName && !isSameSenderAsPrev && (
            <p className="text-[10px] text-muted-foreground mb-1 px-2 text-left">
              {msg.sender?.name}
            </p>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-sm ${
              isOwnMessage
                ? 'bg-edutrack-primary text-white rounded-bl-md'
                : 'bg-gray-100 text-edutrack-dark rounded-br-md'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
          <p className={`text-[10px] text-muted-foreground mt-1 px-2 ${
            isOwnMessage ? 'text-left' : 'text-right'
          }`}>
            {formatMessageTime(msg.createdAt)}
          </p>
        </div>
      </motion.div>
    );
  };

  // ─── Render: Contact Item ──────────────────────────────────
  const renderContactItem = (contact: ContactItem) => (
    <motion.button
      key={contact.userId}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => startConversation(contact.userId)}
      disabled={creatingConversation}
      className="w-full text-right flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100"
    >
      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
        <AvatarFallback className={`${getAvatarColor(contact.role)} text-white text-sm font-bold`}>
          {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-edutrack-dark truncate">{contact.name}</h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border ${getRoleBadgeColor(contact.role)}`}>
            {getRoleLabel(contact.role)}
          </Badge>
          {contact.subjectName && (
            <span className="text-[10px] text-muted-foreground truncate">
              مادة: {contact.subjectName}
            </span>
          )}
          {contact.childrenNames?.length > 0 && (
            <span className="text-[10px] text-muted-foreground truncate">
              أولياء: {contact.childrenNames.join('، ')}
            </span>
          )}
        </div>
      </div>

      <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );

  // ─── Render: Empty States ──────────────────────────────────

  const renderEmptyConversations = () => (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-gray-300" />
      </div>
      <p className="text-base font-semibold text-edutrack-dark mb-1">لا توجد محادثات</p>
      <p className="text-sm text-muted-foreground text-center">
        ابدأ محادثة جديدة للتواصل مع زملائك
      </p>
      <Button
        onClick={() => {
          fetchContacts();
          setShowNewConversationDialog(true);
        }}
        className="mt-4 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white gap-2 h-9 text-sm"
      >
        <Plus className="h-4 w-4" />
        محادثة جديدة
      </Button>
    </motion.div>
  );

  const renderEmptyChat = () => (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center justify-center h-full py-20 px-4"
    >
      <div className="h-20 w-20 rounded-full bg-edutrack-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-10 w-10 text-edutrack-primary/40" />
      </div>
      <p className="text-lg font-semibold text-edutrack-dark mb-2">اختر محادثة أو ابدأ واحدة جديدة</p>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        حدد محادثة من القائمة أو أنشئ محادثة جديدة للتواصل مع الأساتذة والأولياء والإدارة
      </p>
    </motion.div>
  );

  // ─── Render: Conversations Panel ───────────────────────────
  const renderConversationsPanel = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full"
    >
      {/* Search Bar */}
      <motion.div variants={itemVariants} className="p-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في المحادثات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pr-9 h-9 bg-gray-50 border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg text-sm"
          />
        </div>
      </motion.div>

      <Separator className="bg-gray-100" />

      {/* Conversations List */}
      {loadingConversations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-edutrack-primary animate-spin" />
        </div>
      ) : filteredConversations.length === 0 ? (
        searchQuery ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Search className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد نتائج للبحث</p>
          </div>
        ) : (
          renderEmptyConversations()
        )
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <AnimatePresence>
              {filteredConversations.map(conv => renderConversationItem(conv))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );

  // ─── Render: Chat Panel ────────────────────────────────────
  const renderChatPanel = () => {
    if (!activeConversation) {
      return renderEmptyChat();
    }

    const other = getOtherParticipant(activeConversation, user?.id || '');

    return (
      <motion.div
        key={activeConversation.id}
        variants={slideFromLeft}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col h-full"
      >
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToList}
              className="h-8 w-8 text-edutrack-dark hover:bg-edutrack-primary/10 ml-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
            <AvatarFallback className={`${getAvatarColor(other?.role || '')} text-white text-sm font-bold`}>
              {other?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-edutrack-dark truncate">
              {other ? getParticipantDisplayName(other) : 'محادثة'}
            </h3>
            <div className="flex items-center gap-1.5">
              {other && (
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 border ${getRoleBadgeColor(other.role)}`}>
                  {getRoleLabel(other.role)}
                </Badge>
              )}
              {other && getParticipantRoleInfo(other) && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {getParticipantRoleInfo(other)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-edutrack-primary animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {activeConversation.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">ابدأ المحادثة بإرسال رسالة</p>
                </div>
              ) : (
                activeConversation.messages.map((msg, index) => renderMessage(msg, index))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Message Input */}
        <div className="p-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Input
              ref={messageInputRef}
              placeholder="اكتب رسالة..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sendingMessage}
              className="flex-1 h-10 bg-gray-50 border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-xl text-sm pr-4"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="h-10 w-10 p-0 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-xl shadow-sm"
            >
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── Render: New Conversation Dialog ───────────────────────
  const renderNewConversationDialog = () => {
    const hasDirectors = contacts.directors.length > 0;
    const hasTeachers = contacts.teachers.length > 0;
    const hasParents = contacts.parents.length > 0;
    const totalContacts = contacts.directors.length + contacts.teachers.length + contacts.parents.length;

    // Determine default tab
    let defaultTab = 'teachers';
    if (hasDirectors) defaultTab = 'directors';
    else if (hasTeachers) defaultTab = 'teachers';
    else if (hasParents) defaultTab = 'parents';

    return (
      <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-right flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-edutrack-primary" />
              </div>
              محادثة جديدة
            </DialogTitle>
            <DialogDescription className="text-right">
              اختر شخصًا لبدء محادثة معه
            </DialogDescription>
          </DialogHeader>

          {loadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-edutrack-primary animate-spin" />
            </div>
          ) : totalContacts === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد جهات اتصال متاحة</p>
            </div>
          ) : (
            <Tabs defaultValue={defaultTab} className="flex-1 min-h-0" dir="rtl">
              <TabsList className="w-full justify-start">
                {hasDirectors && (
                  <TabsTrigger value="directors" className="gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5" />
                    المدير
                    {contacts.directors.length > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[9px]">
                        {contacts.directors.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {hasTeachers && (
                  <TabsTrigger value="teachers" className="gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    الأساتذة
                    {contacts.teachers.length > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[9px]">
                        {contacts.teachers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {hasParents && (
                  <TabsTrigger value="parents" className="gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    أولياء الأمور
                    {contacts.parents.length > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-[18px] px-1 text-[9px]">
                        {contacts.parents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="mt-3 flex-1 min-h-0">
                {hasDirectors && (
                  <TabsContent value="directors">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-1">
                        {contacts.directors.map(c => renderContactItem(c))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                )}
                {hasTeachers && (
                  <TabsContent value="teachers">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-1">
                        {contacts.teachers.map(c => renderContactItem(c))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                )}
                {hasParents && (
                  <TabsContent value="parents">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-1">
                        {contacts.parents.map(c => renderContactItem(c))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}

          {creatingConversation && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Loader2 className="h-4 w-4 text-edutrack-primary animate-spin" />
              <span className="text-sm text-muted-foreground">جاري إنشاء المحادثة...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // ─── Main Render ───────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-[calc(100vh-140px)] flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-edutrack-primary" />
            </div>
            المراسلات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {conversations.length > 0
              ? `${conversations.length} محادثة`
              : 'تواصل مع الأساتذة والأولياء والإدارة'}
          </p>
        </div>
        <Button
          onClick={() => {
            fetchContacts();
            setShowNewConversationDialog(true);
          }}
          className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white gap-2 h-9 text-sm shadow-sm"
        >
          <Plus className="h-4 w-4" />
          محادثة جديدة
        </Button>
      </motion.div>

      {/* Main Content: Two-Panel Layout */}
      <motion.div variants={itemVariants} className="flex-1 min-h-0 flex gap-4">
        <Card className="flex-1 shadow-sm border-gray-200 overflow-hidden">
          {/* Mobile: Show either conversations list or chat */}
          {isMobile ? (
            <div className="h-full">
              <AnimatePresence mode="wait">
                {mobileShowChat ? (
                  <motion.div
                    key="chat"
                    variants={slideFromLeft}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    {renderChatPanel()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    variants={slideFromRight}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="h-full"
                  >
                    {renderConversationsPanel()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Desktop: Two-panel side by side */
            <div className="h-full flex">
              {/* Right Panel: Conversations List */}
              <div className="w-80 border-l border-gray-100 flex flex-col h-full">
                {renderConversationsPanel()}
              </div>

              {/* Left Panel: Chat */}
              <div className="flex-1 min-w-0 h-full">
                <AnimatePresence mode="wait">
                  {renderChatPanel()}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* New Conversation Dialog */}
      {renderNewConversationDialog()}
    </motion.div>
  );
}
