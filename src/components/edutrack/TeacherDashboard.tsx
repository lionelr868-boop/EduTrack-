'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Users,
  ClipboardCheck,
  CalendarDays,
  Plus,
  GraduationCap,
  FileText,
  PenLine,
  BarChart3,
  Activity,
  Loader2,
  Eye,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface TodaySession {
  id: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  sectionName: string;
  yearName: string;
  level: string;
  status: 'upcoming' | 'done' | 'cancelled' | 'in_progress';
}

interface SupervisedSection {
  id: string;
  name: string;
  yearName: string;
  level: string;
  studentCount: number;
  attendanceRate?: number;
}

interface SectionWithStudents {
  id: string;
  name: string;
  yearName: string;
  students: { id: string; name: string }[];
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
  student: { id: string; name: string; level?: string };
  section: { id: string; name: string };
}

interface AbsenceAlert {
  id: string;
  studentName: string;
  subjectName: string;
  date: string;
}

interface DashboardData {
  teacher: {
    id: string;
    name: string;
    subjectName: string;
    level: string;
  };
  todaySessions: TodaySession[];
  stats: {
    weeklyAttendanceRate: number;
    sessionsWithoutAttendance: number;
    totalStudents: number;
    totalSessions?: number;
    attendanceRate?: number;
    presentCount?: number;
    absentCount?: number;
    lateCount?: number;
    supervisedSectionsCount?: number;
  };
  weeklyAttendanceChart: { day: string; rate: number }[];
  recentAbsences: AbsenceAlert[];
  supervisedSections: SupervisedSection[];
  sectionsWithStudents: SectionWithStudents[];
  performanceSummary?: {
    activitiesThisMonth: number;
    avgGrade: number;
    perfectAttendanceCount: number;
    sessionsCompletedThisWeek: number;
    sessionsPlannedThisWeek: number;
  };
}

// ─── Activity Type Labels ──────────────────────────────────
const activityTypeLabels: Record<string, string> = {
  HOMEWORK: 'واجب منزلي',
  EXAM: 'اختبار',
  QUIZ: 'فروض',
  PARTICIPATION: 'مشاركة',
  BEHAVIOR: 'سلوك',
  NOTE: 'ملاحظة',
};

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

// ─── Status Config ─────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  done: {
    label: 'منجزة',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  upcoming: {
    label: 'قادمة',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    dotColor: 'bg-sky-500',
  },
  in_progress: {
    label: 'جارية',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  cancelled: {
    label: 'ملغاة',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    dotColor: 'bg-red-500',
  },
};

// ─── Level Labels ──────────────────────────────────────────
const levelLabels: Record<string, string> = {
  PRIMARY: 'ابتدائي',
  MIDDLE: 'متوسط',
  SECONDARY: 'ثانوي',
};

// ─── Custom Tooltip ────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
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
          <span className="font-semibold text-edutrack-dark">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-5" dir="rtl">
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function TeacherDashboard() {
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity form state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityGrade, setActivityGrade] = useState('');
  const [activityMaxGrade, setActivityMaxGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayDate = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ─── Fetch Dashboard Data ─────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/teacher/dashboard?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      toast.error('فشل في جلب بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ─── Fetch Recent Activities ──────────────────────────────
  const fetchRecentActivities = useCallback(async () => {
    if (!dashboardData?.teacher?.id) return;

    try {
      const res = await fetch(
        `/api/activities?teacherId=${dashboardData.teacher.id}&limit=10`
      );
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      setRecentActivities(data.activities || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, [dashboardData?.teacher?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (dashboardData?.teacher?.id) {
      fetchRecentActivities();
    }
  }, [dashboardData?.teacher?.id, fetchRecentActivities]);

  // ─── Handle Activity Submit ───────────────────────────────
  const handleActivitySubmit = async () => {
    if (!dashboardData?.teacher?.id) return;
    if (!selectedStudentId || !activityType || !activityTitle.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (activityGrade && activityMaxGrade) {
      if (parseFloat(activityGrade) > parseFloat(activityMaxGrade)) {
        toast.error('العلامة لا يمكن أن تتجاوز العلامة القصوى');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          teacherId: dashboardData.teacher.id,
          sectionId: selectedSectionId,
          type: activityType,
          title: activityTitle.trim(),
          description: activityDescription.trim() || undefined,
          grade: activityGrade ? parseFloat(activityGrade) : undefined,
          maxGrade: activityMaxGrade ? parseFloat(activityMaxGrade) : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في إنشاء النشاط');
      }

      toast.success('تم إضافة النشاط بنجاح');

      // Reset form
      setSelectedSectionId('');
      setSelectedStudentId('');
      setActivityType('');
      setActivityTitle('');
      setActivityDescription('');
      setActivityGrade('');
      setActivityMaxGrade('');

      // Close sheet & refresh activities
      setSheetOpen(false);
      fetchRecentActivities();
    } catch (err) {
      console.error('Error submitting activity:', err);
      toast.error(
        err instanceof Error ? err.message : 'فشل في إضافة النشاط'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Get Students for Selected Section ────────────────────
  const getStudentsForSection = useCallback(() => {
    if (!selectedSectionId || !dashboardData?.sectionsWithStudents) return [];
    const section = dashboardData.sectionsWithStudents.find(
      (s) => s.id === selectedSectionId
    );
    return section?.students || [];
  }, [selectedSectionId, dashboardData?.sectionsWithStudents]);

  // ─── Format Date ──────────────────────────────────────────
  const formatDateArabic = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-DZ', {
      month: 'short',
      day: 'numeric',
    });
  };

  // ─── Loading State ────────────────────────────────────────
  if (loading || !dashboardData) {
    return <DashboardSkeleton />;
  }

  const {
    teacher,
    todaySessions,
    stats,
    weeklyAttendanceChart,
    recentAbsences,
    supervisedSections,
    sectionsWithStudents,
    performanceSummary,
  } = dashboardData;

  // ─── Stats Config ────────────────────────────────────────
  const statsCards = [
    {
      label: 'نسبة الحضور',
      value: `${stats.weeklyAttendanceRate}%`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      onClick: () => setCurrentView('teacher-attendance'),
    },
    {
      label: 'حصص بدون حضور',
      value: `${stats.sessionsWithoutAttendance}`,
      icon: <ClipboardCheck className="h-5 w-5" />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      onClick: () => setCurrentView('teacher-attendance'),
    },
    {
      label: 'إجمالي التلاميذ',
      value: `${stats.totalStudents}`,
      icon: <Users className="h-5 w-5" />,
      bgColor: 'bg-edutrack-primary/5',
      textColor: 'text-edutrack-primary',
      iconBg: 'bg-edutrack-primary/10',
      onClick: () => setCurrentView('teacher-students'),
    },
    {
      label: 'أقسام مشرفة',
      value: `${supervisedSections.length}`,
      icon: <ShieldCheck className="h-5 w-5" />,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      onClick: () => setCurrentView('teacher-students'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════
          Section 1: Welcome Header
          ═══════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden border-0 rounded-xl">
        <div className="bg-gradient-to-l from-edutrack-primary via-edutrack-dark to-edutrack-dark p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white/20">
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                  {user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2) || 'أ'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white">
                  مرحباً، {user?.name?.split(' ')[0] || 'الأستاذ'}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  إليك ملخص نشاطك اليوم
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {teacher.subjectName}
              </Badge>
              <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {levelLabels[teacher.level] || teacher.level}
              </Badge>
              <Badge className="bg-white/25 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5" />
                {todaySessions.length} حصة اليوم
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          Section 2: Stats Row
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
          >
            <Card
              className="border cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={stat.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                    <span className={stat.textColor}>{stat.icon}</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold font-inter ${stat.textColor}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          Section 3: Main Content Grid (3 columns on large screens)
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Column 1: Today's Sessions ──────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-edutrack-dark flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-edutrack-primary" />
                حصص اليوم
                {todaySessions.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {todaySessions.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todaySessions.length > 0 ? (
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {todaySessions.map((session) => {
                    const status = statusConfig[session.status] || statusConfig.upcoming;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setCurrentView('teacher-attendance')}
                      >
                        <div className="flex flex-col items-center min-w-[44px]">
                          <span className="text-xs font-bold font-inter text-edutrack-dark">
                            {session.startTime}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-inter">
                            {session.endTime}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-9" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-edutrack-dark truncate">
                            {session.subjectName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {session.sectionName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${status.bgColor} ${status.color} border text-[10px] gap-1 px-1.5 py-0 shrink-0`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          {status.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  لا توجد حصص مجدولة لهذا اليوم
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Column 2: Weekly Attendance Chart ─────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-edutrack-dark flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-edutrack-primary" />
              نسبة الحضور الأسبوعية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyAttendanceChart}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="نسبة الحضور" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {weeklyAttendanceChart.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.rate >= 90
                            ? '#10B981'
                            : entry.rate >= 80
                              ? '#F97316'
                              : entry.rate > 0
                                ? '#EF4444'
                                : '#E2E8F0'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ── Column 3: Absence Alerts ──────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-edutrack-dark flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              تنبيهات الغياب
              {recentAbsences.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5">
                  {recentAbsences.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentAbsences.length > 0 ? (
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {recentAbsences.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50/50 transition-colors cursor-pointer"
                      onClick={() => setCurrentView('teacher-students')}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-edutrack-dark">
                          <span className="font-semibold">{alert.studentName}</span>{' '}
                          غاب عن حصة {alert.subjectName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDateArabic(alert.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  لا توجد غيابات حديثة
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Section 4: Activity Log + Performance Summary
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Activity Log (takes 2 columns) ─────────────────── */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-edutrack-dark flex items-center gap-2">
                <Activity className="h-4 w-4 text-edutrack-primary" />
                سجل الأنشطة
                {recentActivities.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {recentActivities.length}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-edutrack-primary/20 text-edutrack-primary hover:bg-edutrack-primary/5"
                onClick={() => setSheetOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة نشاط
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivities.length > 0 ? (
              <ScrollArea className="max-h-72">
                <div className="space-y-1.5">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 p-1.5 rounded-lg ${
                          activityTypeColors[activity.type] ||
                          'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {activityTypeIcons[activity.type] || <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-edutrack-dark truncate">
                            {activity.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 shrink-0 ${
                              activityTypeColors[activity.type] ||
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            {activityTypeLabels[activity.type] || activity.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {activity.student?.name || '—'} — {activity.section?.name || '—'}
                          </p>
                          {activity.grade !== null && activity.maxGrade !== null && (
                            <span className="text-xs font-bold font-inter text-edutrack-primary">
                              {activity.grade}/{activity.maxGrade}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDateArabic(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  لم تُضاف أي أنشطة بعد
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-edutrack-primary/20 text-edutrack-primary hover:bg-edutrack-primary/5"
                  onClick={() => setSheetOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  أضف أول نشاط
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Performance Summary ──────────────────────────── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-edutrack-dark flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-edutrack-primary" />
              ملخص الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Performance metrics */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-emerald-800">حضور مثالي</span>
                </div>
                <span className="text-sm font-bold font-inter text-emerald-700">
                  {performanceSummary?.perfectAttendanceCount || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-edutrack-primary/5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-edutrack-primary" />
                  <span className="text-xs text-edutrack-dark">أنشطة هذا الشهر</span>
                </div>
                <span className="text-sm font-bold font-inter text-edutrack-primary">
                  {performanceSummary?.activitiesThisMonth || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-800">متوسط العلامات</span>
                </div>
                <span className="text-sm font-bold font-inter text-amber-700">
                  {performanceSummary?.avgGrade || 0}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50/70">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  <span className="text-xs text-sky-800">حصص مكتملة</span>
                </div>
                <span className="text-sm font-bold font-inter text-sky-700">
                  {performanceSummary?.sessionsCompletedThisWeek || 0}/{performanceSummary?.sessionsPlannedThisWeek || 0}
                </span>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground">إجراءات سريعة</p>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1 bg-emerald-50/50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100"
                  onClick={() => setCurrentView('teacher-attendance')}
                >
                  <ClipboardCheck className="h-3 w-3" />
                  الحضور
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1 bg-purple-50/50 text-purple-700 border-purple-200/50 hover:bg-purple-100"
                  onClick={() => setCurrentView('teacher-messages')}
                >
                  <MessageCircle className="h-3 w-3" />
                  المراسلات
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1 bg-sky-50/50 text-sky-700 border-sky-200/50 hover:bg-sky-100"
                  onClick={() => setCurrentView('teacher-students')}
                >
                  <GraduationCap className="h-3 w-3" />
                  التلاميذ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1 bg-amber-50/50 text-amber-700 border-amber-200/50 hover:bg-amber-100"
                  onClick={() => setCurrentView('teacher-absence-request')}
                >
                  <AlertCircle className="h-3 w-3" />
                  إبلاغ غياب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Sheet: Add Activity Form (OUTSIDE the card structure)
          ═══════════════════════════════════════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto" dir="rtl">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-right flex items-center gap-2 text-edutrack-dark">
              <Sparkles className="h-5 w-5 text-edutrack-primary" />
              إضافة نشاط جديد
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {/* Section Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                القسم <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedSectionId}
                onValueChange={(value) => {
                  setSelectedSectionId(value);
                  setSelectedStudentId('');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  {sectionsWithStudents.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name} — {section.yearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                الطالب <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={!selectedSectionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={selectedSectionId ? 'اختر الطالب' : 'اختر القسم أولاً'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {getStudentsForSection().map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity Type Select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                نوع النشاط <span className="text-red-500">*</span>
              </Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر نوع النشاط" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(activityTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {activityTypeIcons[key]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                العنوان <span className="text-red-500">*</span>
              </Label>
              <Input
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="مثال: اختبار الفصل الأول"
                className="text-right"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">الوصف</Label>
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="أضف وصفاً اختيارياً..."
                className="text-right min-h-20"
              />
            </div>

            {/* Grades */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">العلامة</Label>
                <Input
                  type="number"
                  value={activityGrade}
                  onChange={(e) => setActivityGrade(e.target.value)}
                  placeholder="0"
                  className="font-inter text-right"
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">العلامة القصوى</Label>
                <Input
                  type="number"
                  value={activityMaxGrade}
                  onChange={(e) => setActivityMaxGrade(e.target.value)}
                  placeholder="20"
                  className="font-inter text-right"
                  min="0"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleActivitySubmit}
              disabled={submitting}
              className="w-full bg-edutrack-primary hover:bg-edutrack-primary/90 text-white gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الإضافة...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  إضافة النشاط
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
