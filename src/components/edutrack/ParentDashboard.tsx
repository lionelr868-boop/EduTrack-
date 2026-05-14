'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
  BookOpen,
  FileText,
  PenLine,
  ClipboardCheck,
  Activity,
  Eye,
  Users,
  User,
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

interface TodayScheduleItem {
  studentId: string;
  studentName: string;
  subject: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  sessionId: string;
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

interface AttendanceStatusItem {
  studentId: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

interface MappedAbsence {
  id: string;
  studentName: string;
  subject: string;
  reason: string | null;
  date: string;
  notificationSent: boolean;
}

interface MappedActivity {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  description: string | null;
  grade: number | null;
  maxGrade: number | null;
  date: string;
  studentName: string;
  teacherName: string;
  subject: string;
}

interface MappedNotification {
  id: string;
  title: string | null;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface MappedInvoice {
  id: string;
  studentName: string;
  amount: number;
  month: number;
  year: number;
  status: string;
}

interface DashboardData {
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  children: ChildInfo[];
  todaySchedule: TodayScheduleItem[];
  weeklyTimetable: TimetableDay[];
  attendanceStatus: AttendanceStatusItem[];
  recentAbsences: MappedAbsence[];
  recentActivities: MappedActivity[];
  latestNotifications: MappedNotification[];
  unpaidInvoices: MappedInvoice[];
  stats: {
    totalChildren: number;
    totalAbsences: number;
    unreadNotifications: number;
    unpaidInvoicesCount: number;
  };
}

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
  { label: 'الإشعارات', icon: <Bell className="h-7 w-7" />, view: 'parent-notifications', color: 'text-edutrack-secondary', bgColor: 'bg-orange-50' },
];

// ─── Activity Type Config ───────────────────────────────────
const activityTypeIcons: Record<string, React.ReactNode> = {
  HOMEWORK: <FileText className="h-4 w-4" />,
  EXAM: <PenLine className="h-4 w-4" />,
  QUIZ: <ClipboardCheck className="h-4 w-4" />,
  PARTICIPATION: <Activity className="h-4 w-4" />,
  BEHAVIOR: <Eye className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
};

const activityTypeColors: Record<string, string> = {
  HOMEWORK: 'bg-sky-50 text-sky-700 border-sky-200',
  EXAM: 'bg-rose-50 text-rose-700 border-rose-200',
  QUIZ: 'bg-violet-50 text-violet-700 border-violet-200',
  PARTICIPATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BEHAVIOR: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE: 'bg-gray-50 text-gray-700 border-gray-200',
};

// ─── Subject Colors ─────────────────────────────────────────
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

// ─── Animation Variants ─────────────────────────────────────
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

// ─── Level Labels ───────────────────────────────────────────
const levelLabels: Record<string, string> = {
  ابتدائي: 'ابتدائي',
  متوسط: 'متوسط',
  ثانوي: 'ثانوي',
};

const levelColors: Record<string, string> = {
  ابتدائي: 'bg-emerald-100 text-emerald-700',
  متوسط: 'bg-sky-100 text-sky-700',
  ثانوي: 'bg-rose-100 text-rose-700',
};

// ─── Notification Type Icons ────────────────────────────────
function getNotificationIcon(type: string) {
  switch (type) {
    case 'ABSENCE':
      return <ClipboardX className="h-5 w-5 text-red-500" />;
    case 'INVOICE':
      return <Receipt className="h-5 w-5 text-orange-500" />;
    case 'ACTIVITY':
      return <Activity className="h-5 w-5 text-edutrack-primary" />;
    case 'CANCELLATION':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-edutrack-secondary" />;
  }
}

function getNotificationBgColor(type: string) {
  switch (type) {
    case 'ABSENCE':
      return 'bg-red-50';
    case 'INVOICE':
      return 'bg-orange-50';
    case 'ACTIVITY':
      return 'bg-edutrack-primary/5';
    case 'CANCELLATION':
      return 'bg-red-50';
    default:
      return 'bg-orange-50';
  }
}

// ─── Format Date Arabic ─────────────────────────────────────
function formatDateArabic(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return date.toLocaleDateString('ar-DZ', {
    month: 'short',
    day: 'numeric',
  });
}

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

// ─── Loading Skeleton ───────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="pb-24 px-4 space-y-5" dir="rtl">
      {/* Welcome */}
      <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Child Card */}
      <Skeleton className="h-28 rounded-xl" />
      {/* Today Status */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
      {/* Timetable */}
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      {/* Activities */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
      {/* Quick Actions */}
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function ParentDashboard() {
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [timetableDay, setTimetableDay] = useState(new Date().getDay());

  // ─── Fetch Dashboard Data ─────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/parent/dashboard?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── Today Date ───────────────────────────────────────────
  const todayDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ─── Loading State ────────────────────────────────────────
  if (loading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  const { parent, children, todaySchedule, weeklyTimetable, attendanceStatus, recentAbsences, recentActivities, latestNotifications, unpaidInvoices, stats } = dashboardData;

  // Currently selected child
  const currentChild = children[selectedChildIndex] || children[0];
  const currentChildAttendance = attendanceStatus.find((a) => a.studentId === currentChild?.id);

  // Current child timetable
  const currentChildTimetable = weeklyTimetable.map((day) => ({
    ...day,
    sessions: day.sessions.filter((s) => s.studentName === currentChild?.name),
  })).filter((day) => day.sessions.length > 0);

  // Current child today schedule
  const currentChildTodaySchedule = todaySchedule.filter((s) => s.studentId === currentChild?.id);
  const hasSessionsToday = currentChildTodaySchedule.length > 0;

  // Current child absences
  const currentChildAbsences = recentAbsences.filter((a) => a.studentName === currentChild?.name);

  // Current child activities
  const currentChildActivities = recentActivities.filter((a) => a.studentName === currentChild?.name);

  // Latest notification
  const latestNotif = latestNotifications[0] || null;

  // Build attendance display text
  const getAttendanceText = () => {
    if (!currentChildAttendance) return 'لا توجد بيانات';
    const { totalSessions, presentCount, absentCount, lateCount } = currentChildAttendance;
    if (totalSessions === 0) return 'لا توجد حصص اليوم';
    const attended = presentCount + lateCount;
    if (attended === totalSessions) return `حضر جميع الحصص (${totalSessions}/${totalSessions})`;
    if (attended === 0 && absentCount === 0) return 'لم يُسجّل بعد';
    return `حضر ${attended} من ${totalSessions}`;
  };

  const isFullyPresent = currentChildAttendance
    ? currentChildAttendance.totalSessions > 0 &&
      currentChildAttendance.presentCount + currentChildAttendance.lateCount === currentChildAttendance.totalSessions
    : false;

  const hasAnyAbsence = currentChildAttendance
    ? currentChildAttendance.absentCount > 0
    : false;

  // Day tabs for timetable
  const schoolDays = [
    { value: 0, label: 'أحد' },
    { value: 1, label: 'اثنين' },
    { value: 2, label: 'ثلاثاء' },
    { value: 3, label: 'أربعاء' },
    { value: 4, label: 'خميس' },
  ];

  const selectedDaySessions = currentChildTimetable.find((d) => d.dayOfWeek === timetableDay)?.sessions || [];

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-24 px-4"
        dir="rtl"
      >
        {/* ── Welcome Section ─────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <h1 className="text-xl font-bold text-edutrack-dark">
            مرحباً، {parent.name?.split(' ')[0] || 'ولي الأمر'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {todayDate}
          </p>
        </motion.div>

        {/* ── Child Selector (if multiple children) ──────── */}
        {children.length > 1 && (
          <motion.div variants={itemVariants} className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
          </motion.div>
        )}

        {/* ── Child Card ─────────────────────────────────── */}
        {currentChild && (
          <motion.div variants={itemVariants} className="mb-5">
            <Card className="border-0 shadow-lg shadow-edutrack-primary/10 bg-gradient-to-bl from-edutrack-primary to-edutrack-primary/85 overflow-hidden relative">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-3 border-white/30 shadow-lg">
                    <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">
                      {currentChild.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white mb-1 truncate">
                      {currentChild.name}
                    </h2>
                    {currentChild.section && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-xs gap-1">
                          <GraduationCap className="h-3.5 w-3.5" />
                          {currentChild.section.year.name}
                        </Badge>
                        <Badge className="bg-white/15 text-white/90 border-0 hover:bg-white/25 text-xs">
                          {currentChild.section.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {currentChild.level && (
                      <Badge className={`${levelColors[currentChild.level] || 'bg-gray-100 text-gray-700'} text-[10px] font-bold px-2 py-0.5 border-0`}>
                        {levelLabels[currentChild.level] || currentChild.level}
                      </Badge>
                    )}
                    <ChevronLeft className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Today's Status ─────────────────────────────── */}
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
                  {hasSessionsToday ? `نعم (${currentChildTodaySchedule.length})` : 'لا'}
                </p>
              </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card className={`border-0 shadow-sm ${
              hasAnyAbsence ? 'bg-red-50' : isFullyPresent ? 'bg-emerald-50' : 'bg-amber-50'
            }`}>
              <CardContent className="p-4 text-center">
                <div className={`h-11 w-11 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                  hasAnyAbsence ? 'bg-red-100' : isFullyPresent ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {hasAnyAbsence ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : isFullyPresent ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">الحضور</p>
                <p className={`text-sm font-bold ${
                  hasAnyAbsence ? 'text-red-700' : isFullyPresent ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {getAttendanceText()}
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Child's Timetable ──────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-edutrack-primary" />
            الجدول الأسبوعي
          </h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {/* Day Tabs */}
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {schoolDays.map((day) => {
                  const dayData = currentChildTimetable.find((d) => d.dayOfWeek === day.value);
                  const isActive = timetableDay === day.value;
                  const isToday = new Date().getDay() === day.value;
                  return (
                    <button
                      key={day.value}
                      onClick={() => setTimetableDay(day.value)}
                      className={`flex-1 min-w-[56px] py-2.5 px-2 text-center text-xs font-medium transition-all duration-200 relative whitespace-nowrap ${
                        isActive
                          ? 'text-edutrack-primary font-bold'
                          : 'text-muted-foreground hover:text-edutrack-dark'
                      }`}
                    >
                      {day.label}
                      {dayData && dayData.sessions.length > 0 && (
                        <span className={`block text-[9px] mt-0.5 ${isActive ? 'text-edutrack-primary' : 'text-muted-foreground/60'}`}>
                          {dayData.sessions.length} حصة
                        </span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeDay"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-edutrack-primary rounded-t-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      {isToday && (
                        <span className="absolute top-1.5 right-1/2 translate-x-1/2 w-1 h-1 rounded-full bg-edutrack-secondary" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sessions for selected day */}
              <div className="p-3">
                {selectedDaySessions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDaySessions.map((session, index) => (
                      <motion.div
                        key={session.sessionId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.05 }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border ${getSubjectColor(session.subject)}`}
                      >
                        <div className="flex flex-col items-center min-w-[48px]">
                          <span className="text-[10px] font-medium opacity-70">{session.startTime}</span>
                          <span className="text-[9px] opacity-50">{session.endTime}</span>
                        </div>
                        <div className="w-px h-8 bg-current opacity-20" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{session.subject}</p>
                          <p className="text-[11px] opacity-70 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.teacherName}
                          </p>
                        </div>
                        <BookOpen className="h-4 w-4 opacity-40 flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">لا توجد حصص في هذا اليوم</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Recent Activities ──────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-edutrack-primary" />
            آخر الأنشطة
            {currentChildActivities.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {currentChildActivities.length}
              </Badge>
            )}
          </h2>
          {currentChildActivities.length > 0 ? (
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {currentChildActivities.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Type Icon */}
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activityTypeColors[activity.type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                            {activityTypeIcons[activity.type] || <FileText className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-edutrack-dark truncate">
                                {activity.title}
                              </p>
                              {activity.grade !== null && activity.maxGrade !== null && (
                                <Badge variant="outline" className="text-[10px] font-inter flex-shrink-0 px-1.5 py-0">
                                  {activity.grade}/{activity.maxGrade}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                {activity.teacherName}
                              </span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-[11px] text-muted-foreground">
                                {activity.subject}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {formatDateArabic(activity.date)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">لا توجد أنشطة بعد</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ── Recent Absences ────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <h2 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
            <ClipboardX className="h-4 w-4 text-red-500" />
            سجل الغياب
            {currentChildAbsences.length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {currentChildAbsences.length}
              </Badge>
            )}
          </h2>
          {currentChildAbsences.length > 0 ? (
            <ScrollArea className="max-h-52">
              <div className="space-y-1.5">
                {currentChildAbsences.slice(0, 5).map((absence, index) => (
                  <motion.div
                    key={absence.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50/50 border border-red-100/60"
                  >
                    <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-edutrack-dark">
                        غاب عن حصة <span className="font-semibold">{absence.subject}</span>
                      </p>
                      {absence.reason && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{absence.reason}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDateArabic(absence.date)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-xs text-emerald-600 font-medium">لا توجد غيابات مسجّلة</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* ── Latest Notification ────────────────────────── */}
        {latestNotif && (
          <motion.div variants={itemVariants} className="mb-5">
            <h2 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-edutrack-secondary" />
              آخر إشعار
              {!latestNotif.read && (
                <span className="h-2 w-2 rounded-full bg-edutrack-secondary animate-pulse" />
              )}
            </h2>
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationBgColor(latestNotif.type)}`}>
                    {getNotificationIcon(latestNotif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {latestNotif.title && (
                      <p className="text-xs font-bold text-edutrack-dark mb-0.5">{latestNotif.title}</p>
                    )}
                    <p className="text-sm text-edutrack-dark/80 leading-relaxed line-clamp-2">{latestNotif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDateArabic(latestNotif.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Quick Actions ──────────────────────────────── */}
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
                  <CardContent className="p-4 flex flex-col items-center gap-2.5">
                    <div className={`h-12 w-12 rounded-2xl ${action.bgColor} flex items-center justify-center`}>
                      <span className={action.color}>{action.icon}</span>
                    </div>
                    <p className="text-xs font-semibold text-edutrack-dark text-center">{action.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Unpaid Invoices Alert ──────────────────────── */}
        {unpaidInvoices.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="mt-5"
          >
            <Card className="border-0 shadow-sm bg-orange-50 border-r-4 border-r-orange-400">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Receipt className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800">
                      {unpaidInvoices.length} فاتورة غير مدفوعة
                    </p>
                    <p className="text-[11px] text-orange-600/70">
                      إجمالي المبلغ: {unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('ar-DZ')} د.ج
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-700 text-xs"
                    onClick={() => setCurrentView('parent-invoices')}
                  >
                    عرض
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Stats Summary ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="mt-5">
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <p className="text-lg font-bold text-emerald-700 font-inter">{stats.totalChildren}</p>
              <p className="text-[9px] text-emerald-600 font-medium">أبناء</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50">
              <p className="text-lg font-bold text-red-700 font-inter">{stats.totalAbsences}</p>
              <p className="text-[9px] text-red-600 font-medium">غيابات</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-50">
              <p className="text-lg font-bold text-orange-700 font-inter">{stats.unpaidInvoicesCount}</p>
              <p className="text-[9px] text-orange-600 font-medium">فواتير</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-edutrack-primary/5">
              <p className="text-lg font-bold text-edutrack-primary font-inter">{stats.unreadNotifications}</p>
              <p className="text-[9px] text-edutrack-primary/70 font-medium">إشعارات</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
