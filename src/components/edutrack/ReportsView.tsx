'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  CalendarDays,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  GraduationCap,
  BookOpen,
  Receipt,
  Bell,
  FileText,
  Loader2,
  ArrowUpLeft,
  ArrowDownLeft,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
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

const months = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

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

// ─── Mock Data for Reports ──────────────────────────────────────────────

const dailyMock = {
  sessionsCompleted: 8,
  sessionsCancelled: 1,
  sessionsCompensated: 1,
  studentAbsences: [
    { id: '1', name: 'أمين حسين', subject: 'الرياضيات', time: '08:00' },
    { id: '2', name: 'سارة حسين', subject: 'الفيزياء', time: '10:00' },
    { id: '3', name: 'ياسين مراد', subject: 'الفرنسية', time: '14:00' },
  ],
  teacherAbsences: [
    { id: '1', name: 'الأستاذ محمد العربي', subject: 'الرياضيات', reason: 'مرضي' },
  ],
  notificationsSent: 5,
};

const monthlyMock = {
  totalSessions: 56,
  attendanceRate: 87,
  revenue: 1560000,
  paidInvoices: 12,
  pendingInvoices: 3,
  previousMonth: {
    totalSessions: 52,
    attendanceRate: 84,
    revenue: 1480000,
    paidInvoices: 10,
    pendingInvoices: 5,
  },
};

const attendanceHistoryData = [
  { month: 'جانفي', rate: 92 },
  { month: 'فيفري', rate: 88 },
  { month: 'مارس', rate: 85 },
  { month: 'أفريل', rate: 90 },
  { month: 'ماي', rate: 82 },
  { month: 'جوان', rate: 87 },
];

const studentReportMock = {
  studentName: 'أمين حسين',
  level: 'ثانوي',
  lowAttendanceSubjects: [
    { name: 'الفيزياء', rate: 72 },
    { name: 'الرياضيات', rate: 68 },
  ],
  absencesTimeline: [
    { date: '2025-01-05', subject: 'الرياضيات', status: 'غير مبرر' },
    { date: '2025-01-12', subject: 'الفيزياء', status: 'مبرر' },
    { date: '2025-01-19', subject: 'الرياضيات', status: 'غير مبرر' },
    { date: '2025-02-02', subject: 'الفرنسية', status: 'مبرر' },
    { date: '2025-02-16', subject: 'الفيزياء', status: 'غير مبرر' },
  ],
};

const teacherReportMock = {
  teacherName: 'الأستاذ محمد العربي',
  sessionsCompleted: 22,
  sessionsAbsent: 2,
  levelsTaught: ['ثانوي', 'متوسط'],
  subjects: ['الرياضيات'],
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

function ComparisonBadge({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  const diff = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : '0';
  const isUp = current >= previous;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
      {isUp ? <ArrowUpLeft className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
      <span className="font-inter">{Math.abs(parseFloat(diff))}%{suffix}</span>
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 text-right" dir="rtl">
      <p className="text-xs font-semibold text-edutrack-dark mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full ml-1" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-edutrack-dark font-inter">{p.value}%</span>
        </p>
      ))}
    </div>
  );
}

export default function ReportsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);

  // Daily report
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Monthly report
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Student report
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Teacher report
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Data lists
  const [studentsList, setStudentsList] = useState<{ id: string; name: string }[]>([]);
  const [teachersList, setTeachersList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchLists = async () => {
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          fetch(`/api/students?institutionId=${institutionId}&limit=100`),
          fetch(`/api/teachers?institutionId=${institutionId}`),
        ]);

        if (cancelled) return;

        if (studentsRes.ok) {
          const data = await studentsRes.json();
          if (!cancelled) setStudentsList(data.students.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
        }
        if (teachersRes.ok) {
          const data = await teachersRes.json();
          if (!cancelled) setTeachersList(data.teachers.map((t: { id: string; user: { name: string } }) => ({ id: t.id, name: t.user.name })));
        }
      } catch {
        // silently ignore
      }
    };
    fetchLists();
    return () => { cancelled = true; };
  }, [institutionId]);

  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('تم إنشاء التقرير بنجاح');
    }, 1000);
  };

  const handleExportPdf = () => {
    toast.success('جاري تحضير ملف PDF للتحميل...');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-edutrack-primary" />
            </div>
            التقارير
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">تقارير وإحصائيات المؤسسة</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <FileText className="h-4 w-4 ml-2" />}
            إنشاء تقرير
          </Button>
          <Button
            onClick={handleExportPdf}
            variant="outline"
            className="h-10 border-edutrack-primary/20 text-edutrack-primary hover:bg-edutrack-primary/5"
          >
            <Download className="h-4 w-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </motion.div>

      {/* Report Type Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-gray-100 h-12 p-1 rounded-xl">
            <TabsTrigger value="daily" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <CalendarDays className="h-4 w-4 ml-1.5" />
              يومي
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 ml-1.5" />
              شهري
            </TabsTrigger>
            <TabsTrigger value="student" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <GraduationCap className="h-4 w-4 ml-1.5" />
              تلميذ
            </TabsTrigger>
            <TabsTrigger value="teacher" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <Users className="h-4 w-4 ml-1.5" />
              أستاذ
            </TabsTrigger>
          </TabsList>

          {/* ─── Daily Report ─────────────────────────────────────────────── */}
          <TabsContent value="daily">
            <AnimatePresence mode="wait">
              <motion.div
                key="daily"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Date selector */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">تاريخ التقرير</Label>
                      <div className="relative max-w-xs">
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="pr-10 h-10 font-inter"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">حصص مكتملة</p>
                          <p className="text-2xl font-bold text-emerald-600 font-inter">{dailyMock.sessionsCompleted}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">حصص ملغاة</p>
                          <p className="text-2xl font-bold text-red-600 font-inter">{dailyMock.sessionsCancelled}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                          <XCircle className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">حصص تعويضية</p>
                          <p className="text-2xl font-bold text-edutrack-primary font-inter">{dailyMock.sessionsCompensated}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                          <Clock className="h-6 w-6 text-edutrack-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Absences Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Student Absences */}
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-red-500" />
                        غيابات التلاميذ
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600 bg-red-50 font-inter">
                          {dailyMock.studentAbsences.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dailyMock.studentAbsences.map((absence) => (
                          <div key={absence.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-edutrack-dark">{absence.name}</p>
                              <p className="text-xs text-muted-foreground">{absence.subject}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 font-inter">
                              {absence.time}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Teacher Absences */}
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-500" />
                        غيابات الأساتذة
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 font-inter">
                          {dailyMock.teacherAbsences.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dailyMock.teacherAbsences.map((absence) => (
                          <div key={absence.id} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-edutrack-dark">{absence.name}</p>
                              <p className="text-xs text-muted-foreground">{absence.subject} — {absence.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notifications */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-edutrack-secondary/10 flex items-center justify-center">
                          <Bell className="h-6 w-6 text-edutrack-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الإشعارات المرسلة اليوم</p>
                          <p className="text-2xl font-bold text-edutrack-dark font-inter">{dailyMock.notificationsSent}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Monthly Report ─────────────────────────────────────────────── */}
          <TabsContent value="monthly">
            <AnimatePresence mode="wait">
              <motion.div
                key="monthly"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Month selector */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">الشهر</Label>
                      <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                        <SelectTrigger className="w-[130px] h-10 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px] h-10 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2025, 2026, 2027].map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">إجمالي الحصص</p>
                          <p className="text-2xl font-bold text-edutrack-dark font-inter">{monthlyMock.totalSessions}</p>
                        </div>
                        <div className="text-left">
                          <ComparisonBadge current={monthlyMock.totalSessions} previous={monthlyMock.previousMonth.totalSessions} />
                          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center mt-1">
                            <BookOpen className="h-5 w-5 text-edutrack-primary" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">نسبة الحضور</p>
                          <p className="text-2xl font-bold text-emerald-600 font-inter">{monthlyMock.attendanceRate}%</p>
                        </div>
                        <div className="text-left">
                          <ComparisonBadge current={monthlyMock.attendanceRate} previous={monthlyMock.previousMonth.attendanceRate} />
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mt-1">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">الإيرادات</p>
                          <p className="text-xl font-bold text-edutrack-secondary font-inter">{formatAmount(monthlyMock.revenue)}</p>
                        </div>
                        <div className="text-left">
                          <ComparisonBadge current={monthlyMock.revenue} previous={monthlyMock.previousMonth.revenue} />
                          <div className="h-10 w-10 rounded-xl bg-edutrack-secondary/10 flex items-center justify-center mt-1">
                            <Receipt className="h-5 w-5 text-edutrack-secondary" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">الفواتير المدفوعة</p>
                          <p className="text-2xl font-bold text-edutrack-primary font-inter">{monthlyMock.paidInvoices} <span className="text-sm text-muted-foreground">/ {monthlyMock.paidInvoices + monthlyMock.pendingInvoices}</span></p>
                        </div>
                        <div className="text-left">
                          <ComparisonBadge current={monthlyMock.paidInvoices} previous={monthlyMock.previousMonth.paidInvoices} />
                          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center mt-1">
                            <Receipt className="h-5 w-5 text-edutrack-primary" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Student Report ─────────────────────────────────────────────── */}
          <TabsContent value="student">
            <AnimatePresence mode="wait">
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Student selector */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">التلميذ</Label>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger className="w-full sm:max-w-xs h-10 bg-gray-50 border-gray-200">
                          <SelectValue placeholder="اختر تلميذ" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentsList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {selectedStudentId && (
                  <>
                    {/* Attendance Chart */}
                    <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-edutrack-primary" />
                          سجل الحضور
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceHistoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line
                                type="monotone"
                                dataKey="rate"
                                name="نسبة الحضور"
                                stroke="#1A56DB"
                                strokeWidth={3}
                                dot={{ r: 5, fill: '#1A56DB', stroke: '#fff', strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: '#1A56DB', stroke: '#fff', strokeWidth: 2 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Low attendance subjects */}
                      <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            مواد بحضور ضعيف
                            <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50">
                              أقل من 80%
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {studentReportMock.lowAttendanceSubjects.map((subject) => (
                              <div key={subject.name} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-edutrack-dark">{subject.name}</span>
                                  <span className="text-sm font-bold text-red-600 font-inter">{subject.rate}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${subject.rate >= 80 ? 'bg-emerald-500' : subject.rate >= 70 ? 'bg-orange-500' : 'bg-red-500'}`}
                                    style={{ width: `${subject.rate}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Absences timeline */}
                      <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                            <Clock className="h-5 w-5 text-red-500" />
                            سجل الغيابات
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {studentReportMock.absencesTimeline.map((absence, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-edutrack-dark">{absence.subject}</p>
                                  <p className="text-xs text-muted-foreground font-inter">{absence.date}</p>
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${absence.status === 'مبرر' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                  {absence.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Teacher Report ─────────────────────────────────────────────── */}
          <TabsContent value="teacher">
            <AnimatePresence mode="wait">
              <motion.div
                key="teacher"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Teacher selector */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">الأستاذ</Label>
                      <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger className="w-full sm:max-w-xs h-10 bg-gray-50 border-gray-200">
                          <SelectValue placeholder="اختر أستاذ" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachersList.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {selectedTeacherId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">حصص مكتملة</p>
                            <p className="text-2xl font-bold text-emerald-600 font-inter">{teacherReportMock.sessionsCompleted}</p>
                          </div>
                          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">حصص غائبة</p>
                            <p className="text-2xl font-bold text-red-600 font-inter">{teacherReportMock.sessionsAbsent}</p>
                          </div>
                          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">المستويات</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {teacherReportMock.levelsTaught.map((level) => (
                                <Badge key={level} variant="outline" className="text-xs bg-edutrack-primary/5 text-edutrack-primary border-edutrack-primary/10">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-edutrack-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sessions chart */}
                    <Card className="border-0 shadow-md shadow-gray-100/80 bg-white sm:col-span-2 lg:col-span-3">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-edutrack-primary" />
                          الحصص المكتملة vs الغائبة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: 'الرياضيات', completed: 18, absent: 2 },
                                { name: 'الفيزياء', completed: 15, absent: 1 },
                                { name: 'العلوم', completed: 12, absent: 3 },
                              ]}
                              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="completed" name="مكتملة" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                {([18, 15, 12]).map((_, i) => (
                                  <Cell key={i} fill="#1A56DB" />
                                ))}
                              </Bar>
                              <Bar dataKey="absent" name="غائبة" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                {([2, 1, 3]).map((_, i) => (
                                  <Cell key={i} fill="#EF4444" />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
