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
  Calendar,
  Home,
  ClipboardX,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Notification Types ─────────────────────────────────────
interface NotificationItem {
  id: string;
  message: string;
  type: 'ABSENCE' | 'INVOICE' | 'CANCELLATION' | 'GENERAL';
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ABSENCE: { label: 'غياب', color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertCircle className="h-5 w-5 text-red-500" /> },
  INVOICE: { label: 'فاتورة', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <Receipt className="h-5 w-5 text-orange-500" /> },
  CANCELLATION: { label: 'إلغاء', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
  GENERAL: { label: 'عام', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Info className="h-5 w-5 text-blue-500" /> },
};

// ─── Demo Notifications ─────────────────────────────────────
const demoNotifications: NotificationItem[] = [
  { id: '1', message: 'تم إعلامك بغياب أحمد عن حصة الرياضيات اليوم', type: 'ABSENCE', read: false, createdAt: '2025-01-12T08:30:00' },
  { id: '2', message: 'فاتورة شهر جانفي جاهزة - المبلغ: 15,000 دج', type: 'INVOICE', read: false, createdAt: '2025-01-10T10:00:00' },
  { id: '3', message: 'تم إلغاء حصة الفيزياء يوم الخميس بسبب غياب الأستاذ', type: 'CANCELLATION', read: false, createdAt: '2025-01-09T14:00:00' },
  { id: '4', message: 'سيتم جدولة حصة تعويضية للرياضيات الأسبوع القادم', type: 'GENERAL', read: true, createdAt: '2025-01-08T09:00:00' },
  { id: '5', message: 'غاب أحمد عن حصة العلوم يوم الأحد الماضي', type: 'ABSENCE', read: true, createdAt: '2025-01-05T16:00:00' },
  { id: '6', message: 'تم دفع فاتورة شهر ديسمبر بنجاح', type: 'INVOICE', read: true, createdAt: '2025-01-02T11:00:00' },
];

// ─── Bottom Navigation Bar ──────────────────────────────────
const bottomNavItems: { label: string; icon: React.ReactNode; view: ViewType }[] = [
  { label: 'الرئيسية', icon: <Home className="h-5 w-5" />, view: 'parent-dashboard' },
  { label: 'الجدول', icon: <Calendar className="h-5 w-5" />, view: 'parent-schedule' },
  { label: 'الغيابات', icon: <ClipboardX className="h-5 w-5" />, view: 'parent-absences' },
  { label: 'الفواتير', icon: <Receipt className="h-5 w-5" />, view: 'parent-invoices' },
  { label: 'الإشعارات', icon: <Bell className="h-5 w-5" />, view: 'parent-notifications' },
];

function BottomNavBar() {
  const { currentView, setCurrentView } = useAppStore();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {bottomNavItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors duration-200 ${
                isActive ? 'text-edutrack-primary' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-edutrack-primary/10' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-edutrack-primary' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
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
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'منذ أقل من ساعة';
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-DZ');
}

// ─── Main Component ─────────────────────────────────────────
export default function ParentNotificationsView() {
  const user = useAppStore((s) => s.user);
  const [notifications, setNotifications] = useState<NotificationItem[]>(demoNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/notifications?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
        }
      }
    } catch {
      // Use demo data on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );

    try {
      await fetch('/api/parent/notifications', {
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
      await fetch('/api/parent/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: user?.id }),
      });
      toast.success('تم تعليم الكل كمقروء');
    } catch {
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-24 px-1"
        dir="rtl"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-edutrack-dark flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-edutrack-primary hover:text-edutrack-primary/80 text-xs gap-1.5 h-9"
            >
              <CheckCheck className="h-4 w-4" />
              تعليم الكل
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
            <p className="text-sm text-muted-foreground mt-1">ستظهر إشعاراتك هنا</p>
          </motion.div>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div className="space-y-2">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const type = typeConfig[notification.type] || typeConfig.GENERAL;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <Card
                        className={`border-0 shadow-sm cursor-pointer transition-all duration-300 active:scale-[0.98] ${
                          notification.read
                            ? 'bg-white hover:shadow-md'
                            : 'bg-edutrack-primary/5 shadow-md border-r-4 border-r-edutrack-primary'
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
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-relaxed ${
                                  notification.read ? 'text-muted-foreground' : 'text-edutrack-dark font-semibold'
                                }`}>
                                  {notification.message}
                                </p>
                                {!notification.read && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-edutrack-primary flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={`${type.bgColor} ${type.color} border text-[10px] px-1.5 py-0`}>
                                  {type.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatRelativeTime(notification.createdAt)}
                                </span>
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
          </ScrollArea>
        )}
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
