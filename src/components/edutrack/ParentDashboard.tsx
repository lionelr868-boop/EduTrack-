'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Home,
  Calendar,
  ClipboardX,
  Receipt,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';

// ─── Bottom Navigation Config ───────────────────────────────
interface BottomNavItem {
  label: string;
  icon: React.ReactNode;
  view: ViewType;
}

const bottomNavItems: BottomNavItem[] = [
  { label: 'الرئيسية', icon: <Home className="h-5 w-5" />, view: 'parent-dashboard' },
  { label: 'الجدول', icon: <Calendar className="h-5 w-5" />, view: 'parent-schedule' },
  { label: 'الغيابات', icon: <ClipboardX className="h-5 w-5" />, view: 'parent-absences' },
  { label: 'الفواتير', icon: <Receipt className="h-5 w-5" />, view: 'parent-invoices' },
  { label: 'الإشعارات', icon: <Bell className="h-5 w-5" />, view: 'parent-notifications' },
];

// ─── Quick Actions Config ───────────────────────────────────
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  view: ViewType;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  { label: 'الجدول الأسبوعي', icon: <Calendar className="h-7 w-7" />, view: 'parent-schedule', color: 'text-edutrack-primary', bgColor: 'bg-edutrack-primary/10' },
  { label: 'سجل الغيابات', icon: <ClipboardX className="h-7 w-7" />, view: 'parent-absences', color: 'text-red-500', bgColor: 'bg-red-50' },
  { label: 'الفواتير', icon: <Receipt className="h-7 w-7" />, view: 'parent-invoices', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { label: 'الإشعارات', icon: <Bell className="h-7 w-7" />, view: 'parent-notifications', color: 'text-blue-500', bgColor: 'bg-blue-50' },
];

// ─── Animation Variants ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Bottom Navigation Bar ──────────────────────────────────
function BottomNavBar() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
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

// ─── Main Component ─────────────────────────────────────────
export default function ParentDashboard() {
  const { user, setCurrentView } = useAppStore();

  // Demo data
  const childName = 'أحمد محمد';
  const childLevel = '3 متوسط';
  const hasSessionsToday = true;
  const attendanceToday = 'حضر حصتين من 3';
  const latestNotification = 'تم إعلامك بغياب أحمد عن حصة الرياضيات';

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-24 px-1"
        dir="rtl"
      >
        {/* Welcome */}
        <motion.div variants={itemVariants} className="mb-5">
          <h1 className="text-xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'ولي الأمر'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {/* Child Card */}
        <motion.div variants={itemVariants} className="mb-5">
          <Card className="border-0 shadow-lg shadow-gray-200/50 bg-gradient-to-bl from-edutrack-primary to-edutrack-primary/90 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-3 border-white/30 shadow-lg">
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">
                    {childName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white mb-1">ابنك {childName}</h2>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {childLevel}
                  </Badge>
                </div>
                <ChevronLeft className="h-5 w-5 text-white/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Status */}
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3">حالة اليوم</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Has Sessions? */}
            <Card className={`border-0 shadow-sm ${hasSessionsToday ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <CardContent className="p-4 text-center">
                <div className={`h-11 w-11 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                  hasSessionsToday ? 'bg-emerald-100' : 'bg-gray-100'
                }`}>
                  {hasSessionsToday ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">هل لديه حصص اليوم؟</p>
                <p className={`text-sm font-bold ${hasSessionsToday ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {hasSessionsToday ? 'نعم' : 'لا'}
                </p>
              </CardContent>
            </Card>

            {/* Attended? */}
            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-4 text-center">
                <div className="h-11 w-11 rounded-xl mx-auto mb-2 flex items-center justify-center bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">هل حضر؟</p>
                <p className="text-sm font-bold text-blue-700">{attendanceToday}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Latest Notification */}
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3">آخر إشعار</h2>
          <Card className="border-0 shadow-sm bg-white border-r-4 border-r-red-400">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-edutrack-dark leading-relaxed">{latestNotification}</p>
                  <p className="text-xs text-muted-foreground mt-1">منذ ساعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-bold text-edutrack-dark mb-3">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.view}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
              >
                <Card
                  className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95"
                  onClick={() => setCurrentView(action.view)}
                >
                  <CardContent className="p-5 flex flex-col items-center gap-3">
                    <div className={`h-14 w-14 rounded-2xl ${action.bgColor} flex items-center justify-center`}>
                      <span className={action.color}>{action.icon}</span>
                    </div>
                    <p className="text-sm font-semibold text-edutrack-dark text-center">{action.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
