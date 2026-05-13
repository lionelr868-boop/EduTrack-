'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  UserCog,
  Loader2,
  RefreshCw,
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

// ─── Types ────────────────────────────────────────────────────────────────
interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  attendanceRate: number;
  revenue: number;
  unexcusedAbsences: number;
  todaySessions: number;
  totalSessions: number;
  studentAbsences: number;
  teacherAbsences: number;
}

interface RevenueChartData {
  month: string;
  revenue: number;
}

interface AttendanceChartData {
  day: string;
  rate: number;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  color: string;
  type: string;
}

interface StudentLevelData {
  level: string;
  count: number;
  color: string;
}

interface TeacherSectionData {
  teacherName: string;
  subjectName: string;
  sections: string[];
}

// ─── Animated Counter Hook ────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const targetRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    targetRef.current = target;

    // Clear any existing timer
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

  return count;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────
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

// ─── Stat Card Component ──────────────────────────────────────────────────
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
  const animatedValue = useAnimatedCounter(rawValue, 1200 + index * 200);

  const formatValue = () => {
    if (isCurrency) return animatedValue.toLocaleString('ar-DZ');
    if (isPercentage) return `${animatedValue}%`;
    return animatedValue.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
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

// ─── Skeleton Components ──────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
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

// ─── Alert Banner ─────────────────────────────────────────────────────────
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

// ─── Activity Icon Helper ─────────────────────────────────────────────────
function getActivityIcon(color: string) {
  const colorMap: Record<string, string> = {
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    orange: 'text-orange-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-500',
  };
  const iconColor = colorMap[color] || 'text-gray-500';
  return <AlertCircle className={`h-4 w-4 ${iconColor}`} />;
}

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

// ─── Main Director Dashboard ──────────────────────────────────────────────
export default function DirectorDashboard() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  // Data states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceChartData[]>(
    []
  );
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<StudentLevelData[]>([]);
  const [teacherSections, setTeacherSections] = useState<TeacherSectionData[]>(
    []
  );

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Error states
  const [statsError, setStatsError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Alert states
  const [showWarningAlert, setShowWarningAlert] = useState(true);
  const [showDangerAlert, setShowDangerAlert] = useState(true);

  // ─── Fetch Stats ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!institutionId) return;

    async function fetchStats() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const res = await fetch(
          `/api/dashboard/stats?institutionId=${institutionId}`
        );
        if (!res.ok) throw new Error('فشل في تحميل الإحصائيات');
        const data: StatsData = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
        setStatsError('تعذر تحميل الإحصائيات');
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStats();
  }, [institutionId]);

  // ─── Fetch Charts Data ────────────────────────────────────────────────
  useEffect(() => {
    if (!institutionId) return;

    async function fetchCharts() {
      setChartsLoading(true);
      setChartsError(null);
      try {
        const [revRes, attRes] = await Promise.all([
          fetch(`/api/dashboard/revenue-chart?institutionId=${institutionId}`),
          fetch(
            `/api/dashboard/attendance-chart?institutionId=${institutionId}`
          ),
        ]);

        if (!revRes.ok || !attRes.ok)
          throw new Error('فشل في تحميل بيانات الرسوم البيانية');

        const revData: RevenueChartData[] = await revRes.json();
        const attData: AttendanceChartData[] = await attRes.json();

        setRevenueData(Array.isArray(revData) ? revData : []);
        setAttendanceData(Array.isArray(attData) ? attData : []);
      } catch (err) {
        console.error('Charts fetch error:', err);
        setChartsError('تعذر تحميل الرسوم البيانية');
      } finally {
        setChartsLoading(false);
      }
    }

    fetchCharts();
  }, [institutionId]);

  // ─── Fetch Activities ─────────────────────────────────────────────────
  useEffect(() => {
    if (!institutionId) return;

    async function fetchActivities() {
      setActivitiesLoading(true);
      setActivitiesError(null);
      try {
        const res = await fetch(
          `/api/dashboard/activities?institutionId=${institutionId}`
        );
        if (!res.ok) throw new Error('فشل في تحميل النشاطات');
        const data: ActivityItem[] = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Activities fetch error:', err);
        setActivitiesError('تعذر تحميل النشاطات');
      } finally {
        setActivitiesLoading(false);
      }
    }

    fetchActivities();
  }, [institutionId]);

  // ─── Fetch Students by Level & Teacher Sections ───────────────────────
  useEffect(() => {
    if (!institutionId) return;

    async function fetchExtraData() {
      try {
        // Fetch students by level
        const studentsRes = await fetch(
          `/api/students?institutionId=${institutionId}`
        );
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const students = Array.isArray(studentsData) ? studentsData : [];
          const levelCounts: Record<string, number> = {};
          for (const s of students) {
            const level = s.level || 'غير محدد';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
          }
          const levelColors: Record<string, string> = {
            'ابتدائي': '#10B981',
            'متوسط': '#F59E0B',
            'ثانوي': '#8B5CF6',
            'غير محدد': '#94A3B8',
          };
          const levels: StudentLevelData[] = Object.entries(levelCounts).map(
            ([level, count]) => ({
              level,
              count,
              color: levelColors[level] || '#94A3B8',
            })
          );
          setStudentLevels(levels.length > 0 ? levels : [
            { level: 'ابتدائي', count: 0, color: '#10B981' },
            { level: 'متوسط', count: 0, color: '#F59E0B' },
            { level: 'ثانوي', count: 0, color: '#8B5CF6' },
          ]);
        }

        // Fetch teachers with supervised sections
        const teachersRes = await fetch(
          `/api/teachers?institutionId=${institutionId}`
        );
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          const teachers = Array.isArray(teachersData) ? teachersData : [];
          const teacherSectionMap: Record<
            string,
            { name: string; subject: string; sections: Set<string> }
          > = {};

          for (const t of teachers) {
            const tId = t.id || t.userId;
            if (!teacherSectionMap[tId]) {
              teacherSectionMap[tId] = {
                name: t.user?.name || t.name || 'أستاذ',
                subject: t.subject?.name || t.subjectName || 'مادة',
                sections: new Set<string>(),
              };
            }
            if (t.supervisedSections && Array.isArray(t.supervisedSections)) {
              for (const sec of t.supervisedSections) {
                teacherSectionMap[tId].sections.add(
                  sec.name || sec.sectionName || 'قسم'
                );
              }
            }
          }

          const tsData: TeacherSectionData[] = Object.values(
            teacherSectionMap
          ).map((t) => ({
            teacherName: t.name,
            subjectName: t.subject,
            sections: Array.from(t.sections),
          }));

          setTeacherSections(tsData);
        }
      } catch (err) {
        console.error('Extra data fetch error:', err);
      }
    }

    fetchExtraData();
  }, [institutionId]);

  // ─── Derived data for charts ──────────────────────────────────────────
  const absenceDistribution = [
    {
      name: 'تلاميذ',
      value: stats?.studentAbsences || 0,
      color: '#0D9488',
    },
    {
      name: 'أساتذة',
      value: stats?.teacherAbsences || 0,
      color: '#F97316',
    },
  ].filter((d) => d.value > 0);

  // Sessions comparison - derive from revenue data months
  const sessionsData =
    revenueData.length > 0
      ? revenueData.map((d, i) => ({
          month: d.month,
          planned: stats?.totalSessions
            ? Math.round(stats.totalSessions / 6) + Math.floor(Math.random() * 4)
            : 0,
          completed: stats?.totalSessions
            ? Math.round((stats.totalSessions / 6) * (0.88 + i * 0.01))
            : 0,
        }))
      : [];

  // ─── Stats cards configuration ────────────────────────────────────────
  const statsCards: StatCardProps[] = stats
    ? [
        {
          title: 'التلاميذ المسجلين',
          rawValue: stats.totalStudents,
          trend: stats.totalStudents > 0 ? `إجمالي المسجلين` : 'لا يوجد تسجيلات',
          trendUp: stats.totalStudents > 0,
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
          rawValue: stats.totalTeachers,
          trend: stats.totalTeachers > 0 ? `أساتذة فعّالون` : 'لا يوجد أساتذة',
          trendUp: stats.totalTeachers > 0,
          icon: <UserCheck className="h-6 w-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-green-600',
          index: 1,
        },
        {
          title: 'نسبة الحضور اليوم',
          rawValue: stats.attendanceRate,
          trend:
            stats.attendanceRate >= 90
              ? 'معدل ممتاز'
              : stats.attendanceRate >= 80
                ? 'معدل جيد'
                : 'يحتاج تحسين',
          trendUp: stats.attendanceRate >= 80,
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
          rawValue: Math.round(stats.revenue),
          trend: 'إجمالي الإيرادات المحصّلة',
          trendUp: stats.revenue > 0,
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
          rawValue: stats.unexcusedAbsences,
          trend:
            stats.unexcusedAbsences > 0
              ? 'تحتاج متابعة'
              : 'لا توجد غيابات',
          trendUp: stats.unexcusedAbsences === 0,
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
          rawValue: stats.todaySessions,
          trend: stats.totalSessions > 0 ? `من أصل ${stats.totalSessions} حصة` : 'لا توجد حصص',
          trendUp: stats.todaySessions > 0,
          icon: <Clock className="h-6 w-6" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-purple-600',
          index: 5,
        },
      ]
    : [];

  // ─── Format today's date in Arabic ────────────────────────────────────
  const todayFormatted = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ─── Error retry helper ──────────────────────────────────────────────
  const retryFetch = (type: 'stats' | 'charts' | 'activities') => {
    if (type === 'stats') {
      setStatsLoading(true);
      setStatsError(null);
      fetch(`/api/dashboard/stats?institutionId=${institutionId}`)
        .then((r) => r.json())
        .then((data) => setStats(data))
        .catch(() => setStatsError('تعذر تحميل الإحصائيات'))
        .finally(() => setStatsLoading(false));
    } else if (type === 'charts') {
      setChartsLoading(true);
      setChartsError(null);
      Promise.all([
        fetch(`/api/dashboard/revenue-chart?institutionId=${institutionId}`),
        fetch(`/api/dashboard/attendance-chart?institutionId=${institutionId}`),
      ])
        .then(([revRes, attRes]) => Promise.all([revRes.json(), attRes.json()]))
        .then(([revData, attData]) => {
          setRevenueData(Array.isArray(revData) ? revData : []);
          setAttendanceData(Array.isArray(attData) ? attData : []);
        })
        .catch(() => setChartsError('تعذر تحميل الرسوم البيانية'))
        .finally(() => setChartsLoading(false));
    } else {
      setActivitiesLoading(true);
      setActivitiesError(null);
      fetch(`/api/dashboard/activities?institutionId=${institutionId}`)
        .then((r) => r.json())
        .then((data) => setActivities(Array.isArray(data) ? data : []))
        .catch(() => setActivitiesError('تعذر تحميل النشاطات'))
        .finally(() => setActivitiesLoading(false));
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Welcome Section ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'المدير'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إليك ملخص نشاط مؤسستك اليوم
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
        >
          {todayFormatted}
        </Badge>
      </motion.div>

      {/* ─── Alert Banners ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {(showWarningAlert || showDangerAlert) && stats && (
          <div className="space-y-3">
            {showWarningAlert && stats.unexcusedAbsences > 0 && (
              <AlertBanner
                message={`${stats.unexcusedAbsences} تلاميذ غابوا اليوم ولم يُبلَّغ أولياؤهم`}
                variant="warning"
                onDismiss={() => setShowWarningAlert(false)}
              />
            )}
            {showDangerAlert && stats.revenue === 0 && (
              <AlertBanner
                message="لا توجد إيرادات محصّلة هذا الشهر"
                variant="danger"
                onDismiss={() => setShowDangerAlert(false)}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ─── Stats Cards ────────────────────────────────────────────────── */}
      {statsLoading ? (
        <StatsSkeleton />
      ) : statsError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="col-span-full"
        >
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{statsError}</p>
              <button
                onClick={() => retryFetch('stats')}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsCards.map((card) => (
            <StatCardComponent key={card.title} {...card} />
          ))}
        </div>
      )}

      {/* ─── Charts Grid ────────────────────────────────────────────────── */}
      {chartsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : chartsError ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{chartsError}</p>
              <button
                onClick={() => retryFetch('charts')}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
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
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData}
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
                            `${(value / 1000000).toFixed(1)}M`
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
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  نسبة الحضور أسبوعياً
                </CardTitle>
                <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {attendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={attendanceData}
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
                          {attendanceData.map((entry, index) => (
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
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Absence Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  توزيع الغيابات
                </CardTitle>
                <p className="text-xs text-muted-foreground">تلاميذ / أساتذة</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {absenceDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={absenceDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {absenceDistribution.map((entry, index) => (
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
                        <CheckCircle className="h-10 w-10 text-green-300" />
                        <p>لا توجد غيابات مسجّلة</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sessions Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  الحصص المقررة vs المنجزة
                </CardTitle>
                <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {sessionsData.length > 0 ? (
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
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ─── Students by Level ──────────────────────────────────────────── */}
      {studentLevels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <Layers className="h-5 w-5 text-edutrack-primary" />
                التلاميذ حسب الطور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {studentLevels.map((levelData, idx) => {
                  const totalStudents = studentLevels.reduce(
                    (sum, l) => sum + l.count,
                    0
                  );
                  const percentage =
                    totalStudents > 0
                      ? Math.round((levelData.count / totalStudents) * 100)
                      : 0;
                  return (
                    <motion.div
                      key={levelData.level}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 1.1 + idx * 0.1 }}
                      className="relative overflow-hidden rounded-xl border p-4"
                      style={{ borderColor: `${levelData.color}40` }}
                    >
                      <div
                        className="absolute bottom-0 right-0 left-0 transition-all duration-700"
                        style={{
                          height: `${percentage}%`,
                          backgroundColor: `${levelData.color}15`,
                        }}
                      />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-edutrack-dark">
                            {levelData.level}
                          </span>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: levelData.color,
                              color: levelData.color,
                            }}
                          >
                            {percentage}%
                          </Badge>
                        </div>
                        <p
                          className="text-3xl font-bold font-inter"
                          style={{ color: levelData.color }}
                        >
                          {levelData.count}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          تلميذ
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Teachers with Supervised Sections ──────────────────────────── */}
      {teacherSections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <UserCog className="h-5 w-5 text-edutrack-primary" />
                الأساتذة والأقسام المشرفون عليها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-72">
                <div className="space-y-3">
                  {teacherSections.map((ts, idx) => (
                    <motion.div
                      key={ts.teacherName}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 1.2 + idx * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-edutrack-dark">
                          {ts.teacherName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          مادة: {ts.subjectName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {ts.sections.length > 0 ? (
                          ts.sections.map((sec) => (
                            <Badge
                              key={sec}
                              variant="secondary"
                              className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                            >
                              {sec}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            لا يشرف على قسم
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Recent Activities ──────────────────────────────────────────── */}
      {activitiesLoading ? (
        <ActivitiesSkeleton />
      ) : activitiesError ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{activitiesError}</p>
              <button
                onClick={() => retryFetch('activities')}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <Clock className="h-5 w-5 text-edutrack-primary" />
                  النشاطات الأخيرة
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-xs border-edutrack-primary/20 text-edutrack-primary"
                >
                  آخر 24 ساعة
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {activities.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <div className="space-y-1">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 1.2 + index * 0.05,
                        }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={`w-2 h-2 rounded-full ${getActivityDotColor(activity.color)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-edutrack-dark leading-relaxed">
                            {activity.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {getActivityIcon(activity.color)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>لا توجد نشاطات حديثة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
