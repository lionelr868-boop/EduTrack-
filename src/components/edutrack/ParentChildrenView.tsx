'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  UsersRound,
  GraduationCap,
  ClipboardX,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Calendar,
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  User,
  PenLine,
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
  attendanceStatus: AttendanceStatusItem[];
  recentAbsences: MappedAbsence[];
  recentActivities: MappedActivity[];
  unpaidInvoices: MappedInvoice[];
  stats: {
    totalChildren: number;
    totalAbsences: number;
    unreadNotifications: number;
    unpaidInvoicesCount: number;
  };
}

// ─── Level Colors ──────────────────────────────────────────
const levelColors: Record<string, { bg: string; text: string; border: string; gradient: string; badge: string }> = {
  ابتدائي: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  متوسط: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    gradient: 'from-sky-500 to-sky-600',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  ثانوي: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    gradient: 'from-rose-500 to-rose-600',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

const defaultLevelStyle = {
  bg: 'bg-gray-50',
  text: 'text-gray-700',
  border: 'border-gray-200',
  gradient: 'from-gray-500 to-gray-600',
  badge: 'bg-gray-100 text-gray-700 border-gray-200',
};

// ─── Activity Type Config ──────────────────────────────────
const activityTypeIcons: Record<string, React.ReactNode> = {
  HOMEWORK: <BookOpen className="h-3.5 w-3.5" />,
  EXAM: <PenLine className="h-3.5 w-3.5" />,
  QUIZ: <ClipboardX className="h-3.5 w-3.5" />,
  PARTICIPATION: <Activity className="h-3.5 w-3.5" />,
  BEHAVIOR: <User className="h-3.5 w-3.5" />,
  NOTE: <BookOpen className="h-3.5 w-3.5" />,
};

const activityTypeColors: Record<string, string> = {
  HOMEWORK: 'bg-sky-50 text-sky-700 border-sky-200',
  EXAM: 'bg-rose-50 text-rose-700 border-rose-200',
  QUIZ: 'bg-violet-50 text-violet-700 border-violet-200',
  PARTICIPATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BEHAVIOR: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE: 'bg-gray-50 text-gray-700 border-gray-200',
};

// ─── Month Names ───────────────────────────────────────────
const monthNames: Record<number, string> = {
  1: 'جانفي',
  2: 'فيفري',
  3: 'مارس',
  4: 'أفريل',
  5: 'ماي',
  6: 'جوان',
  7: 'جويلية',
  8: 'أوت',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
};

// ─── Format Date Arabic ────────────────────────────────────
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

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const;

const cardExpandVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeInOut' as const },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
} as const;

// ─── Loading Skeleton ──────────────────────────────────────
function ChildrenSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={color}>{icon}</span>
          </div>
          <div>
            <p className={`text-2xl font-bold font-inter ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Child Card Component ──────────────────────────────────
function ChildCard({
  child,
  attendance,
  absences,
  activities,
  invoiceCount,
  isExpanded,
  onToggle,
  onViewSchedule,
  onViewAbsences,
  onViewGrades,
}: {
  child: ChildInfo;
  attendance: AttendanceStatusItem | undefined;
  absences: MappedAbsence[];
  activities: MappedActivity[];
  invoiceCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onViewSchedule: () => void;
  onViewAbsences: () => void;
  onViewGrades: () => void;
}) {
  const levelStyle = levelColors[child.level] || defaultLevelStyle;
  const initials = child.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  // Attendance calculations
  const totalSessions = attendance?.totalSessions || 0;
  const presentCount = attendance?.presentCount || 0;
  const absentCount = attendance?.absentCount || 0;
  const lateCount = attendance?.lateCount || 0;
  const attendanceRate =
    totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

  return (
    <motion.div variants={itemVariants} layout>
      <Card
        className={`border-0 shadow-md overflow-hidden transition-all duration-300 ${
          isExpanded ? 'shadow-lg ring-1 ring-edutrack-primary/20' : 'hover:shadow-lg'
        }`}
      >
        {/* Profile Header */}
        <div
          className="relative cursor-pointer"
          onClick={onToggle}
        >
          {/* Gradient background */}
          <div className={`bg-gradient-to-bl ${levelStyle.gradient} p-5`}>
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-28 h-28 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />

            <div className="flex items-center gap-4 relative z-10">
              <Avatar className="h-16 w-16 border-3 border-white/30 shadow-lg">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1.5 truncate">{child.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  {child.section && (
                    <>
                      <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 text-[11px] gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {child.section.year.name}
                      </Badge>
                      <Badge className="bg-white/15 text-white/90 border-0 hover:bg-white/25 text-[11px]">
                        {child.section.name}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Badge className={`${levelStyle.badge} text-[10px] font-bold px-2.5 py-0.5 border`}>
                  {child.level}
                </Badge>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-5 w-5 text-white/60" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row (always visible) */}
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Present */}
            <div className="text-center p-2 rounded-lg bg-emerald-50">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-emerald-700 font-inter">{presentCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium">حضور</p>
            </div>
            {/* Absent */}
            <div className="text-center p-2 rounded-lg bg-red-50">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              </div>
              <p className="text-lg font-bold text-red-700 font-inter">{absentCount}</p>
              <p className="text-[10px] text-red-600 font-medium">غياب</p>
            </div>
            {/* Late */}
            <div className="text-center p-2 rounded-lg bg-amber-50">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-amber-700 font-inter">{lateCount}</p>
              <p className="text-[10px] text-amber-600 font-medium">تأخير</p>
            </div>
          </div>

          {/* Attendance Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">نسبة الحضور</span>
              <span className={`text-xs font-bold font-inter ${
                attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {attendanceRate}%
              </span>
            </div>
            <Progress
              value={attendanceRate}
              className={`h-2 ${
                attendanceRate >= 80
                  ? '[&>div]:bg-emerald-500'
                  : attendanceRate >= 50
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-red-500'
              }`}
            />
          </div>

          {/* Unpaid invoices badge */}
          {invoiceCount > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-100">
              <Receipt className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-orange-700">
                {invoiceCount} فاتورة غير مدفوعة
              </span>
            </div>
          )}
        </CardContent>

        {/* Expanded Detail Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              variants={cardExpandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <Separator className="bg-gray-100" />

              {/* Recent Absences */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
                  <ClipboardX className="h-4 w-4 text-red-500" />
                  آخر الغيابات
                  {absences.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                      {absences.length}
                    </Badge>
                  )}
                </h4>
                {absences.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {absences.slice(0, 5).map((absence) => (
                      <div
                        key={absence.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-red-50/60 border border-red-100/50"
                      >
                        <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-edutrack-dark">
                            حصة <span className="font-semibold">{absence.subject}</span>
                          </p>
                          {absence.reason && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {absence.reason}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatDateArabic(absence.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-300 mx-auto mb-1" />
                    <p className="text-xs text-emerald-600 font-medium">لا توجد غيابات</p>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-100" />

              {/* Recent Activities / Grades */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-edutrack-primary" />
                  آخر الأنشطة والنقاط
                  {activities.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {activities.length}
                    </Badge>
                  )}
                </h4>
                {activities.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                            activityTypeColors[activity.type] || 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {activityTypeIcons[activity.type] || <Activity className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-edutrack-dark truncate">
                              {activity.title}
                            </p>
                            {activity.grade !== null && activity.maxGrade !== null && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-inter flex-shrink-0 px-1.5 py-0 h-5"
                              >
                                {activity.grade}/{activity.maxGrade}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">
                              {activity.teacherName}
                            </span>
                            <span className="text-muted-foreground/40 text-[8px]">•</span>
                            <span className="text-[10px] text-muted-foreground">
                              {activity.subject}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {formatDateArabic(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <Activity className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">لا توجد أنشطة بعد</p>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-100" />

              {/* Quick Links */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4 text-edutrack-primary" />
                  روابط سريعة
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 flex-col gap-1.5 border-dashed hover:bg-edutrack-primary/5 hover:border-edutrack-primary/40 hover:text-edutrack-primary transition-all"
                    onClick={onViewSchedule}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px] font-medium">الجدول</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 flex-col gap-1.5 border-dashed hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                    onClick={onViewAbsences}
                  >
                    <ClipboardX className="h-4 w-4" />
                    <span className="text-[10px] font-medium">الغيابات</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 flex-col gap-1.5 border-dashed hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-all"
                    onClick={onViewGrades}
                  >
                    <PenLine className="h-4 w-4" />
                    <span className="text-[10px] font-medium">النقاط</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function ParentChildrenView() {
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

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
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── Loading State ────────────────────────────────────────
  if (loading || !dashboardData) {
    return <ChildrenSkeleton />;
  }

  const { children, attendanceStatus, recentAbsences, recentActivities, unpaidInvoices, stats } = dashboardData;

  // Calculate summary stats
  const totalAbsences = attendanceStatus.reduce((sum, a) => sum + a.absentCount, 0);
  const totalPresent = attendanceStatus.reduce((sum, a) => sum + a.presentCount + a.lateCount, 0);
  const totalSessions = attendanceStatus.reduce((sum, a) => sum + a.totalSessions, 0);
  const averageAttendanceRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  // Helper to get data for a specific child
  const getChildAttendance = (childId: string) =>
    attendanceStatus.find((a) => a.studentId === childId);

  const getChildAbsences = (childName: string) =>
    recentAbsences.filter((a) => a.studentName === childName);

  const getChildActivities = (childName: string) =>
    recentActivities.filter((a) => a.studentName === childName);

  const getChildInvoiceCount = (childName: string) =>
    unpaidInvoices.filter((inv) => inv.studentName === childName).length;

  const toggleChildExpand = (childId: string) => {
    setExpandedChildId((prev) => (prev === childId ? null : childId));
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* ── Header ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-bl from-edutrack-primary to-edutrack-primary/85 flex items-center justify-center shadow-lg shadow-edutrack-primary/30">
          <UsersRound className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark">أبنائي</h1>
          <p className="text-sm text-muted-foreground">
            متابعة أداء وحضور الأبناء
          </p>
        </div>
      </motion.div>

      {/* ── Summary Stats ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<UsersRound className="h-5 w-5" />}
          label="إجمالي الأبناء"
          value={children.length}
          color="text-edutrack-primary"
          bgColor="bg-edutrack-primary/10"
        />
        <StatCard
          icon={<ClipboardX className="h-5 w-5" />}
          label="إجمالي الغيابات"
          value={totalAbsences}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="معدل الحضور"
          value={`${averageAttendanceRate}%`}
          color={averageAttendanceRate >= 80 ? 'text-emerald-600' : averageAttendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'}
          bgColor={averageAttendanceRate >= 80 ? 'bg-emerald-50' : averageAttendanceRate >= 50 ? 'bg-amber-50' : 'bg-red-50'}
        />
      </div>

      {/* ── Unpaid Invoices Summary ──────────────────────── */}
      {unpaidInvoices.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-gradient-to-l from-orange-50 to-orange-100/50 border-r-4 border-r-orange-400 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-orange-800">
                    {unpaidInvoices.length} فاتورة غير مدفوعة
                  </p>
                  <p className="text-xs text-orange-600/80 mt-0.5">
                    إجمالي المبلغ:{' '}
                    {unpaidInvoices
                      .reduce((sum, inv) => sum + inv.amount, 0)
                      .toLocaleString('ar-DZ')}{' '}
                    د.ج
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unpaidInvoices.slice(0, 3).map((inv) => (
                      <Badge
                        key={inv.id}
                        variant="outline"
                        className="text-[10px] border-orange-200 text-orange-700 bg-orange-50/50"
                      >
                        {inv.studentName} - {monthNames[inv.month]} {inv.year}
                      </Badge>
                    ))}
                    {unpaidInvoices.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-orange-200 text-orange-600"
                      >
                        +{unpaidInvoices.length - 3} أخرى
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-700 hover:bg-orange-100 text-xs gap-1"
                  onClick={() => setCurrentView('parent-invoices')}
                >
                  عرض الكل
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Children Cards Grid ──────────────────────────── */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              attendance={getChildAttendance(child.id)}
              absences={getChildAbsences(child.name)}
              activities={getChildActivities(child.name)}
              invoiceCount={getChildInvoiceCount(child.name)}
              isExpanded={expandedChildId === child.id}
              onToggle={() => toggleChildExpand(child.id)}
              onViewSchedule={() => setCurrentView('parent-schedule')}
              onViewAbsences={() => setCurrentView('parent-absences')}
              onViewGrades={() => setCurrentView('parent-grades')}
            />
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <UsersRound className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-lg font-semibold text-muted-foreground mb-1">
                لا يوجد أبناء مسجلين
              </p>
              <p className="text-sm text-muted-foreground/60">
                لم يتم تسجيل أي أبناء بعد في حسابك
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
