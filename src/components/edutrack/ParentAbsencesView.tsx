'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardX,
  Calendar,
  BookOpen,
  User,
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────
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

interface DashboardAbsence {
  id: string;
  studentName: string;
  subject: string;
  reason: string | null;
  date: string;
  notificationSent: boolean;
}

interface AbsenceRecord {
  id: string;
  studentId: string;
  studentName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  sessionId: string | null;
  subjectName: string;
  reason: string | null;
  absenceType: string;
  notificationSent: boolean;
  createdAt: string;
  sessionDay: number;
  sessionTime: string;
}

interface DashboardData {
  children: ChildInfo[];
  recentAbsences: DashboardAbsence[];
  attendanceStatus: AttendanceStatusItem[];
}

// ─── Date Formatting Helpers ────────────────────────────────
const arabicDays: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const arabicMonths: Record<number, string> = {
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

function formatFullDateArabic(dateStr: string): string {
  const date = new Date(dateStr);
  const day = arabicDays[date.getDay()];
  const dayNum = date.getDate();
  const month = arabicMonths[date.getMonth() + 1];
  const year = date.getFullYear();
  return `${day} ${dayNum} ${month} ${year}`;
}

function formatTimeArabic(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDateKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// ─── Group absences by date ─────────────────────────────────
interface GroupedAbsences {
  dateKey: string;
  formattedDate: string;
  absences: AbsenceRecord[];
}

function groupAbsencesByDate(absences: AbsenceRecord[]): GroupedAbsences[] {
  const groups: Record<string, AbsenceRecord[]> = {};

  for (const absence of absences) {
    const key = getDateKey(absence.createdAt);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(absence);
  }

  // Sort by date descending
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => ({
    dateKey: key,
    formattedDate: formatFullDateArabic(key),
    absences: groups[key].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  }));
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

const cardVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ─── Loading Skeleton ───────────────────────────────────────
function AbsencesSkeleton() {
  return (
    <div className="px-4 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-36 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {/* Summary Card */}
      <Skeleton className="h-24 rounded-xl" />
      {/* Child Selector */}
      <Skeleton className="h-10 w-full rounded-lg" />
      {/* Absence Items */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function ParentAbsencesView() {
  const user = useAppStore((s) => s.user);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allAbsences, setAllAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  // ─── Fetch Data ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch parent dashboard data
      const dashRes = await fetch(`/api/parent/dashboard?userId=${user.id}`);
      if (!dashRes.ok) throw new Error('فشل في جلب بيانات لوحة التحكم');
      const dashData = await dashRes.json();

      const children: ChildInfo[] = dashData.children || [];
      const recentAbsences: DashboardAbsence[] = dashData.recentAbsences || [];
      const attendanceStatus: AttendanceStatusItem[] = dashData.attendanceStatus || [];

      setDashboardData({ children, recentAbsences, attendanceStatus });

      // Fetch all absences filtered by institution
      if (user.institutionId) {
        const absRes = await fetch(`/api/absences?institutionId=${user.institutionId}&absenceType=STUDENT`);
        if (absRes.ok) {
          const absData: AbsenceRecord[] = await absRes.json();
          // Filter to only include absences for this parent's children
          const childIds = new Set(children.map((c) => c.id));
          const childAbsences = absData.filter((a) => childIds.has(a.studentId));
          setAllAbsences(childAbsences);
        } else {
          // Fallback: use recentAbsences from dashboard
          const mapped: AbsenceRecord[] = recentAbsences.map((a) => ({
            id: a.id,
            studentId: '',
            studentName: a.studentName,
            teacherId: null,
            teacherName: null,
            sessionId: null,
            subjectName: a.subject,
            reason: a.reason,
            absenceType: 'STUDENT',
            notificationSent: a.notificationSent,
            createdAt: a.date,
            sessionDay: 0,
            sessionTime: '',
          }));
          setAllAbsences(mapped);
        }
      } else {
        // No institutionId, use dashboard absences
        const mapped: AbsenceRecord[] = recentAbsences.map((a) => ({
          id: a.id,
          studentId: '',
          studentName: a.studentName,
          teacherId: null,
          teacherName: null,
          sessionId: null,
          subjectName: a.subject,
          reason: a.reason,
          absenceType: 'STUDENT',
          notificationSent: a.notificationSent,
          createdAt: a.date,
          sessionDay: 0,
          sessionTime: '',
        }));
        setAllAbsences(mapped);
      }
    } catch (err) {
      console.error('Error fetching absences data:', err);
      toast.error('فشل في جلب بيانات الغيابات');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.institutionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived Data ─────────────────────────────────────────
  const children = dashboardData?.children || [];
  const attendanceStatus = dashboardData?.attendanceStatus || [];

  // Filter absences by selected child
  const filteredAbsences = useMemo(() => {
    if (selectedChildId === 'all') return allAbsences;
    return allAbsences.filter((a) => a.studentId === selectedChildId);
  }, [allAbsences, selectedChildId]);

  // Group by date
  const groupedAbsences = useMemo(() => groupAbsencesByDate(filteredAbsences), [filteredAbsences]);

  // Stats
  const totalAbsences = filteredAbsences.length;
  const thisMonthCount = filteredAbsences.filter((a) => isThisMonth(a.createdAt)).length;

  // Attendance rate calculation
  const attendanceRate = useMemo(() => {
    if (selectedChildId === 'all') {
      // Aggregate across all children
      const total = attendanceStatus.reduce((s, a) => s + a.totalSessions, 0);
      const present = attendanceStatus.reduce((s, a) => s + a.presentCount + a.lateCount, 0);
      if (total === 0) return 100;
      return Math.round((present / total) * 100);
    } else {
      const status = attendanceStatus.find((a) => a.studentId === selectedChildId);
      if (!status || status.totalSessions === 0) return 100;
      return Math.round(
        ((status.presentCount + status.lateCount) / status.totalSessions) * 100
      );
    }
  }, [attendanceStatus, selectedChildId]);

  const rateColor =
    attendanceRate >= 90 ? 'text-emerald-600' : attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600';
  const rateBg =
    attendanceRate >= 90 ? 'bg-emerald-50' : attendanceRate >= 75 ? 'bg-amber-50' : 'bg-red-50';
  const progressColor =
    attendanceRate >= 90
      ? '[&>div]:bg-emerald-500'
      : attendanceRate >= 75
        ? '[&>div]:bg-amber-500'
        : '[&>div]:bg-red-500';

  // Selected child info
  const selectedChild = children.find((c) => c.id === selectedChildId);

  // ─── Loading State ────────────────────────────────────────
  if (loading) {
    return <AbsencesSkeleton />;
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 pb-6"
      dir="rtl"
    >
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <h1 className="text-xl font-bold text-edutrack-dark flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ClipboardX className="h-5 w-5 text-red-500" />
          </div>
          سجل الغيابات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedChild
            ? `سجل غيابات ${selectedChild.name}${selectedChild.section ? ` - ${selectedChild.section.year.name}` : ''}`
            : 'سجل غيابات جميع الأبناء'}
        </p>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <div className="grid grid-cols-3 gap-3">
          {/* Total Absences */}
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-1.5">
                <ClipboardX className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 font-inter">{totalAbsences}</p>
              <p className="text-[10px] text-red-500 font-medium">إجمالي الغيابات</p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-3 text-center">
              <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-1.5">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 font-inter">{thisMonthCount}</p>
              <p className="text-[10px] text-amber-500 font-medium">هذا الشهر</p>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card className={`border-0 shadow-sm ${rateBg}`}>
            <CardContent className="p-3 text-center">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${
                attendanceRate >= 90 ? 'bg-emerald-100' : attendanceRate >= 75 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {attendanceRate >= 90 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : attendanceRate >= 75 ? (
                  <Clock className="h-4 w-4 text-amber-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className={`text-2xl font-bold font-inter ${rateColor}`}>{attendanceRate}%</p>
              <p className={`text-[10px] font-medium ${rateColor}`}>نسبة الحضور</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Summary Card with Progress ───────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-edutrack-primary" />
                <span className="text-sm font-semibold text-edutrack-dark">نسبة الحضور</span>
              </div>
              <span className={`text-lg font-bold font-inter ${rateColor}`}>
                {attendanceRate}%
              </span>
            </div>
            <Progress
              value={attendanceRate}
              className={`h-2.5 ${progressColor}`}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">0%</span>
              <span className="text-[10px] text-muted-foreground">
                {attendanceRate >= 90
                  ? 'ممتاز - استمرار ممتاز'
                  : attendanceRate >= 75
                    ? 'مقبول - يحتاج تحسين'
                    : 'ضعيف - يتطلب اهتماماً'}
              </span>
              <span className="text-[10px] text-muted-foreground">100%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Child Filter Selector ────────────────────────── */}
      {children.length > 1 && (
        <motion.div variants={itemVariants} className="mb-5">
          <Select
            value={selectedChildId}
            onValueChange={setSelectedChildId}
          >
            <SelectTrigger className="w-full border-gray-200 bg-white">
              <User className="h-4 w-4 text-muted-foreground ml-2" />
              <SelectValue placeholder="اختر الابن" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأبناء</SelectItem>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                  {child.section ? ` - ${child.section.year.name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* ── Timeline Absence List ────────────────────────── */}
      <motion.div variants={itemVariants}>
        {groupedAbsences.length > 0 ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-5">
                <AnimatePresence mode="popLayout">
                  {groupedAbsences.map((group, groupIndex) => (
                    <motion.div
                      key={group.dateKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                    >
                      {/* Date Header */}
                      <div className="relative pr-10 mb-3">
                        <div className="absolute right-[11px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-edutrack-primary flex items-center justify-center z-10">
                          <Calendar className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-edutrack-primary/5 rounded-lg px-3 py-1.5 inline-block">
                          <p className="text-xs font-bold text-edutrack-primary">
                            {group.formattedDate}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] mr-2 h-5 px-1.5">
                          {group.absences.length} غياب
                        </Badge>
                      </div>

                      {/* Absence Cards for this date */}
                      <div className="space-y-2">
                        {group.absences.map((absence, index) => (
                          <motion.div
                            key={absence.id}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{
                              delay: groupIndex * 0.05 + index * 0.04,
                              duration: 0.3,
                            }}
                            className="relative pr-10"
                          >
                            {/* Timeline Dot */}
                            <div className="absolute right-[13px] top-4 h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow-sm z-10" />

                            <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300">
                              <CardContent className="p-4">
                                {/* Subject & Time Row */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-edutrack-primary" />
                                    <p className="text-sm font-semibold text-edutrack-dark">
                                      {absence.subjectName || 'غير محدد'}
                                    </p>
                                  </div>
                                  {absence.sessionTime && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-xs font-inter">{absence.sessionTime}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Teacher Name (if available) */}
                                {absence.teacherName && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      {absence.teacherName}
                                    </p>
                                  </div>
                                )}

                                {/* Student Name (when showing all children) */}
                                {selectedChildId === 'all' && absence.studentName && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                      {absence.studentName}
                                    </p>
                                  </div>
                                )}

                                {/* Reason */}
                                <div className="mb-3">
                                  <p className="text-xs text-muted-foreground">
                                    {absence.reason || 'بدون سبب'}
                                  </p>
                                </div>

                                {/* Notification Status */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    {absence.notificationSent ? (
                                      <>
                                        <Bell className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-medium">
                                          تم إعلامك
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <BellOff className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-xs text-amber-600 font-medium">
                                          لم يتم إعلامك
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-inter">
                                    {formatTimeArabic(absence.createdAt)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>
        ) : (
          /* ── Empty State ─────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-center py-16"
          >
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-edutrack-dark">لا توجد غيابات</p>
            <p className="text-sm text-muted-foreground mt-1">
              حضور {selectedChild ? selectedChild.name : 'ابنك'} ممتاز هذا الشهر!
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
