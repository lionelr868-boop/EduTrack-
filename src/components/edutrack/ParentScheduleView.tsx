'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  GraduationCap,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface ChildInfo {
  id: string;
  name: string;
  level: string;
  section: {
    id: string;
    name: string;
    year: { name: string; level: string };
  } | null;
  enrollmentDate: string;
}

interface TimetableSession {
  sessionId: string;
  subject: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  studentName: string;
}

interface TimetableDay {
  dayOfWeek: number;
  dayName: string;
  sessions: TimetableSession[];
}

interface TodayScheduleItem {
  studentId: string;
  studentName: string;
  subject: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  sessionId: string;
}

interface AttendanceStatusItem {
  studentId: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

interface ScheduleData {
  children: ChildInfo[];
  weeklyTimetable: TimetableDay[];
  todaySchedule: TodayScheduleItem[];
  attendanceStatus: AttendanceStatusItem[];
}

// ─── Subject Color Palette ─────────────────────────────────
const subjectColorPalette = [
  'bg-edutrack-primary/15 text-edutrack-primary border-edutrack-primary/20',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

function getSubjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return subjectColorPalette[Math.abs(hash) % subjectColorPalette.length];
}

// ─── School Days ───────────────────────────────────────────
const schoolDays = [
  { value: 0, label: 'أحد' },
  { value: 1, label: 'اثنين' },
  { value: 2, label: 'ثلاثاء' },
  { value: 3, label: 'أربعاء' },
  { value: 4, label: 'خميس' },
];

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const;

// ─── Loading Skeleton ──────────────────────────────────────
function ScheduleSkeleton() {
  return (
    <div className="px-4 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {/* Day tabs */}
      <Skeleton className="h-12 rounded-xl" />
      {/* Session cards */}
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function ParentScheduleView() {
  const user = useAppStore((s) => s.user);

  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  // ─── Fetch Schedule Data ─────────────────────────────────
  const fetchScheduleData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/parent/dashboard?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json();
      setScheduleData({
        children: data.children || [],
        weeklyTimetable: data.weeklyTimetable || [],
        todaySchedule: data.todaySchedule || [],
        attendanceStatus: data.attendanceStatus || [],
      });
    } catch (err) {
      console.error('Error fetching parent schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // ─── Loading State ───────────────────────────────────────
  if (loading || !scheduleData) {
    return <ScheduleSkeleton />;
  }

  const { children, weeklyTimetable, todaySchedule, attendanceStatus } = scheduleData;

  // Currently selected child
  const currentChild = children[selectedChildIndex] || children[0];

  // Filter timetable by selected child
  const currentChildTimetable = weeklyTimetable.map((day) => ({
    ...day,
    sessions: day.sessions.filter((s) => s.studentName === currentChild?.name),
  })).filter((day) => day.sessions.length > 0);

  // Current child today schedule
  const currentChildTodaySchedule = todaySchedule.filter(
    (s) => s.studentId === currentChild?.id
  );

  // Current child attendance for today
  const currentChildAttendance = attendanceStatus.find(
    (a) => a.studentId === currentChild?.id
  );

  // Selected day sessions
  const selectedDaySessions = currentChildTimetable.find(
    (d) => d.dayOfWeek === selectedDay
  )?.sessions || [];

  // Stats calculations
  const totalWeeklySessions = currentChildTimetable.reduce(
    (sum, day) => sum + day.sessions.length, 0
  );
  const todaySessionsCount = currentChildTodaySchedule.length;
  const todayDayOfWeek = new Date().getDay();

  // Determine attendance status for a session
  const getSessionAttendanceStatus = (
    sessionId: string
  ): 'present' | 'absent' | 'late' | 'pending' => {
    if (!currentChildAttendance || currentChildAttendance.totalSessions === 0) {
      return 'pending';
    }
    // We don't have per-session attendance from the API, so we use the aggregate
    if (currentChildAttendance.absentCount > 0) return 'absent';
    if (currentChildAttendance.lateCount > 0) return 'late';
    if (currentChildAttendance.presentCount === currentChildAttendance.totalSessions) return 'present';
    return 'pending';
  };

  // Attendance status config
  const attendanceStatusConfig = {
    present: {
      label: 'حضر',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      dotColor: 'bg-emerald-500',
    },
    absent: {
      label: 'غاب',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      dotColor: 'bg-red-500',
    },
    late: {
      label: 'متأخر',
      icon: <Clock className="h-4 w-4 text-amber-500" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      dotColor: 'bg-amber-500',
    },
    pending: {
      label: 'لم يبدأ',
      icon: <Clock className="h-4 w-4 text-gray-400" />,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      dotColor: 'bg-gray-400',
    },
  };

  // Determine if a session is currently active
  const isSessionActive = (startTime: string, endTime: string): boolean => {
    if (new Date().getDay() !== todayDayOfWeek) return false;
    const now = new Date();
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const current = now.getHours() * 60 + now.getMinutes();
    return current >= start && current <= end;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 pb-6"
      dir="rtl"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <h1 className="text-xl font-bold text-edutrack-dark flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-edutrack-primary" />
          </div>
          الجدول الأسبوعي
        </h1>
        {currentChild && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            {currentChild.name}
            {currentChild.section && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {currentChild.section.year.name} - {currentChild.section.name}
                </span>
              </>
            )}
          </p>
        )}
      </motion.div>

      {/* ── Child Selector ──────────────────────────────── */}
      {children.length > 1 && (
        <motion.div variants={itemVariants} className="mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1">
              {children.map((child, index) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildIndex(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    index === selectedChildIndex
                      ? 'bg-edutrack-primary text-white shadow-md shadow-edutrack-primary/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  {child.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {/* ── Stats Row ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm bg-edutrack-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-edutrack-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-edutrack-primary font-inter">
                  {totalWeeklySessions}
                </p>
                <p className="text-[11px] text-edutrack-primary/70 font-medium">
                  حصة هذا الأسبوع
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-edutrack-secondary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-edutrack-secondary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-edutrack-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-edutrack-secondary font-inter">
                  {todaySessionsCount}
                </p>
                <p className="text-[11px] text-edutrack-secondary/70 font-medium">
                  حصة اليوم
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Today's Sessions (Prominent) ────────────────── */}
      {currentChildTodaySchedule.length > 0 && (
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-edutrack-primary" />
            حصص اليوم
            <Badge className="bg-edutrack-primary/10 text-edutrack-primary border-0 text-[10px] px-1.5 py-0">
              {currentChildTodaySchedule.length}
            </Badge>
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {currentChildTodaySchedule.map((session, index) => {
                const colorClass = getSubjectColor(session.subject);
                const isActive = isSessionActive(session.startTime, session.endTime);
                const attendance = getSessionAttendanceStatus(session.sessionId);

                return (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className={`border-0 shadow-sm overflow-hidden ${
                      isActive ? 'ring-2 ring-edutrack-primary/40 shadow-md' : ''
                    }`}>
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          {/* Time Column */}
                          <div className={`flex flex-col items-center justify-center min-w-[62px] p-3 border-l ${colorClass} bg-opacity-50`}>
                            <span className="text-xs font-bold font-inter">{session.startTime}</span>
                            <span className="text-[9px] opacity-60 font-inter">{session.endTime}</span>
                          </div>
                          {/* Content */}
                          <div className="flex-1 p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-edutrack-dark truncate">
                                  {session.subject}
                                </p>
                                {isActive && (
                                  <span className="flex items-center gap-1 text-[9px] font-medium text-edutrack-primary bg-edutrack-primary/10 px-1.5 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 rounded-full bg-edutrack-primary animate-pulse" />
                                    الآن
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{session.teacherName}</span>
                              </div>
                            </div>
                            {/* Attendance Badge */}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${attendanceStatusConfig[attendance].bgColor}`}>
                              {attendanceStatusConfig[attendance].icon}
                              <span className={`text-[10px] font-medium ${attendanceStatusConfig[attendance].color}`}>
                                {attendanceStatusConfig[attendance].label}
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
        </motion.div>
      )}

      {/* ── Weekly Day Tabs ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {/* Day Tab Selector */}
            <div className="flex overflow-x-auto border-b border-gray-100">
              {schoolDays.map((day) => {
                const dayData = currentChildTimetable.find((d) => d.dayOfWeek === day.value);
                const isActive = selectedDay === day.value;
                const isToday = todayDayOfWeek === day.value;
                const sessionCount = dayData?.sessions.length || 0;

                return (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDay(day.value)}
                    className={`flex-1 min-w-[60px] py-3 px-2 text-center transition-all duration-200 relative whitespace-nowrap ${
                      isActive
                        ? 'text-edutrack-primary font-bold'
                        : 'text-muted-foreground hover:text-edutrack-dark'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs">{day.label}</span>
                      {sessionCount > 0 && (
                        <span className={`text-[9px] ${isActive ? 'text-edutrack-primary' : 'text-muted-foreground/60'}`}>
                          {sessionCount} حصة
                        </span>
                      )}
                    </div>
                    {/* Today dot indicator */}
                    {isToday && (
                      <span className="absolute top-1.5 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-edutrack-secondary" />
                    )}
                    {/* Active underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeScheduleDay"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-edutrack-primary rounded-t-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Session List for Selected Day */}
            <div className="p-3">
              <AnimatePresence mode="wait">
                {selectedDaySessions.length > 0 ? (
                  <motion.div
                    key={`day-${selectedDay}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    {selectedDaySessions.map((session, index) => {
                      const colorClass = getSubjectColor(session.subject);
                      const isToday = selectedDay === todayDayOfWeek;
                      const isActive = isToday && isSessionActive(session.startTime, session.endTime);
                      const attendance = isToday ? getSessionAttendanceStatus(session.sessionId) : null;

                      return (
                        <motion.div
                          key={session.sessionId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${colorClass} ${
                            isActive ? 'ring-2 ring-edutrack-primary/30 shadow-md' : 'shadow-sm'
                          } transition-all duration-200`}
                        >
                          {/* Time */}
                          <div className="flex flex-col items-center min-w-[50px]">
                            <span className="text-[11px] font-bold font-inter">{session.startTime}</span>
                            <span className="text-[9px] opacity-60 font-inter">{session.endTime}</span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-8 bg-current opacity-20" />

                          {/* Subject & Teacher */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">{session.subject}</p>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[9px] font-medium text-edutrack-primary bg-edutrack-primary/10 px-1.5 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-edutrack-primary animate-pulse" />
                                  الآن
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] opacity-70 flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3" />
                              {session.teacherName}
                            </p>
                          </div>

                          {/* Attendance Badge (only for today) */}
                          {attendance && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${attendanceStatusConfig[attendance].bgColor}`}>
                              {attendanceStatusConfig[attendance].icon}
                              <span className={`text-[10px] font-medium ${attendanceStatusConfig[attendance].color}`}>
                                {attendanceStatusConfig[attendance].label}
                              </span>
                            </div>
                          )}

                          {/* Book Icon */}
                          {!attendance && (
                            <BookOpen className="h-4 w-4 opacity-40 flex-shrink-0" />
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`empty-${selectedDay}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-10 text-center"
                  >
                    <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">لا توجد حصص في هذا اليوم</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      اختر يوماً آخر لعرض الحصص
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Attendance Summary ──────────────────────────── */}
      {currentChildAttendance && currentChildAttendance.totalSessions > 0 && (
        <motion.div variants={itemVariants} className="mb-4">
          <Card className="border-0 shadow-sm bg-gradient-to-bl from-edutrack-primary/5 to-edutrack-primary/[0.02]">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-edutrack-primary" />
                ملخص حضور اليوم
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-700 font-inter">
                    {currentChildAttendance.presentCount}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium">حاضر</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-50">
                  <p className="text-lg font-bold text-red-700 font-inter">
                    {currentChildAttendance.absentCount}
                  </p>
                  <p className="text-[10px] text-red-600 font-medium">غائب</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50">
                  <p className="text-lg font-bold text-amber-700 font-inter">
                    {currentChildAttendance.lateCount}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">متأخر</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Empty State (No Children) ───────────────────── */}
      {children.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="py-16 text-center"
        >
          <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-edutrack-dark">لا يوجد أبناء مسجّلين</p>
          <p className="text-sm text-muted-foreground mt-1">
            لم يتم ربط أي تلميذ بحسابك بعد
          </p>
        </motion.div>
      )}

      {/* ── Empty State (No Sessions at All) ────────────── */}
      {children.length > 0 && currentChildTimetable.length === 0 && currentChildTodaySchedule.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="py-12 text-center"
        >
          <Calendar className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-base font-semibold text-edutrack-dark">لا يوجد جدول دراسي</p>
          <p className="text-sm text-muted-foreground mt-1">
            لم يتم إضافة حصص لهذا التلميذ بعد
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
