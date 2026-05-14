'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  AlertCircle,
  Receipt,
  Info,
  CheckCheck,
  Activity,
  Settings,
  Loader2,
  ClipboardCheck,
  MessageCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Notification Types ─────────────────────────────────────
interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ABSENCE: { label: 'غياب', color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertCircle className="h-5 w-5 text-red-500" /> },
  INVOICE: { label: 'فاتورة', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <Receipt className="h-5 w-5 text-orange-500" /> },
  CANCELLATION: { label: 'إلغاء', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
  ACTIVITY: { label: 'نشاط', color: 'text-teal-600', bgColor: 'bg-teal-50', icon: <Activity className="h-5 w-5 text-teal-500" /> },
  SYSTEM: { label: 'نظام', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Settings className="h-5 w-5 text-gray-500" /> },
  GENERAL: { label: 'عام', color: 'text-sky-600', bgColor: 'bg-sky-50', icon: <Info className="h-5 w-5 text-sky-500" /> },
  ATTENDANCE: { label: 'حضور', color: 'text-teal-600', bgColor: 'bg-teal-50', icon: <ClipboardCheck className="h-5 w-5 text-teal-500" /> },
  MESSAGE: { label: 'رسالة', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: <MessageCircle className="h-5 w-5 text-purple-500" /> },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.GENERAL;
}

// ─── Animation Variants ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── Helper: Format Relative Time ──────────────────────────
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

// ─── Helper: Get action view based on notification type and user role ──
function getActionView(type: string, role: string): string | null {
  switch (type) {
    case 'ABSENCE':
      if (role === 'TEACHER') return 'teacher-attendance';
      if (role === 'DIRECTOR') return 'director-absences';
      if (role === 'PARENT') return 'parent-absences';
      return null;
    case 'ATTENDANCE':
      if (role === 'TEACHER') return 'teacher-attendance';
      if (role === 'DIRECTOR') return 'director-absences';
      return null;
    case 'MESSAGE':
      if (role === 'TEACHER') return 'teacher-messages';
      if (role === 'DIRECTOR') return 'director-messages';
      if (role === 'PARENT') return 'parent-messages';
      return null;
    default:
      return null;
  }
}

function getActionLabel(type: string): string | null {
  switch (type) {
    case 'ABSENCE': return 'عرض التفاصيل';
    case 'ATTENDANCE': return 'عرض الكشف';
    case 'MESSAGE': return 'فتح المحادثة';
    default: return null;
  }
}

// ─── Main Component ─────────────────────────────────────────
export default function NotificationsView() {
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    if (!user?.id) return;
    if (pageNum === 1) setLoading(true);

    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(1);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    } catch {
      toast.error('حدث خطأ أثناء تحديث الإشعار');
      // Revert on error
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: user?.id }),
      });
      toast.success('تم تعليم الكل كمقروء');
    } catch {
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(notificationId);

    // Optimistic removal
    const previousNotifications = notifications;
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setTotalCount(prev => prev - 1);

    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('تم حذف الإشعار');
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف الإشعار');
      // Revert on error
      setNotifications(previousNotifications);
      setTotalCount(prev => prev + 1);
    } finally {
      setDeletingId(null);
    }
  };

  const handleActionClick = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.role) return;
    const view = getActionView(type, user.role);
    if (view) {
      setCurrentView(view as ViewType);
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  // Group notifications by date
  const groupedNotifications: { label: string; items: NotificationItem[] }[] = [];
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let currentGroup = '';
  let currentItems: NotificationItem[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    const dateStr = date.toDateString();
    let groupLabel: string;

    if (dateStr === todayStr) {
      groupLabel = 'اليوم';
    } else if (dateStr === yesterdayStr) {
      groupLabel = 'أمس';
    } else {
      const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        groupLabel = 'هذا الأسبوع';
      } else {
        groupLabel = 'أقدم';
      }
    }

    if (groupLabel !== currentGroup) {
      if (currentItems.length > 0) {
        groupedNotifications.push({ label: currentGroup, items: currentItems });
      }
      currentGroup = groupLabel;
      currentItems = [n];
    } else {
      currentItems.push(n);
    }
  });

  if (currentItems.length > 0) {
    groupedNotifications.push({ label: currentGroup, items: currentItems });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-edutrack-primary" />
            </div>
            الإشعارات
          </h1>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} إشعار غير مقروء من أصل ${totalCount}`
                : `جميع الإشعارات مقروءة (${totalCount})`}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-edutrack-primary hover:text-edutrack-primary/80 border-edutrack-primary/30 hover:bg-edutrack-primary/5 text-xs gap-1.5 h-9"
          >
            <CheckCheck className="h-4 w-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </motion.div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <Bell className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-semibold text-edutrack-dark">لا توجد إشعارات</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر إشعاراتك هنا عند توفرها</p>
        </motion.div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-220px)]">
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <span className="h-px flex-1 bg-border" />
                  {group.label}
                  <span className="h-px flex-1 bg-border" />
                </h3>
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((notification, index) => {
                      const type = getTypeConfig(notification.type);
                      const actionLabel = getActionLabel(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                        >
                          <Card
                            className={`border shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md group relative ${
                              notification.read
                                ? 'bg-white hover:bg-gray-50/50'
                                : 'bg-edutrack-primary/[0.03] shadow-md border-r-4 border-r-edutrack-primary'
                            }`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Type Icon */}
                                <div className={`h-10 w-10 rounded-xl ${type.bgColor} flex items-center justify-center flex-shrink-0`}>
                                  {type.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {notification.title && (
                                    <p className="text-sm font-semibold text-edutrack-dark mb-0.5">
                                      {notification.title}
                                    </p>
                                  )}
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm leading-relaxed ${
                                      notification.read ? 'text-muted-foreground' : 'text-edutrack-dark font-medium'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {!notification.read && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-edutrack-primary mt-1.5" />
                                      )}
                                      {/* Delete Button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                        onClick={(e) => deleteNotification(notification.id, e)}
                                        disabled={deletingId === notification.id}
                                      >
                                        {deletingId === notification.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <X className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge variant="outline" className={`${type.bgColor} ${type.color} border text-[10px] px-1.5 py-0`}>
                                      {type.label}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatRelativeTime(notification.createdAt)}
                                    </span>
                                    {/* Action Button */}
                                    {actionLabel && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-edutrack-primary hover:text-edutrack-primary/80 hover:bg-edutrack-primary/10 gap-1 font-medium"
                                        onClick={(e) => handleActionClick(notification.type, e)}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        {actionLabel}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  className="text-edutrack-primary border-edutrack-primary/30 hover:bg-edutrack-primary/5"
                >
                  عرض المزيد
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
