'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  BookOpen,
  Home,
  ClipboardX,
  Receipt,
  Bell,
} from 'lucide-react';

// ─── Demo Data ──────────────────────────────────────────────
interface SessionEntry {
  id: string;
  subject: string;
  teacherName: string;
  time: string;
  status: 'attended' | 'absent' | 'cancelled';
}

interface DaySchedule {
  dayName: string;
  dayDate: string;
  isToday: boolean;
  sessions: SessionEntry[];
}

const demoSchedule: DaySchedule[] = [
  {
    dayName: 'الأحد',
    dayDate: '12 جانفي',
    isToday: true,
    sessions: [
      { id: '1', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', time: '08:00 - 09:00', status: 'attended' },
      { id: '2', subject: 'الفيزياء', teacherName: 'الأستاذ محمد', time: '10:00 - 11:00', status: 'attended' },
      { id: '3', subject: 'العلوم', teacherName: 'الأستاذ كريم', time: '14:00 - 15:00', status: 'absent' },
    ],
  },
  {
    dayName: 'الإثنين',
    dayDate: '13 جانفي',
    isToday: false,
    sessions: [
      { id: '4', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', time: '09:00 - 10:00', status: 'attended' },
      { id: '5', subject: 'اللغة الفرنسية', teacherName: 'الأستاذة سارة', time: '11:00 - 12:00', status: 'attended' },
    ],
  },
  {
    dayName: 'الثلاثاء',
    dayDate: '14 جانفي',
    isToday: false,
    sessions: [
      { id: '6', subject: 'الفيزياء', teacherName: 'الأستاذ محمد', time: '08:00 - 09:00', status: 'cancelled' },
      { id: '7', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', time: '10:00 - 11:00', status: 'attended' },
    ],
  },
  {
    dayName: 'الأربعاء',
    dayDate: '15 جانفي',
    isToday: false,
    sessions: [
      { id: '8', subject: 'العلوم', teacherName: 'الأستاذ كريم', time: '09:00 - 10:00', status: 'attended' },
    ],
  },
  {
    dayName: 'الخميس',
    dayDate: '16 جانفي',
    isToday: false,
    sessions: [
      { id: '9', subject: 'الرياضيات', teacherName: 'الأستاذ محمد', time: '08:00 - 09:00', status: 'absent' },
      { id: '10', subject: 'اللغة الفرنسية', teacherName: 'الأستاذة سارة', time: '10:00 - 11:00', status: 'attended' },
    ],
  },
];

const sessionStatusConfig = {
  attended: { label: 'حضر', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-r-emerald-500', icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
  absent: { label: 'غاب', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-r-red-500', icon: <XCircle className="h-5 w-5 text-red-500" /> },
  cancelled: { label: 'ملغاة', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-r-gray-400', icon: <MinusCircle className="h-5 w-5 text-gray-400" /> },
};

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
export default function ParentScheduleView() {
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
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-edutrack-primary" />
            </div>
            الجدول الأسبوعي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">جدول حصص أحمد - 3 متوسط</p>
        </motion.div>

        {/* Day Sections - List View */}
        <div className="space-y-5">
          {demoSchedule.map((day, dayIndex) => (
            <motion.div
              key={day.dayName}
              variants={itemVariants}
            >
              {/* Day Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  day.isToday ? 'bg-edutrack-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold ${day.isToday ? 'text-edutrack-primary' : 'text-edutrack-dark'}`}>
                    {day.dayName}
                    {day.isToday && (
                      <Badge className="mr-2 bg-edutrack-primary/10 text-edutrack-primary border-0 text-[10px] px-1.5 py-0">اليوم</Badge>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">{day.dayDate}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {day.sessions.length} حصة
                </span>
              </div>

              {/* Session Cards */}
              <div className="space-y-2 mr-12">
                <AnimatePresence>
                  {day.sessions.map((session, sessionIndex) => {
                    const status = sessionStatusConfig[session.status];
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: dayIndex * 0.1 + sessionIndex * 0.05, duration: 0.3 }}
                      >
                        <Card className={`border-0 shadow-sm bg-white border-r-4 ${status.borderColor}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {status.icon}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-edutrack-dark">{session.subject}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-muted-foreground">{session.teacherName}</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground font-inter">{session.time}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className={`${status.bgColor} ${status.color} border text-[10px] px-1.5 py-0.5`}>
                                {status.label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
