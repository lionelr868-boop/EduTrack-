'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronDown,
  GraduationCap,
  FileText,
  PenLine,
  BarChart3,
  Activity,
  Loader2,
  Eye,
  Zap,
  MessageCircle,
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
  status: 'upcoming' | 'done' | 'cancelled';
}

interface SupervisedSection {
  id: string;
  name: string;
  yearName: string;
  level: string;
  studentCount: number;
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
  };
  weeklyAttendanceChart: { day: string; rate: number }[];
  recentAbsences: AbsenceAlert[];
  supervisedSections: SupervisedSection[];
  sectionsWithStudents: SectionWithStudents[];
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
const statusConfig = {
  done: {
    label: 'منجزة',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    dotColor: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  upcoming: {
    label: 'قادمة',
    color: 'text-sky-700',
    bgColor: 'bg-sky-50 border-sky-200',
    dotColor: 'bg-sky-500',
    icon: <Clock className="h-4 w-4" />,
  },
  cancelled: {
    label: 'ملغاة',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    dotColor: 'bg-red-500',
    icon: <XCircle className="h-4 w-4" />,
  },
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

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ─── Loading Skeleton ──────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function TeacherDashboard() {
  const user = useAppStore((s) => s.user);
  const setCurrentView = useAppStore((s) => s.setCurrentView);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity form state
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityGrade, setActivityGrade] = useState('');
  const [activityMaxGrade, setActivityMaxGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Supervised sections expandable
  const [sectionsExpanded, setSectionsExpanded] = useState(true);

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
      setSelectedStudentId('');
      setActivityType('');
      setActivityTitle('');
      setActivityDescription('');
      setActivityGrade('');
      setActivityMaxGrade('');
      setActivityFormOpen(false);

      // Refresh activities
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
  } = dashboardData;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* ── Welcome Section ─────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'الأستاذ'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إليك ملخص نشاطك اليوم — مادة {teacher.subjectName}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
        >
          <CalendarDays className="h-3.5 w-3.5 ml-1.5" />
          {todayDate}
        </Badge>
      </motion.div>

      {/* ── Today's Sessions ─────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-edutrack-dark mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-edutrack-primary" />
          حصص اليوم
          {todaySessions.length > 0 && (
            <Badge variant="secondary" className="text-xs mr-1">
              {todaySessions.length}
            </Badge>
          )}
        </h2>
        {todaySessions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todaySessions.map((session, index) => {
              const status = statusConfig[session.status];
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.1 + index * 0.08,
                    ease: 'easeOut',
                  }}
                >
                  <Card
                    className={`border overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer ${status.bgColor}`}
                  >
                    <div
                      className={`h-1 ${
                        session.status === 'done'
                          ? 'bg-emerald-500'
                          : session.status === 'upcoming'
                            ? 'bg-sky-500'
                            : 'bg-red-500'
                      }`}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${status.dotColor}`}
                          />
                          <h3 className="font-bold text-edutrack-dark">
                            {session.subjectName}
                          </h3>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${status.bgColor} ${status.color} border text-[10px] gap-1 px-1.5 py-0.5`}
                        >
                          {status.icon}
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-inter">
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {session.sectionName} {session.yearName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                لا توجد حصص مجدولة لهذا اليوم
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* ── Quick Stats ──────────────────────────────────── */}
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
                    <p className="text-sm text-muted-foreground mb-1">
                      حضور هذا الأسبوع
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 font-inter">
                      {stats.weeklyAttendanceRate}%
                    </p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {stats.weeklyAttendanceRate >= 90
                        ? 'معدل ممتاز'
                        : stats.weeklyAttendanceRate >= 80
                          ? 'معدل جيد'
                          : stats.weeklyAttendanceRate > 0
                            ? 'يحتاج تحسين'
                            : 'لا توجد بيانات'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sessions Without Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border border-amber-200 hover:shadow-md transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      حصص لم يُسجّل الحضور
                    </p>
                    <p className="text-3xl font-bold text-amber-600 font-inter">
                      {stats.sessionsWithoutAttendance}
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                      {stats.sessionsWithoutAttendance > 0
                        ? 'تحتاج تسجيل'
                        : 'كل الحصص مسجّلة'}
                    </p>
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
                    <p className="text-sm text-muted-foreground mb-1">
                      إجمالي الطلاب
                    </p>
                    <p className="text-3xl font-bold text-edutrack-primary font-inter">
                      {stats.totalStudents}
                    </p>
                    <p className="text-xs text-edutrack-primary/70 mt-1">
                      في الأقسام المشرفة
                    </p>
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

      {/* ── Quick Actions ──────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-edutrack-dark mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-edutrack-primary" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'تسجيل الحضور', icon: <ClipboardCheck className="h-5 w-5" />, view: 'teacher-attendance' as ViewType, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            { label: 'المراسلات', icon: <MessageCircle className="h-5 w-5" />, view: 'teacher-messages' as ViewType, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'تلاميذي', icon: <GraduationCap className="h-5 w-5" />, view: 'teacher-students' as ViewType, color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { label: 'إبلاغ غياب', icon: <AlertCircle className="h-5 w-5" />, view: 'teacher-absence-request' as ViewType, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          ].map((action, index) => (
            <motion.div
              key={action.view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card
                className={`border cursor-pointer hover:shadow-md transition-all duration-300 ${action.color}`}
                onClick={() => setCurrentView(action.view)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/60 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <span className="text-sm font-semibold">{action.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Main Content Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column ──────────────────────────────── */}
        <div className="space-y-6">
          {/* ── My Supervised Sections ──────────────────── */}
          <motion.div variants={itemVariants}>
            <Collapsible
              open={sectionsExpanded}
              onOpenChange={setSectionsExpanded}
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-edutrack-primary" />
                        أقسامي المشرفة
                        <Badge variant="secondary" className="text-xs">
                          {supervisedSections.length}
                        </Badge>
                      </CardTitle>
                      <motion.div
                        animate={{ rotate: sectionsExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    {supervisedSections.length > 0 ? (
                      <ScrollArea className="max-h-64">
                        <div className="space-y-2">
                          {supervisedSections.map((section, index) => (
                            <motion.div
                              key={section.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div>
                                <p className="text-sm font-semibold text-edutrack-dark">
                                  {section.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {section.yearName} — {section.level}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium text-edutrack-primary font-inter">
                                  {section.studentCount}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد أقسام مشرفة حالياً
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>

          {/* ── Student Activity Form ───────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow border-edutrack-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                    <Plus className="h-5 w-5 text-edutrack-primary" />
                    إضافة نشاط طالب
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityFormOpen(!activityFormOpen)}
                    className="gap-1 text-xs"
                  >
                    <motion.div
                      animate={{ rotate: activityFormOpen ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </motion.div>
                    {activityFormOpen ? 'إغلاق' : 'فتح النموذج'}
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {activityFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-4">
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
                                <SelectItem
                                  key={section.id}
                                  value={section.id}
                                >
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
                                placeholder={
                                  selectedSectionId
                                    ? 'اختر الطالب'
                                    : 'اختر القسم أولاً'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {getStudentsForSection().map((student) => (
                                <SelectItem
                                  key={student.id}
                                  value={student.id}
                                >
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
                          <Select
                            value={activityType}
                            onValueChange={setActivityType}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر نوع النشاط" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(activityTypeLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      {activityTypeIcons[key]}
                                      {label}
                                    </div>
                                  </SelectItem>
                                )
                              )}
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
                            onChange={(e) =>
                              setActivityDescription(e.target.value)
                            }
                            placeholder="أضف وصفاً اختيارياً..."
                            className="text-right min-h-20"
                          />
                        </div>

                        {/* Grades */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium">
                              العلامة
                            </Label>
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
                            <Label className="text-sm font-medium">
                              العلامة القصوى
                            </Label>
                            <Input
                              type="number"
                              value={activityMaxGrade}
                              onChange={(e) =>
                                setActivityMaxGrade(e.target.value)
                              }
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
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* ── Recent Absence Alerts ───────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  تنبيهات الغياب الأخيرة
                  {recentAbsences.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {recentAbsences.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentAbsences.length > 0 ? (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-1">
                      {recentAbsences.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.5 + index * 0.05,
                          }}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-red-50/50 transition-colors group"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-edutrack-dark leading-relaxed">
                              <span className="font-semibold">
                                {alert.studentName}
                              </span>{' '}
                              غاب عن حصة {alert.subjectName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDateArabic(alert.date)}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <XCircle className="h-4 w-4 text-red-500" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      لا توجد غيابات حديثة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── Right Column ─────────────────────────────── */}
        <div className="space-y-6">
          {/* ── Weekly Attendance Chart ──────────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-edutrack-primary" />
                  نسبة الحضور الأسبوعية
                </CardTitle>
                <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyAttendanceChart}
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
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="rate"
                        name="نسبة الحضور"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={40}
                      >
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
          </motion.div>

          {/* ── Recent Student Activities ───────────────── */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                    <Activity className="h-5 w-5 text-edutrack-primary" />
                    آخر النشاطات
                  </CardTitle>
                  {recentActivities.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-edutrack-primary/20 text-edutrack-primary"
                    >
                      {recentActivities.length} نشاط
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {recentActivities.length > 0 ? (
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {recentActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group"
                        >
                          <div
                            className={`flex-shrink-0 p-1.5 rounded-lg ${
                              activityTypeColors[activity.type] ||
                              'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {activityTypeIcons[activity.type] || (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
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
                                {activityTypeLabels[activity.type] ||
                                  activity.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {activity.student?.name || '—'} —{' '}
                              {activity.section?.name || '—'}
                            </p>
                            {activity.grade !== null &&
                              activity.maxGrade !== null && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs font-bold font-inter text-edutrack-primary">
                                    {activity.grade}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-inter">
                                    / {activity.maxGrade}
                                  </span>
                                </div>
                              )}
                          </div>
                          <div className="flex-shrink-0">
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatDateArabic(activity.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      لم تُضاف أي نشاطات بعد
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setActivityFormOpen(true)}
                      className="text-edutrack-primary mt-1"
                    >
                      أضف أول نشاط
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
