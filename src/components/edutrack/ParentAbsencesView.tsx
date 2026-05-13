'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardX,
  BookOpen,
  User,
  Bell,
  BellOff,
  Calendar,
  Home,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

// ─── Demo Data ──────────────────────────────────────────────
interface AbsenceEntry {
  id: string;
  date: string;
  formattedDate: string;
  subject: string;
  teacherName: string;
  notificationSent: boolean;
  time: string;
}

const demoAbsences: AbsenceEntry[] = [
  { id: '1', date: '2025-01-12', formattedDate: 'الأحد 12 جانفي 2025', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', notificationSent: true, time: '08:00' },
  { id: '2', date: '2025-01-09', formattedDate: 'الخميس 9 جانفي 2025', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', notificationSent: true, time: '08:00' },
  { id: '3', date: '2025-01-05', formattedDate: 'الأحد 5 جانفي 2025', subject: 'الفيزياء', teacherName: 'الأستاذ محمد', notificationSent: true, time: '10:00' },
  { id: '4', date: '2024-12-22', formattedDate: 'الأحد 22 ديسمبر 2024', subject: 'العلوم', teacherName: 'الأستاذ كريم', notificationSent: false, time: '14:00' },
  { id: '5', date: '2024-12-18', formattedDate: 'الأربعاء 18 ديسمبر 2024', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', notificationSent: true, time: '09:00' },
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

// ─── Main Component ─────────────────────────────────────────
export default function ParentAbsencesView() {
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
        <motion.div variants={itemVariants} className="mb-5">
          <h1 className="text-xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ClipboardX className="h-5 w-5 text-red-500" />
            </div>
            سجل الغيابات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">سجل غيابات أحمد - 3 متوسط</p>
        </motion.div>

        {/* Summary */}
        <motion.div variants={itemVariants} className="mb-5">
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <ClipboardX className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-700">إجمالي الغيابات</p>
                    <p className="text-xs text-red-600">هذا الشهر</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-red-600 font-inter">{demoAbsences.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline-style Absence List */}
        <motion.div variants={itemVariants}>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              <AnimatePresence>
                {demoAbsences.map((absence, index) => (
                  <motion.div
                    key={absence.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    className="relative pr-10"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute right-[13px] top-4 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm z-10" />

                    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300">
                      <CardContent className="p-4">
                        {/* Date */}
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground font-inter">{absence.formattedDate}</p>
                          <span className="text-xs text-muted-foreground font-inter">· {absence.time}</span>
                        </div>

                        {/* Subject & Teacher */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-edutrack-primary" />
                            <p className="text-sm font-semibold text-edutrack-dark">{absence.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{absence.teacherName}</p>
                          </div>
                        </div>

                        {/* Notification Status */}
                        <div className="mt-3 flex items-center gap-2">
                          {absence.notificationSent ? (
                            <>
                              <Bell className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs text-emerald-600">تم إعلامك</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs text-amber-600">لم يتم إعلامك</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Empty State Fallback (not shown with demo data) */}
        {demoAbsences.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <CheckCircle2 className="h-16 w-16 text-emerald-200 mx-auto mb-4" />
            <p className="text-lg font-semibold text-edutrack-dark">لا توجد غيابات</p>
            <p className="text-sm text-muted-foreground mt-1">حضور ابنك ممتاز هذا الشهر!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
