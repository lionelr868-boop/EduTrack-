'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  ClipboardCheck,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── Demo Data ──────────────────────────────────────────────
interface TodaySession {
  id: string;
  subject: string;
  time: string;
  level: string;
  status: 'upcoming' | 'done' | 'cancelled';
}

const demoTodaySessions: TodaySession[] = [
  { id: '1', subject: 'الرياضيات', time: '08:00 - 09:00', level: '3 متوسط', status: 'done' },
  { id: '2', subject: 'الرياضيات', time: '09:30 - 10:30', level: '2 ثانوي', status: 'done' },
  { id: '3', subject: 'الفيزياء', time: '11:00 - 12:00', level: '3 متوسط', status: 'upcoming' },
  { id: '4', subject: 'العلوم', time: '14:00 - 15:00', level: '1 ثانوي', status: 'cancelled' },
];

const weeklyAttendanceData = [
  { day: 'الأحد', rate: 92 },
  { day: 'الإثنين', rate: 88 },
  { day: 'الثلاثاء', rate: 85 },
  { day: 'الأربعاء', rate: 90 },
  { day: 'الخميس', rate: 89 },
];

const recentAbsenceAlerts = [
  { id: '1', studentName: 'أمين حسين', subject: 'الرياضيات', date: 'اليوم', time: '08:00' },
  { id: '2', studentName: 'سارة بلقاسم', subject: 'الفيزياء', date: 'أمس', time: '10:00' },
  { id: '3', studentName: 'ياسين مراد', subject: 'الرياضيات', date: 'أمس', time: '09:30' },
  { id: '4', studentName: 'زينب شريف', subject: 'العلوم', date: 'منذ يومين', time: '14:00' },
];

// ─── Status Config ──────────────────────────────────────────
const statusConfig = {
  done: { label: 'منجزة', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  upcoming: { label: 'قادمة', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', dotColor: 'bg-blue-500', icon: <Clock className="h-4 w-4" /> },
  cancelled: { label: 'ملغاة', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', dotColor: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
};

// ─── Custom Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 text-right" dir="rtl">
      <p className="text-xs font-semibold text-edutrack-dark mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full ml-1" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-edutrack-dark">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

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

// ─── Main Component ─────────────────────────────────────────
export default function TeacherDashboard() {
  const user = useAppStore((s) => s.user);
  const todayDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'الأستاذ'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إليك ملخص نشاطك اليوم</p>
        </div>
        <Badge variant="outline" className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5">
          <CalendarDays className="h-3.5 w-3.5 ml-1.5" />
          {todayDate}
        </Badge>
      </motion.div>

      {/* Today's Sessions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-edutrack-dark mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-edutrack-primary" />
          حصص اليوم
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoTodaySessions.map((session, index) => {
            const status = statusConfig[session.status];
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.08, ease: 'easeOut' }}
              >
                <Card className={`border overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer ${status.bgColor}`}>
                  <div className={`h-1 ${session.status === 'done' ? 'bg-emerald-500' : session.status === 'upcoming' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                        <h3 className="font-bold text-edutrack-dark">{session.subject}</h3>
                      </div>
                      <Badge variant="outline" className={`${status.bgColor} ${status.color} border text-[10px] gap-1 px-1.5 py-0.5`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-inter">{session.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{session.level}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Weekly Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border border-emerald-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">حضور هذا الأسبوع</p>
                    <p className="text-3xl font-bold text-emerald-600 font-inter">89%</p>
                    <p className="text-xs text-emerald-500 mt-1">معدل جيد</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Unregistered Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border border-amber-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">حصص لم يُسجّل الحضور</p>
                    <p className="text-3xl font-bold text-amber-600 font-inter">2</p>
                    <p className="text-xs text-amber-500 mt-1">تحتاج تسجيل</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl">
                    <ClipboardCheck className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card className="border border-edutrack-primary/20 hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">عدد طلابي</p>
                    <p className="text-3xl font-bold text-edutrack-primary font-inter">20</p>
                    <p className="text-xs text-edutrack-primary/70 mt-1">تلميذ مسجل</p>
                  </div>
                  <div className="bg-edutrack-primary/10 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-edutrack-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Weekly Attendance Chart */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              نسبة الحضور الأسبوعية
            </CardTitle>
            <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAttendanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    domain={[70, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="نسبة الحضور" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {weeklyAttendanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.rate >= 90 ? '#10B981' : entry.rate >= 85 ? '#F97316' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Absence Alerts */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              تنبيهات الغياب الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {recentAbsenceAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-50/50 transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-edutrack-dark leading-relaxed">
                        <span className="font-semibold">{alert.studentName}</span> غاب عن حصة {alert.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.date} · الساعة {alert.time}
                      </p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
