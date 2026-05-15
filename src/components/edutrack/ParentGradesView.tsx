'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PenLine,
  FileText,
  BookOpen,
  Activity,
  Eye,
  ClipboardCheck,
  GraduationCap,
  Filter,
  BarChart3,
  TrendingUp,
  Award,
  Loader2,
  User,
  Calendar,
  Home,
  ClipboardX,
  Receipt,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';

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

interface ActivityItem {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  description: string | null;
  grade: number | null;
  maxGrade: number | null;
  date: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    level?: string;
  };
  teacher: {
    id: string;
    name: string;
    subject: string;
  };
  section?: {
    id: string;
    name: string;
  } | null;
  session?: {
    id: string;
    subject: string;
  } | null;
}

interface SubjectAverage {
  subject: string;
  average: number;
  totalActivities: number;
  totalGrade: number;
  totalMaxGrade: number;
}

// ─── Constants ─────────────────────────────────────────────
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  HOMEWORK: 'واجب منزلي',
  EXAM: 'امتحان',
  QUIZ: 'اختبار قصير',
  PARTICIPATION: 'مشاركة',
  BEHAVIOR: 'سلوك',
  NOTE: 'ملاحظة',
};

const ACTIVITY_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; barBg: string; iconBg: string }> = {
  HOMEWORK: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    bar: 'bg-sky-500',
    barBg: 'bg-sky-100',
    iconBg: 'bg-sky-100',
  },
  EXAM: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bar: 'bg-rose-500',
    barBg: 'bg-rose-100',
    iconBg: 'bg-rose-100',
  },
  QUIZ: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    bar: 'bg-violet-500',
    barBg: 'bg-violet-100',
    iconBg: 'bg-violet-100',
  },
  PARTICIPATION: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    barBg: 'bg-emerald-100',
    iconBg: 'bg-emerald-100',
  },
  BEHAVIOR: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    barBg: 'bg-amber-100',
    iconBg: 'bg-amber-100',
  },
  NOTE: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    bar: 'bg-gray-500',
    barBg: 'bg-gray-100',
    iconBg: 'bg-gray-100',
  },
};

const ACTIVITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  HOMEWORK: <FileText className="h-4 w-4" />,
  EXAM: <PenLine className="h-4 w-4" />,
  QUIZ: <ClipboardCheck className="h-4 w-4" />,
  PARTICIPATION: <Activity className="h-4 w-4" />,
  BEHAVIOR: <Eye className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
};

const ALL_TYPES = ['ALL', 'HOMEWORK', 'EXAM', 'QUIZ', 'PARTICIPATION', 'BEHAVIOR', 'NOTE'] as const;

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

// ─── Helper Functions ───────────────────────────────────────
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

function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGradeColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 60) return 'text-sky-600';
  if (percentage >= 40) return 'text-amber-600';
  return 'text-rose-600';
}

function getGradeLabel(percentage: number): string {
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'متوسط';
  if (percentage >= 50) return 'مقبول';
  return 'ضعيف';
}

function getGradeBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-500';
  if (percentage >= 60) return 'bg-sky-500';
  if (percentage >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

// ─── Loading Skeleton ───────────────────────────────────────
function GradesSkeleton() {
  return (
    <div className="pb-24 px-4 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-36 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      {/* Filter tabs */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Cards */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Grade Distribution Component ───────────────────────────
function GradeDistribution({ activities }: { activities: ActivityItem[] }) {
  const gradedActivities = activities.filter((a) => a.grade !== null && a.maxGrade !== null);

  if (gradedActivities.length === 0) return null;

  const ranges = [
    { label: 'ممتاز', min: 90, max: 100, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'جيد جداً', min: 80, max: 89, color: 'bg-sky-500', textColor: 'text-sky-700' },
    { label: 'جيد', min: 70, max: 79, color: 'bg-teal-500', textColor: 'text-teal-700' },
    { label: 'متوسط', min: 60, max: 69, color: 'bg-amber-500', textColor: 'text-amber-700' },
    { label: 'ضعيف', min: 0, max: 59, color: 'bg-rose-500', textColor: 'text-rose-700' },
  ];

  const distribution = ranges.map((range) => ({
    ...range,
    count: gradedActivities.filter((a) => {
      const pct = Math.round((a.grade! / a.maxGrade!) * 100);
      return pct >= range.min && pct <= range.max;
    }).length,
  }));

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-edutrack-primary" />
          توزيع النقاط
        </h3>
        <div className="space-y-2">
          {distribution.map((range) => (
            <div key={range.label} className="flex items-center gap-3">
              <span className={`text-[11px] font-medium w-16 text-left ${range.textColor}`}>
                {range.label}
              </span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${maxCount > 0 ? (range.count / maxCount) * 100 : 0}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full ${range.color} rounded-full`}
                />
              </div>
              <span className="text-[11px] font-bold text-edutrack-dark min-w-[20px] text-center font-inter">
                {range.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Subject Averages Component ─────────────────────────────
function SubjectAverages({ subjectAverages }: { subjectAverages: SubjectAverage[] }) {
  if (subjectAverages.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <h3 className="text-sm font-bold text-edutrack-dark mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-edutrack-primary" />
          معدل المواد
        </h3>
        <div className="space-y-3">
          {subjectAverages.map((sa) => {
            const pct = Math.round(sa.average);
            return (
              <div key={sa.subject} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-edutrack-dark">{sa.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-inter">
                      {sa.totalActivities} نشاط
                    </span>
                    <span className={`text-sm font-bold font-inter ${getGradeColor(pct)}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getGradeBarColor(pct)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Activity Card Component ────────────────────────────────
function ActivityCard({ activity, index }: { activity: ActivityItem; index: number }) {
  const typeColor = ACTIVITY_TYPE_COLORS[activity.type] || ACTIVITY_TYPE_COLORS.NOTE;
  const typeIcon = ACTIVITY_TYPE_ICONS[activity.type] || <FileText className="h-4 w-4" />;
  const typeLabel = ACTIVITY_TYPE_LABELS[activity.type] || 'نشاط';

  const hasGrade = activity.grade !== null && activity.maxGrade !== null && activity.maxGrade > 0;
  const percentage = hasGrade ? Math.round((activity.grade! / activity.maxGrade!) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardContent className="p-0">
          {/* Colored top strip */}
          <div className={`h-1 ${typeColor.bar}`} />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Type Icon */}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor.iconBg} ${typeColor.text}`}>
                {typeIcon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title + Type Badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-edutrack-dark truncate leading-relaxed">
                    {activity.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] flex-shrink-0 ${typeColor.bg} ${typeColor.text} ${typeColor.border} border`}
                  >
                    {typeLabel}
                  </Badge>
                </div>

                {/* Teacher & Subject */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{activity.teacher.name}</span>
                  </div>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{activity.teacher.subject}</span>
                  </div>
                </div>

                {/* Grade Progress Bar */}
                {hasGrade && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className={`h-3.5 w-3.5 ${getGradeColor(percentage)}`} />
                        <span className={`text-xs font-bold font-inter ${getGradeColor(percentage)}`}>
                          {activity.grade}/{activity.maxGrade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${getGradeColor(percentage)}`}>
                          {getGradeLabel(percentage)}
                        </span>
                        <span className={`text-xs font-bold font-inter ${getGradeColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 + index * 0.04 }}
                        className={`h-full rounded-full ${getGradeBarColor(percentage)}`}
                      />
                    </div>
                  </div>
                )}

                {/* No grade indicator */}
                {!hasGrade && (
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="text-[11px] text-muted-foreground">بدون نقطة</span>
                  </div>
                )}

                {/* Description */}
                {activity.description && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 line-clamp-1">
                    {activity.description}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50">
                    {formatDateFull(activity.date)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 mr-1">
                    ({formatDateArabic(activity.date)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function ParentGradesView() {
  const user = useAppStore((s) => s.user);

  // ─── State ──────────────────────────────────────────────
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // ─── Fetch Children ─────────────────────────────────────
  const fetchChildren = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/parent/dashboard?userId=${user.id}`);
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const data = await res.json();
      setChildren(data.children || []);
    } catch (err) {
      console.error('Error fetching children:', err);
      toast.error('فشل في تحميل بيانات الأبناء');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ─── Fetch Activities ───────────────────────────────────
  const fetchActivities = useCallback(async (studentId: string) => {
    if (!studentId) return;

    try {
      setActivitiesLoading(true);
      const res = await fetch(`/api/activities?studentId=${studentId}&limit=50`);
      if (!res.ok) throw new Error('فشل في تحميل الأنشطة');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      toast.error('فشل في تحميل الأنشطة');
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // ─── Initial Load ───────────────────────────────────────
  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // ─── Load Activities When Child Changes ─────────────────
  useEffect(() => {
    const currentChild = children[selectedChildIndex];
    if (currentChild) {
      fetchActivities(currentChild.id);
      setActiveFilter('ALL');
    }
  }, [children, selectedChildIndex, fetchActivities]);

  // ─── Auto-refresh activities every 30 seconds ───────────
  useEffect(() => {
    const currentChild = children[selectedChildIndex];
    if (!currentChild) return;
    const interval = setInterval(() => {
      fetchActivities(currentChild.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [children, selectedChildIndex, fetchActivities]);

  // ─── Computed Values ────────────────────────────────────
  const currentChild = children[selectedChildIndex] || null;

  // Filtered & sorted activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by type
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter((a) => a.type === activeFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [activities, activeFilter]);

  // Graded activities only
  const gradedActivities = useMemo(
    () => activities.filter((a) => a.grade !== null && a.maxGrade !== null && a.maxGrade > 0),
    [activities]
  );

  // Overall average grade
  const overallAverage = useMemo(() => {
    if (gradedActivities.length === 0) return 0;
    const totalPct = gradedActivities.reduce((sum, a) => sum + (a.grade! / a.maxGrade!) * 100, 0);
    return Math.round(totalPct / gradedActivities.length);
  }, [gradedActivities]);

  // Highest grade
  const highestGrade = useMemo(() => {
    if (gradedActivities.length === 0) return 0;
    return Math.max(...gradedActivities.map((a) => (a.grade! / a.maxGrade!) * 100));
  }, [gradedActivities]);

  // Unique subjects count
  const subjectsCount = useMemo(() => {
    const subjects = new Set(activities.map((a) => a.teacher.subject));
    return subjects.size;
  }, [activities]);

  // Subject averages
  const subjectAverages = useMemo((): SubjectAverage[] => {
    const subjectMap: Record<string, { totalGrade: number; totalMax: number; count: number }> = {};

    gradedActivities.forEach((a) => {
      const subj = a.teacher.subject;
      if (!subjectMap[subj]) {
        subjectMap[subj] = { totalGrade: 0, totalMax: 0, count: 0 };
      }
      subjectMap[subj].totalGrade += a.grade!;
      subjectMap[subj].totalMax += a.maxGrade!;
      subjectMap[subj].count += 1;
    });

    return Object.entries(subjectMap)
      .map(([subject, data]) => ({
        subject,
        average: data.totalMax > 0 ? (data.totalGrade / data.totalMax) * 100 : 0,
        totalActivities: data.count,
        totalGrade: data.totalGrade,
        totalMaxGrade: data.totalMax,
      }))
      .sort((a, b) => b.average - a.average);
  }, [gradedActivities]);

  // Activity type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: activities.length };
    activities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return <GradesSkeleton />;
  }

  // ─── No Children State ──────────────────────────────────
  if (children.length === 0) {
    return (
      <div className="pb-24 px-4" dir="rtl">
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-lg font-semibold text-edutrack-dark">لا يوجد أبناء مسجلين</p>
          <p className="text-sm text-muted-foreground mt-1">لم يتم العثور على بيانات الأبناء</p>
        </div>
        <BottomNavBar />
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-24 px-4"
        dir="rtl"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <h1 className="text-xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
            </div>
            النقاط والأنشطة
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 text-emerald-600 bg-emerald-50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              مباشر من الأساتذة
            </Badge>
          </h1>
          {currentChild && (
            <p className="text-sm text-muted-foreground mt-1">
              سجل نقاط {currentChild.name}
              {currentChild.section ? ` - ${currentChild.section.name}` : ''}
            </p>
          )}
        </motion.div>

        {/* ── Child Selector (if multiple) ────────────────── */}
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

        {/* ── Stats Row ───────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-5">
          <div className="grid grid-cols-4 gap-2">
            {/* Average Grade */}
            <Card className="border-0 shadow-sm bg-edutrack-primary/5">
              <CardContent className="p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-edutrack-primary/10 mx-auto mb-1.5 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-edutrack-primary" />
                </div>
                <p className={`text-lg font-bold font-inter ${gradedActivities.length > 0 ? getGradeColor(overallAverage) : 'text-gray-400'}`}>
                  {gradedActivities.length > 0 ? `${overallAverage}%` : '—'}
                </p>
                <p className="text-[9px] text-muted-foreground font-medium">المعدل العام</p>
              </CardContent>
            </Card>

            {/* Total Activities */}
            <Card className="border-0 shadow-sm bg-sky-50">
              <CardContent className="p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-sky-100 mx-auto mb-1.5 flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-sky-600" />
                </div>
                <p className="text-lg font-bold text-sky-700 font-inter">{activities.length}</p>
                <p className="text-[9px] text-sky-600 font-medium">الأنشطة</p>
              </CardContent>
            </Card>

            {/* Highest Grade */}
            <Card className="border-0 shadow-sm bg-emerald-50">
              <CardContent className="p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 mx-auto mb-1.5 flex items-center justify-center">
                  <Award className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-lg font-bold text-emerald-700 font-inter">
                  {gradedActivities.length > 0 ? `${Math.round(highestGrade)}%` : '—'}
                </p>
                <p className="text-[9px] text-emerald-600 font-medium">أعلى نقطة</p>
              </CardContent>
            </Card>

            {/* Subjects Count */}
            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-3 text-center">
                <div className="h-8 w-8 rounded-lg bg-amber-100 mx-auto mb-1.5 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-lg font-bold text-amber-700 font-inter">{subjectsCount}</p>
                <p className="text-[9px] text-amber-600 font-medium">المواد</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Subject Averages ────────────────────────────── */}
        {subjectAverages.length > 0 && (
          <motion.div variants={itemVariants} className="mb-5">
            <SubjectAverages subjectAverages={subjectAverages} />
          </motion.div>
        )}

        {/* ── Grade Distribution ──────────────────────────── */}
        {gradedActivities.length > 0 && (
          <motion.div variants={itemVariants} className="mb-5">
            <GradeDistribution activities={activities} />
          </motion.div>
        )}

        {/* ── Filter Tabs ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-bold text-edutrack-dark">تصفية حسب النوع</span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 pb-1">
              {ALL_TYPES.map((type) => {
                const isActive = activeFilter === type;
                const count = type === 'ALL' ? activities.length : (typeCounts[type] || 0);
                const label = type === 'ALL' ? 'الكل' : (ACTIVITY_TYPE_LABELS[type] || type);
                const colorScheme = type === 'ALL' ? null : ACTIVITY_TYPE_COLORS[type];

                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? type === 'ALL'
                          ? 'bg-edutrack-primary text-white border-edutrack-primary shadow-md shadow-edutrack-primary/20'
                          : `${colorScheme!.bg} ${colorScheme!.text} ${colorScheme!.border} shadow-sm`
                        : 'bg-white text-muted-foreground border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {type !== 'ALL' && (
                      <span className={`${isActive ? '' : 'opacity-50'}`}>
                        {ACTIVITY_TYPE_ICONS[type]}
                      </span>
                    )}
                    {label}
                    <span className={`text-[10px] ${isActive ? 'opacity-80' : 'opacity-50'} font-inter`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </motion.div>

        {/* ── Activities Loading ───────────────────────────── */}
        {activitiesLoading && (
          <div className="space-y-3 mb-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {/* ── Activity Cards ──────────────────────────────── */}
        {!activitiesLoading && (
          <AnimatePresence mode="wait">
            {filteredActivities.length > 0 ? (
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {filteredActivities.map((activity, index) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        index={index}
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* Results count */}
                <div className="mt-3 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    عرض {filteredActivities.length} من {activities.length} نشاط
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="h-16 w-16 rounded-2xl bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-edutrack-dark">
                  {activeFilter !== 'ALL'
                    ? `لا توجد أنشطة من نوع "${ACTIVITY_TYPE_LABELS[activeFilter] || activeFilter}"`
                    : 'لا توجد أنشطة بعد'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFilter !== 'ALL'
                    ? 'جرّب تصفية أخرى'
                    : 'سيتم عرض الأنشطة هنا بعد إضافتها من قبل الأساتذة'}
                </p>
                {activeFilter !== 'ALL' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setActiveFilter('ALL')}
                  >
                    عرض الكل
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </>
  );
}
