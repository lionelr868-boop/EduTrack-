'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  CheckCircle,
  Banknote,
  AlertTriangle,
  Clock,
  TrendingUp,
  BookOpen,
  Receipt,
  X,
  ArrowUpLeft,
  ArrowDownLeft,
  GraduationCap,
  AlertCircle,
  Layers,
  Loader2,
  RefreshCw,
  School,
  CalendarDays,
  Bell,
  BellRing,
  Phone,
  BookMarked,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

// ─── API Response Types ──────────────────────────────────────────────────────
interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalSections: number;
  totalYears: number;
  attendanceRate: number;
  monthlyRevenue: number;
  revenue: number;
  unexcusedAbsences: number;
  todaySessionsCount: number;
  totalSessions: number;
  studentAbsences: number;
  teacherAbsences: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenueTrend: Array<{ month: string; revenue: number; paidInvoices: number }>;
  attendanceTrend: Array<{ day: string; rate: number }>;
  studentsByLevel: Array<{ level: string; count: number; color: string }>;
  sectionsByLevel: Array<{ level: string; count: number }>;
  yearsHierarchy: Array<{
    id: string;
    name: string;
    level: string;
    order: number;
    sections: Array<{
      id: string;
      name: string;
      studentCount: number;
      supervisorName: string | null;
      capacity: number;
    }>;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    subjectName: string;
    level: string;
    phone: string | null;
    supervisedSections: Array<{ id: string; name: string; yearName: string }>;
  }>;
  absenceDistribution: { student: number; teacher: number };
  recentActivities: Array<{
    id: string;
    text: string;
    time: string;
    color: string;
    type: string;
  }>;
  notifications: {
    unreadCount: number;
    latest: Array<{
      id: string;
      title: string | null;
      message: string;
      type: string;
      read: boolean;
      createdAt: string;
    }>;
  };
}

// ─── Animated Counter Hook ───────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const targetRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    targetRef.current = target;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (target === 0) {
      return;
    }

    let start = 0;
    const increment = target / (duration / 16);
    timerRef.current = setInterval(() => {
      start += increment;
      if (start >= targetRef.current) {
        setCount(targetRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [target, duration]);

  // When target is 0, return 0 directly without relying on effect-set state
  return target === 0 ? 0 : count;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 text-right"
      dir="rtl"
    >
      <p className="text-xs font-semibold text-edutrack-dark mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full ml-1"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{' '}
          <span className="font-semibold text-edutrack-dark font-inter">
            {typeof p.value === 'number' && p.value > 1000
              ? p.value.toLocaleString('ar-DZ')
              : p.value}
          </span>
          {p.value > 1000 && (
            <span className="text-muted-foreground mr-1">دج</span>
          )}
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  rawValue: number;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  index: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

function StatCardComponent({
  title,
  rawValue,
  trend,
  trendUp,
  icon,
  color,
  bgColor,
  borderColor,
  gradientFrom,
  gradientTo,
  index,
  isCurrency,
  isPercentage,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(rawValue, 1200 + index * 150);

  const formatValue = () => {
    if (isCurrency) return animatedValue.toLocaleString('ar-DZ');
    if (isPercentage) return `${animatedValue}%`;
    return animatedValue.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Card
        className={`relative overflow-hidden border ${borderColor} hover:shadow-lg transition-all duration-300 group cursor-pointer`}
      >
        <div
          className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-l ${gradientFrom} ${gradientTo}`}
        />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className={`text-2xl lg:text-3xl font-bold ${color} font-inter`}>
                {formatValue()}
                {isCurrency && <span className="text-base mr-1">دج</span>}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {trendUp ? (
                  <ArrowUpLeft className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trend}
                </span>
              </div>
            </div>
            <div
              className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
            >
              <span className={color}>{icon}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-[120px] rounded-xl border border-gray-200 bg-white animate-pulse"
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[320px] rounded-xl border border-gray-200 bg-white animate-pulse">
      <div className="p-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-3 w-20 bg-gray-100 rounded mb-4" />
        <div className="h-56 w-full bg-gray-50 rounded" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white animate-pulse p-6">
      <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <div className="h-8 w-8 bg-gray-100 rounded-full" />
            <div className="flex-1">
              <div className="h-3 w-32 bg-gray-100 rounded mb-1" />
              <div className="h-2 w-24 bg-gray-50 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white animate-pulse p-4">
      <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="h-2 w-2 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-3 w-64 bg-gray-100 rounded mb-1" />
            <div className="h-2 w-16 bg-gray-50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Alert Banner ────────────────────────────────────────────────────────────
function AlertBanner({
  message,
  variant,
  onDismiss,
}: {
  message: string;
  variant: 'warning' | 'danger';
  onDismiss: () => void;
}) {
  const bgColor =
    variant === 'warning'
      ? 'bg-orange-50 border-orange-200'
      : 'bg-red-50 border-red-200';
  const textColor =
    variant === 'warning' ? 'text-orange-800' : 'text-red-800';
  const iconColor =
    variant === 'warning' ? 'text-orange-500' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor}`}
    >
      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${textColor}`}>{message}</p>
      <button
        onClick={onDismiss}
        className={`${iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Activity Color Helpers ──────────────────────────────────────────────────
function getActivityDotColor(color: string) {
  const dotMap: Record<string, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
  };
  return dotMap[color] || 'bg-gray-500';
}

function getActivityTextColor(color: string) {
  const map: Record<string, string> = {
    red: 'text-red-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
    purple: 'text-purple-600',
  };
  return map[color] || 'text-gray-600';
}

// ─── Notification Type Icon ──────────────────────────────────────────────────
function getNotificationIcon(type: string) {
  const map: Record<string, React.ReactNode> = {
    absence: <AlertTriangle className="h-4 w-4 text-red-500" />,
    payment: <Banknote className="h-4 w-4 text-green-500" />,
    activity: <BookMarked className="h-4 w-4 text-edutrack-primary" />,
    general: <Bell className="h-4 w-4 text-gray-500" />,
    alert: <AlertCircle className="h-4 w-4 text-orange-500" />,
  };
  return map[type] || <Bell className="h-4 w-4 text-gray-500" />;
}

// ─── Level Badge Helper ──────────────────────────────────────────────────────
function getLevelBadge(level: string) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    'ابتدائي': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    'متوسط': {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    'ثانوي': {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
    },
  };
  const c = config[level] || {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };
  return (
    <Badge
      variant="outline"
      className={`${c.bg} ${c.text} ${c.border} text-xs font-semibold px-2 py-0.5`}
    >
      {level}
    </Badge>
  );
}

function getLevelColor(level: string) {
  const map: Record<string, string> = {
    'ابتدائي': 'emerald',
    'متوسط': 'amber',
    'ثانوي': 'violet',
  };
  return map[level] || 'gray';
}

// ─── Main Director Dashboard ─────────────────────────────────────────────────
export default function DirectorDashboard() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  // Single data state
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alert states
  const [showWarningAlert, setShowWarningAlert] = useState(true);
  const [showDangerAlert, setShowDangerAlert] = useState(true);

  // ─── Fetch all data from consolidated API ──────────────────────────────
  const fetchData = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/dashboard/stats?institutionId=${institutionId}${user?.id ? `&userId=${user.id}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('تعذر تحميل بيانات لوحة القيادة');
    } finally {
      setLoading(false);
    }
  }, [institutionId, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Format today's date in Arabic ─────────────────────────────────────
  const todayFormatted = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ─── Stats cards configuration ─────────────────────────────────────────
  const statsCards: StatCardProps[] = data
    ? [
        {
          title: 'التلاميذ المسجلين',
          rawValue: data.totalStudents,
          trend: data.totalStudents > 0 ? 'إجمالي المسجلين' : 'لا يوجد تسجيلات',
          trendUp: data.totalStudents > 0,
          icon: <Users className="h-6 w-6" />,
          color: 'text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-200',
          gradientFrom: 'from-teal-400',
          gradientTo: 'to-teal-600',
          index: 0,
        },
        {
          title: 'الأساتذة النشطون',
          rawValue: data.totalTeachers,
          trend: data.totalTeachers > 0 ? 'أساتذة فعّالون' : 'لا يوجد أساتذة',
          trendUp: data.totalTeachers > 0,
          icon: <UserCheck className="h-6 w-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-green-600',
          index: 1,
        },
        {
          title: 'نسبة الحضور',
          rawValue: data.attendanceRate,
          trend:
            data.attendanceRate >= 90
              ? 'معدل ممتاز'
              : data.attendanceRate >= 80
                ? 'معدل جيد'
                : 'يحتاج تحسين',
          trendUp: data.attendanceRate >= 80,
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          gradientFrom: 'from-emerald-400',
          gradientTo: 'to-emerald-600',
          index: 2,
          isPercentage: true,
        },
        {
          title: 'الإيرادات الشهرية',
          rawValue: Math.round(data.monthlyRevenue),
          trend: 'إجمالي الإيرادات المحصّلة',
          trendUp: data.monthlyRevenue > 0,
          icon: <Banknote className="h-6 w-6" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          gradientFrom: 'from-orange-400',
          gradientTo: 'to-orange-600',
          index: 3,
          isCurrency: true,
        },
        {
          title: 'غيابات غير مبررة',
          rawValue: data.unexcusedAbsences,
          trend:
            data.unexcusedAbsences > 0
              ? 'تحتاج متابعة'
              : 'لا توجد غيابات',
          trendUp: data.unexcusedAbsences === 0,
          icon: <AlertTriangle className="h-6 w-6" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          gradientFrom: 'from-red-400',
          gradientTo: 'to-red-600',
          index: 4,
        },
        {
          title: 'حصص اليوم',
          rawValue: data.todaySessionsCount,
          trend: data.totalSessions > 0 ? `من أصل ${data.totalSessions} حصة` : 'لا توجد حصص',
          trendUp: data.todaySessionsCount > 0,
          icon: <Clock className="h-6 w-6" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-purple-600',
          index: 5,
        },
        {
          title: 'الأقسام الدراسية',
          rawValue: data.totalSections,
          trend: data.totalYears > 0 ? `${data.totalYears} سنة دراسية` : 'لا توجد أقسام',
          trendUp: data.totalSections > 0,
          icon: <Layers className="h-6 w-6" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          gradientFrom: 'from-blue-400',
          gradientTo: 'to-blue-600',
          index: 6,
        },
        {
          title: 'الفواتير المتأخرة',
          rawValue: data.overdueInvoices,
          trend: data.pendingInvoices > 0 ? `${data.pendingInvoices} قيد الانتظار` : 'لا توجد فواتير متأخرة',
          trendUp: data.overdueInvoices === 0,
          icon: <Receipt className="h-6 w-6" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          gradientFrom: 'from-amber-400',
          gradientTo: 'to-amber-600',
          index: 7,
        },
      ]
    : [];

  // ─── Derived data for charts ───────────────────────────────────────────
  const absenceDistribution = [
    {
      name: 'تلاميذ',
      value: data?.absenceDistribution.student || 0,
      color: '#0D9488',
    },
    {
      name: 'أساتذة',
      value: data?.absenceDistribution.teacher || 0,
      color: '#F97316',
    },
  ].filter((d) => d.value > 0);

  // Sessions data from API trend (no random)
  const sessionsData = data
    ? data.revenueTrend.map((d) => ({
        month: d.month,
        planned: data.totalSessions > 0 ? Math.round(data.totalSessions / 6) : 0,
        completed: data.totalSessions > 0 ? Math.round((data.totalSessions / 6) * (data.attendanceRate / 100)) : 0,
      }))
    : [];

  // ─── Group yearsHierarchy by level ─────────────────────────────────────
  const groupedByLevel = data
    ? data.yearsHierarchy.reduce(
        (acc, year) => {
          if (!acc[year.level]) acc[year.level] = [];
          acc[year.level].push(year);
          return acc;
        },
        {} as Record<string, DashboardData['yearsHierarchy']>
      )
    : {};

  const levelOrder = ['ابتدائي', 'متوسط', 'ثانوي'];
  const sortedLevels = Object.keys(groupedByLevel).sort(
    (a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b)
  );

  // ─── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Welcome skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-7 w-48 bg-gray-100 rounded-full animate-pulse" />
        </div>
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivitiesSkeleton />
          <ActivitiesSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6" dir="rtl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="outline"
                onClick={fetchData}
                className="gap-2 border-red-200 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── 1. Welcome Section ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'المدير'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <School className="h-4 w-4" />
            إليك ملخص نشاط مؤسستك اليوم
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.notifications.unreadCount > 0 && (
            <Badge className="bg-edutrack-primary/10 text-edutrack-primary border border-edutrack-primary/20 py-1.5 px-3 gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              <span className="font-inter">{data.notifications.unreadCount}</span> إشعار جديد
            </Badge>
          )}
          <Badge
            variant="outline"
            className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5 gap-1.5"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {todayFormatted}
          </Badge>
        </div>
      </motion.div>

      {/* ─── Alert Banners ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {(showWarningAlert || showDangerAlert) && (
          <div className="space-y-3">
            {showWarningAlert && data.unexcusedAbsences > 0 && (
              <AlertBanner
                message={`${data.unexcusedAbsences} تلاميذ غابوا ولم يُبلَّغ أولياؤهم`}
                variant="warning"
                onDismiss={() => setShowWarningAlert(false)}
              />
            )}
            {showDangerAlert && data.overdueInvoices > 3 && (
              <AlertBanner
                message={`${data.overdueInvoices} فاتورة متأخرة تحتاج متابعة`}
                variant="danger"
                onDismiss={() => setShowDangerAlert(false)}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ─── 2. Stats Cards Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <StatCardComponent key={card.title} {...card} />
        ))}
      </div>

      {/* ─── 3. Charts Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-edutrack-primary" />
                تطور رقم الأعمال
              </CardTitle>
              <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data.revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data.revenueTrend}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                          value >= 1000000
                            ? `${(value / 1000000).toFixed(1)}M`
                            : value >= 1000
                              ? `${(value / 1000).toFixed(0)}K`
                              : `${value}`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        name="الإيرادات"
                        stroke="#0D9488"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: '#0D9488',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 7,
                          fill: '#0D9488',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    لا توجد بيانات
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                نسبة الحضور أسبوعياً
              </CardTitle>
              <p className="text-xs text-muted-foreground">حسب أيام الأسبوع</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {data.attendanceTrend.some((d) => d.rate > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.attendanceTrend.filter((d) => d.rate > 0)}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        domain={[70, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="rate"
                        name="نسبة الحضور"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                      >
                        {data.attendanceTrend
                          .filter((d) => d.rate > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.rate >= 90
                                  ? '#10B981'
                                  : entry.rate >= 85
                                    ? '#F59E0B'
                                    : '#EF4444'
                              }
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    لا توجد بيانات حضور
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Students Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-500" />
                توزيع التلاميذ حسب المستوى
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                إجمالي: <span className="font-inter font-semibold">{data.totalStudents}</span> تلميذ
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {data.studentsByLevel.length > 0 && data.studentsByLevel.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.studentsByLevel.filter((d) => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="level"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {data.studentsByLevel
                          .filter((d) => d.count > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-edutrack-dark">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-gray-300" />
                      <p>لا توجد بيانات تلاميذ</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions Overview Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                الحصص المقررة vs المنجزة
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                بناءً على نسبة الحضور{' '}
                <span className="font-inter font-semibold">{data.attendanceRate}%</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {sessionsData.length > 0 && data.totalSessions > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={sessionsData}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="planned"
                        name="المقررة"
                        stroke="#0D9488"
                        fill="#0D9488"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="المنجزة"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-edutrack-dark">
                            {value}
                          </span>
                        )}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    لا توجد بيانات حصص
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── 4. Years & Sections Hierarchy ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-edutrack-dark flex items-center gap-2">
              <Layers className="h-5 w-5 text-edutrack-primary" />
              الهيكل الدراسي - السنوات والأقسام
            </CardTitle>
            <div className="flex items-center gap-3 mt-2">
              {data.sectionsByLevel.map((sl) => (
                <Badge
                  key={sl.level}
                  variant="outline"
                  className={`${sl.level === 'ابتدائي' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : sl.level === 'متوسط' ? 'border-amber-200 bg-amber-50 text-amber-700' : sl.level === 'ثانوي' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                >
                  {sl.level}: <span className="font-inter font-bold mr-1">{sl.count}</span> قسم
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {sortedLevels.length > 0 ? (
              <Accordion type="multiple" defaultValue={sortedLevels} className="w-full">
                {sortedLevels.map((level) => {
                  const years = groupedByLevel[level].sort(
                    (a, b) => a.order - b.order
                  );
                  const levelColor = getLevelColor(level);
                  const totalStudentsInLevel = years.reduce(
                    (sum, y) => sum + y.sections.reduce((s, sec) => s + sec.studentCount, 0),
                    0
                  );
                  const totalCapacityInLevel = years.reduce(
                    (sum, y) => sum + y.sections.reduce((s, sec) => s + sec.capacity, 0),
                    0
                  );

                  const colorClasses: Record<string, { header: string; border: string; dot: string; accent: string }> = {
                    emerald: {
                      header: 'bg-emerald-50/80 text-emerald-800',
                      border: 'border-emerald-200',
                      dot: 'bg-emerald-500',
                      accent: 'text-emerald-600',
                    },
                    amber: {
                      header: 'bg-amber-50/80 text-amber-800',
                      border: 'border-amber-200',
                      dot: 'bg-amber-500',
                      accent: 'text-amber-600',
                    },
                    violet: {
                      header: 'bg-violet-50/80 text-violet-800',
                      border: 'border-violet-200',
                      dot: 'bg-violet-500',
                      accent: 'text-violet-600',
                    },
                  };
                  const c = colorClasses[levelColor] || colorClasses.emerald;

                  return (
                    <AccordionItem
                      key={level}
                      value={level}
                      className={`border ${c.border} rounded-lg mb-3 overflow-hidden`}
                    >
                      <AccordionTrigger
                        className={`px-4 py-3 hover:no-underline ${c.header} rounded-lg`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                          <span className="font-bold text-base">{level}</span>
                          <span className="text-xs opacity-75">
                            <span className="font-inter">{years.length}</span> سنة • <span className="font-inter">{totalStudentsInLevel}</span> تلميذ
                          </span>
                          {totalCapacityInLevel > 0 && (
                            <span className="text-xs opacity-60">
                              (الطاقة: <span className="font-inter">{totalCapacityInLevel}</span>)
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3 mt-2">
                          {years.map((year) => (
                            <div key={year.id} className="border border-gray-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-3">
                                <GraduationCap className={`h-4 w-4 ${c.accent}`} />
                                <span className="font-semibold text-sm text-edutrack-dark">
                                  {year.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  <span className="font-inter">{year.sections.length}</span> قسم
                                </Badge>
                              </div>
                              {year.sections.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {year.sections.map((section) => {
                                    const fillPercent =
                                      section.capacity > 0
                                        ? Math.round((section.studentCount / section.capacity) * 100)
                                        : 0;
                                    const isOverCapacity = fillPercent > 100;

                                    return (
                                      <motion.div
                                        key={section.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-sm text-edutrack-dark">
                                            {section.name}
                                          </span>
                                          {isOverCapacity && (
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Progress
                                            value={Math.min(fillPercent, 100)}
                                            className="h-1.5 flex-1"
                                          />
                                          <span className="text-xs text-muted-foreground font-inter whitespace-nowrap">
                                            <span className={`font-semibold ${isOverCapacity ? 'text-red-600' : fillPercent >= 90 ? 'text-amber-600' : 'text-edutrack-dark'}`}>
                                              {section.studentCount}
                                            </span>
                                            /{section.capacity}
                                          </span>
                                        </div>
                                        {section.supervisorName && (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <UserCheck className="h-3 w-3" />
                                            {section.supervisorName}
                                          </p>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">لا توجد أقسام في هذه السنة</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>لا توجد بيانات هيكل دراسي</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 5. Teachers Overview ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-edutrack-dark flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              الأساتذة
              <Badge variant="secondary" className="font-inter">
                {data.teachers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.teachers.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {data.teachers.map((teacher, index) => (
                    <motion.div
                      key={teacher.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-edutrack-primary">
                          {teacher.name.charAt(0)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-edutrack-dark truncate">
                            {teacher.name}
                          </span>
                          {getLevelBadge(teacher.level)}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookMarked className="h-3 w-3" />
                            {teacher.subjectName}
                          </span>
                          {teacher.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="font-inter">{teacher.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Supervised Sections */}
                      <div className="flex-shrink-0">
                        {teacher.supervisedSections.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {teacher.supervisedSections.map((sec) => (
                              <Badge
                                key={sec.id}
                                variant="outline"
                                className="text-xs border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
                              >
                                {sec.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>لا يوجد أساتذة مسجلون</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 6 & 7. Recent Activities + Notifications ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <Clock className="h-5 w-5 text-edutrack-primary" />
                النشاطات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentActivities.length > 0 ? (
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {data.recentActivities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex flex-col items-center mt-1.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getActivityDotColor(activity.color)}`}
                          />
                          {index < data.recentActivities.length - 1 && (
                            <span className="w-px h-full min-h-[16px] bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${getActivityTextColor(activity.color)}`}>
                            {activity.text}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {activity.time}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {activity.type}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">لا توجد نشاطات حديثة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Card className="shadow-sm h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <Bell className="h-5 w-5 text-edutrack-primary" />
                الإشعارات
                {data.notifications.unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs font-inter">
                    {data.notifications.unreadCount}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.notifications.latest.length > 0 ? (
                <ScrollArea className="h-80">
                  <div className="space-y-1">
                    {data.notifications.latest.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex items-start gap-3 py-2.5 px-2 rounded-lg transition-colors ${
                          !notification.read
                            ? 'bg-edutrack-primary/5 border border-edutrack-primary/10'
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {/* Unread indicator + icon */}
                        <div className="flex items-start gap-2 mt-0.5">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-edutrack-primary flex-shrink-0 mt-1.5" />
                          )}
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-relaxed ${!notification.read ? 'font-semibold text-edutrack-dark' : 'text-muted-foreground'}`}>
                            {notification.title || notification.message}
                          </p>
                          {notification.title && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/70 mt-1 font-inter">
                            {new Date(notification.createdAt).toLocaleDateString('ar-DZ', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">لا توجد إشعارات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
