'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Bell,
  BellRing,
  ClipboardX,
  Receipt,
  Activity,
  Info,
  CheckCheck,
  XCircle,
  Settings,
  Loader2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Notification Types ─────────────────────────────────────
type NotificationType = 'ABSENCE' | 'CANCELLATION' | 'INVOICE' | 'GENERAL' | 'ACTIVITY' | 'SYSTEM';

interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Type Configuration ─────────────────────────────────────
const typeConfig: Record<NotificationType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  priority: number;
}> = {
  ABSENCE: {
    label: 'غياب',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-r-red-500',
    icon: <ClipboardX className="h-5 w-5 text-red-500" />,
    priority: 1,
  },
  CANCELLATION: {
    label: 'إلغاء',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-r-amber-500',
    icon: <XCircle className="h-5 w-5 text-amber-500" />,
    priority: 2,
  },
  INVOICE: {
    label: 'فاتورة',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-r-orange-500',
    icon: <Receipt className="h-5 w-5 text-orange-500" />,
    priority: 3,
  },
  ACTIVITY: {
    label: 'نشاط',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-r-teal-500',
    icon: <Activity className="h-5 w-5 text-teal-500" />,
    priority: 4,
  },
  GENERAL: {
    label: 'عام',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-r-gray-400',
    icon: <Info className="h-5 w-5 text-gray-500" />,
    priority: 5,
  },
  SYSTEM: {
    label: 'نظام',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-r-purple-500',
    icon: <Settings className="h-5 w-5 text-purple-500" />,
    priority: 6,
  },
};

// ─── Filter Tab Keys ────────────────────────────────────────
type FilterTab = 'all' | 'unread' | 'ABSENCE' | 'INVOICE' | 'ACTIVITY';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروء' },
  { key: 'ABSENCE', label: 'غياب' },
  { key: 'INVOICE', label: 'فواتير' },
  { key: 'ACTIVITY', label: 'أنشطة' },
];

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const cardVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

// ─── Helper: Format Relative Time (Arabic) ─────────────────
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  return date.toLocaleDateString('ar-DZ');
}

// ─── Helper: Get Priority Border Class ──────────────────────
function getPriorityAccent(type: NotificationType): string {
  const config = typeConfig[type];
  if (!config) return '';
  if (config.priority <= 2) return 'border-r-4 border-r-red-400'; // urgent
  if (config.priority === 3) return 'border-r-4 border-r-orange-400'; // important
  if (config.priority === 4) return 'border-r-4 border-r-teal-400'; // info
  return '';
}

// ─── Loading Skeleton ───────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────
function EmptyState({ filterLabel }: { filterLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-4"
    >
      <div className="h-20 w-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <Bell className="h-10 w-10 text-gray-300" />
      </div>
      <p className="text-lg font-semibold text-gray-800">لا توجد إشعارات</p>
      <p className="text-sm text-muted-foreground mt-1">
        {filterLabel === 'الكل'
          ? 'ستظهر إشعاراتك هنا عند توفرها'
          : `لا توجد إشعارات في تصنيف "${filterLabel}"`}
      </p>
    </motion.div>
  );
}

// ─── Notification Card ──────────────────────────────────────
function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
}) {
  const config = typeConfig[notification.type] || typeConfig.GENERAL;
  const priorityAccent = getPriorityAccent(notification.type);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card
        className={`border-0 shadow-sm cursor-pointer transition-all duration-300 active:scale-[0.98] ${
          notification.read
            ? 'bg-white hover:shadow-md'
            : `bg-white/80 shadow-md ${priorityAccent || 'border-r-4 border-r-blue-400'}`
        }`}
        onClick={() => {
          if (!notification.read) {
            onMarkAsRead(notification.id);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div
              className={`h-10 w-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              {config.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <p
                      className={`text-sm font-bold leading-snug mb-0.5 ${
                        notification.read ? 'text-gray-600' : 'text-gray-900'
                      }`}
                    >
                      {notification.title}
                    </p>
                  )}
                  <p
                    className={`text-sm leading-relaxed ${
                      notification.read
                        ? 'text-muted-foreground'
                        : 'text-gray-800 font-medium'
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                {/* Unread Indicator */}
                {!notification.read && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={`${config.bgColor} ${config.color} border text-[10px] px-1.5 py-0 h-5`}
                >
                  {config.label}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Grouped Section ────────────────────────────────────────
function NotificationGroup({
  type,
  notifications,
  onMarkAsRead,
  defaultOpen = true,
}: {
  type: NotificationType;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  defaultOpen?: boolean;
}) {
  const config = typeConfig[type] || typeConfig.GENERAL;
  const [open, setOpen] = useState(defaultOpen);
  const unreadInGroup = notifications.filter((n) => !n.read).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-lg ${config.bgColor} flex items-center justify-center`}
            >
              {config.icon}
            </div>
            <span className="text-sm font-bold text-gray-800">{config.label}</span>
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600"
            >
              {notifications.length}
            </Badge>
            {unreadInGroup > 0 && (
              <Badge className="text-[10px] h-5 px-1.5 bg-blue-500 text-white border-0">
                {unreadInGroup} جديد
              </Badge>
            )}
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </motion.div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence>
          {open && (
            <div className="space-y-2 mt-1">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function ParentNotificationsView() {
  const user = useAppStore((s) => s.user);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [grouped, setGrouped] = useState(true);
  const prevUnreadCountRef = useRef<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── Fetch Notifications ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/parent/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
        if (typeof data.unreadCount === 'number') {
          // Check if new notifications arrived
          if (
            prevUnreadCountRef.current > 0 &&
            data.unreadCount > prevUnreadCountRef.current
          ) {
            const newCount = data.unreadCount - prevUnreadCountRef.current;
            toast.info(`لديك ${newCount} إشعار جديد`, {
              icon: <BellRing className="h-4 w-4 text-blue-500" />,
            });
          }
          prevUnreadCountRef.current = data.unreadCount;
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // Silent fail - keep existing data
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ─── Initial Fetch & Auto-Refresh ────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ─── Mark Single as Read ─────────────────────────────────
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch('/api/parent/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        });
      } catch {
        toast.error('حدث خطأ أثناء تحديث الإشعار');
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
      }
    },
    []
  );

  // ─── Mark All as Read ────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = [...notifications];
    const previousUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/parent/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: user?.id }),
      });
      toast.success('تم تعليم الكل كمقروء');
    } catch {
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
      setNotifications(previousNotifications);
      setUnreadCount(previousUnread);
    }
  }, [notifications, unreadCount, user?.id]);

  // ─── Filtered Notifications ──────────────────────────────
  const filteredNotifications = React.useMemo(() => {
    let result = notifications;

    switch (activeFilter) {
      case 'unread':
        result = notifications.filter((n) => !n.read);
        break;
      case 'ABSENCE':
        result = notifications.filter((n) => n.type === 'ABSENCE' || n.type === 'CANCELLATION');
        break;
      case 'INVOICE':
        result = notifications.filter((n) => n.type === 'INVOICE');
        break;
      case 'ACTIVITY':
        result = notifications.filter((n) => n.type === 'ACTIVITY');
        break;
      default:
        break;
    }

    // Sort by priority then date
    return result.sort((a, b) => {
      const aConfig = typeConfig[a.type] || typeConfig.GENERAL;
      const bConfig = typeConfig[b.type] || typeConfig.GENERAL;
      // Unread first
      if (a.read !== b.read) return a.read ? 1 : -1;
      // Then by priority
      if (aConfig.priority !== bConfig.priority) return aConfig.priority - bConfig.priority;
      // Then by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, activeFilter]);

  // ─── Grouped Notifications by Type ───────────────────────
  const groupedNotifications = React.useMemo(() => {
    const groups: Partial<Record<NotificationType, NotificationItem[]>> = {};
    for (const n of filteredNotifications) {
      const type = n.type;
      if (!groups[type]) groups[type] = [];
      groups[type]!.push(n);
    }
    // Sort groups by priority
    const sortedTypes = Object.keys(groups).sort((a, b) => {
      const aConfig = typeConfig[a as NotificationType];
      const bConfig = typeConfig[b as NotificationType];
      return (aConfig?.priority ?? 99) - (bConfig?.priority ?? 99);
    }) as NotificationType[];
    return sortedTypes.map((type) => ({
      type,
      items: groups[type]!,
    }));
  }, [filteredNotifications]);

  // ─── Current Filter Label ────────────────────────────────
  const currentFilterLabel =
    filterTabs.find((t) => t.key === activeFilter)?.label || 'الكل';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir="rtl"
      className="px-1"
    >
      {/* ─── Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            {unreadCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute -top-1 -left-1 h-5 min-w-5 px-1 rounded-full bg-red-500 flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </motion.div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGrouped((p) => !p)}
            className={`h-8 w-8 p-0 ${grouped ? 'text-blue-500 bg-blue-50' : 'text-gray-400'}`}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs gap-1.5 h-8"
            >
              <CheckCheck className="h-4 w-4" />
              تعليم الكل
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Filter Tabs ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-4">
        <Tabs
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as FilterTab)}
        >
          <TabsList className="w-full h-10 p-1 bg-gray-100/80">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="text-xs h-8 px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {tab.label}
                {tab.key === 'unread' && unreadCount > 0 && (
                  <span className="mr-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ─── Notification Content ────────────────────────── */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState filterLabel={currentFilterLabel} />
      ) : grouped ? (
        /* ─── Grouped View ──────────────────────────────── */
        <ScrollArea className="max-h-[calc(100vh-220px)]">
          <div className="space-y-4">
            {groupedNotifications.map((group) => (
              <NotificationGroup
                key={group.type}
                type={group.type}
                notifications={group.items}
                onMarkAsRead={markAsRead}
                defaultOpen={group.items.some((n) => !n.read)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        /* ─── Chronological View ────────────────────────── */
        <ScrollArea className="max-h-[calc(100vh-220px)]">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}
