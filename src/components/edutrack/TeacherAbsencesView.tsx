'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardX, Filter, UserX, Calendar, Send, Plus,
  Search, Check, XCircle, Bell, GraduationCap, BookOpen,
  Loader2, Users, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────
interface AbsenceRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  sessionId: string;
  subjectName: string;
  reason?: string;
  absenceType: string;
  notificationSent: boolean;
  createdAt: string;
  sessionDay: number;
  sessionTime: string;
}

interface StudentOption {
  id: string;
  name: string;
  level: string;
  section: { id: string; name: string; yearName: string } | null;
}

interface SessionOption {
  id: string;
  subjectName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  level: string;
  teacherName: string;
  sectionId?: string;
}

interface SectionOption {
  id: string;
  name: string;
  yearName: string;
  level: string;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// ─── Animation Variants ─────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── Main Component ─────────────────────────────────────────
export default function TeacherAbsencesView() {
  const user = useAppStore((s) => s.user);
  const teacherId = user?.teacherId || '';

  // Data
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [filterSectionId, setFilterSectionId] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Register dialog
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [regStudentId, setRegStudentId] = useState('');
  const [regSessionId, setRegSessionId] = useState('');
  const [regReason, setRegReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Student detail dialog
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState('');

  // ─── Fetch Data ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!teacherId || !user?.institutionId) return;
    setLoading(true);
    try {
      // Fetch students
      const studentsRes = await fetch(`/api/teacher/students?teacherId=${teacherId}`);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        // Flatten grouped students
        const allStudents: StudentOption[] = [];
        const allSections: SectionOption[] = [];
        if (studentsData.grouped) {
          for (const levelSections of Object.values(studentsData.grouped) as Record<string, { sectionInfo: SectionOption; students: StudentOption[] }>[]) {
            for (const group of Object.values(levelSections)) {
              if (group.sectionInfo) {
                allSections.push(group.sectionInfo);
              }
              if (group.students) {
                allStudents.push(...group.students);
              }
            }
          }
        }
        setStudents(allStudents);
        setSections(allSections);
      }

      // Fetch absences
      const absRes = await fetch(`/api/absences?institutionId=${user.institutionId}&absenceType=STUDENT`);
      if (absRes.ok) {
        const absData = await absRes.json();
        setAbsences(absData);
      }

      // Fetch sessions for this teacher
      const sessRes = await fetch(`/api/sessions?teacherId=${teacherId}`);
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(Array.isArray(sessData) ? sessData : (sessData.sessions || []));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [teacherId, user?.institutionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered Absences ────────────────────────────────────
  const filteredAbsences = useMemo(() => {
    let result = absences;

    // Only show absences for students this teacher teaches
    const studentIds = new Set(students.map(s => s.id));
    result = result.filter(a => a.studentId && studentIds.has(a.studentId));

    if (filterStudentId !== 'all') {
      result = result.filter(a => a.studentId === filterStudentId);
    }
    if (filterSectionId !== 'all') {
      const sectionStudentIds = new Set(
        students.filter(s => s.section?.id === filterSectionId).map(s => s.id)
      );
      result = result.filter(a => a.studentId && sectionStudentIds.has(a.studentId));
    }
    if (filterDateFrom) {
      result = result.filter(a => a.createdAt >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(a => a.createdAt <= filterDateTo + 'T23:59:59');
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        (a.studentName && a.studentName.toLowerCase().includes(term)) ||
        a.subjectName.toLowerCase().includes(term)
      );
    }
    return result;
  }, [absences, students, filterStudentId, filterSectionId, filterDateFrom, filterDateTo, searchTerm]);

  // ─── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const studentIds = new Set(students.map(s => s.id));
    const myAbsences = absences.filter(a => a.studentId && studentIds.has(a.studentId));
    const uniqueStudents = new Set(myAbsences.map(a => a.studentId));

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = myAbsences.filter(a => new Date(a.createdAt) >= weekAgo);

    return {
      total: myAbsences.length,
      uniqueStudents: uniqueStudents.size,
      thisWeek: thisWeek.length,
    };
  }, [absences, students]);

  // ─── Student Absence Summary ──────────────────────────────
  const studentAbsenceSummary = useMemo(() => {
    if (!detailStudentId) return null;
    const student = students.find(s => s.id === detailStudentId);
    if (!student) return null;

    const studentAbsences = absences.filter(a => a.studentId === detailStudentId);

    return {
      student,
      totalAbsences: studentAbsences.length,
      absences: studentAbsences.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    };
  }, [detailStudentId, students, absences]);

  // ─── Sessions for selected student ────────────────────────
  const studentSessions = useMemo(() => {
    if (!regStudentId) return [];
    const student = students.find(s => s.id === regStudentId);
    if (!student) return [];
    return sessions.filter(s => s.level === student.level);
  }, [regStudentId, students, sessions]);

  // ─── Register Absence ─────────────────────────────────────
  const handleRegisterAbsence = async () => {
    if (!regStudentId || !regSessionId || !regReason.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: regStudentId,
          sessionId: regSessionId,
          reason: regReason,
          absenceType: 'STUDENT',
        }),
      });

      if (res.ok) {
        const newAbsence = await res.json();
        setAbsences(prev => [newAbsence, ...prev]);
        toast.success('تم تسجيل الغياب وإشعار ولي الأمر تلقائياً');
        setShowRegisterDialog(false);
        setRegStudentId('');
        setRegSessionId('');
        setRegReason('');
      } else {
        toast.error('حدث خطأ أثناء التسجيل');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Open student detail ──────────────────────────────────
  const openStudentDetail = (studentId: string) => {
    setDetailStudentId(studentId);
    setShowStudentDetail(true);
  };

  // ─── Loading State ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24" dir="rtl">
        <Loader2 className="h-10 w-10 text-edutrack-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">جارٍ تحميل بيانات الغيابات...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col gap-4"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-edutrack-dark flex items-center gap-2">
            <ClipboardX className="h-6 w-6 text-amber-500" />
            غيابات التلاميذ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل ومتابعة غيابات تلاميذك
          </p>
        </div>
        <Button
          onClick={() => setShowRegisterDialog(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          تسجيل غياب تلميذ
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: 'إجمالي الغيابات', value: stats.total, icon: <ClipboardX className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100' },
          { label: 'تلاميذ متغيبون', value: stats.uniqueStudents, icon: <Users className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
          { label: 'هذا الأسبوع', value: stats.thisWeek, icon: <Calendar className="h-5 w-5" />, color: 'text-edutrack-primary', bg: 'bg-edutrack-primary/5', iconBg: 'bg-edutrack-primary/10' },
        ].map((stat, i) => (
          <Card key={stat.label} className={`border-0 shadow-sm ${stat.bg}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className={`text-2xl font-bold font-inter ${stat.color}`}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="p-3 border-border/50">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">تصفية:</span>

            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث..."
                className="w-[160px] h-9 text-sm rounded-lg pr-9"
              />
            </div>

            <Select value={filterStudentId} onValueChange={setFilterStudentId}>
              <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg">
                <SelectValue placeholder="التلميذ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التلاميذ</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSectionId} onValueChange={setFilterSectionId}>
              <SelectTrigger className="w-[150px] h-9 text-sm rounded-lg">
                <SelectValue placeholder="القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {sections.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} - {s.yearName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-[140px] h-9 text-sm rounded-lg font-inter"
              dir="ltr"
            />
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-[140px] h-9 text-sm rounded-lg font-inter"
              dir="ltr"
            />
          </div>
        </Card>
      </motion.div>

      {/* Absences Table */}
      <motion.div variants={itemVariants} className="flex-1">
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-auto max-h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right font-semibold">التلميذ</TableHead>
                  <TableHead className="text-right font-semibold">المادة</TableHead>
                  <TableHead className="text-right font-semibold">التاريخ</TableHead>
                  <TableHead className="text-right font-semibold">السبب</TableHead>
                  <TableHead className="text-right font-semibold">الإشعار</TableHead>
                  <TableHead className="text-right font-semibold">تفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbsences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardX className="h-12 w-12 opacity-20" />
                        <p className="text-sm">لا توجد غيابات مسجلة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAbsences.map((absence, i) => (
                    <motion.tr
                      key={absence.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="group hover:bg-muted/30 border-b transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-bold text-white">
                            {absence.studentName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{absence.studentName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-xs">
                          {absence.subjectName}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="text-sm">
                          <span className="font-inter">{new Date(absence.createdAt).toLocaleDateString('ar-DZ')}</span>
                          <br />
                          <span className="text-[11px] text-muted-foreground">
                            {DAYS_AR[absence.sessionDay]} - {absence.sessionTime}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm text-muted-foreground">{absence.reason || '—'}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        {absence.notificationSent ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs gap-1">
                            <Check className="h-3 w-3" />
                            أُرسل
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs gap-1">
                            <XCircle className="h-3 w-3" />
                            لم يُرسل
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => absence.studentId && openStudentDetail(absence.studentId)}
                          className="h-8 px-2 text-xs text-edutrack-primary hover:bg-edutrack-primary/10 rounded-lg gap-1"
                        >
                          <GraduationCap className="h-3 w-3" />
                          سجل التلميذ
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Register Student Absence Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-amber-500" />
              تسجيل غياب تلميذ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">التلميذ</Label>
              <Select value={regStudentId} onValueChange={(v) => { setRegStudentId(v); setRegSessionId(''); }}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر التلميذ" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.level}{s.section ? ` - ${s.section.name}` : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الحصة</Label>
              <Select value={regSessionId} onValueChange={setRegSessionId}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر الحصة" />
                </SelectTrigger>
                <SelectContent>
                  {studentSessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.subjectName} - {DAYS_AR[s.dayOfWeek]} {s.startTime}-{s.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">السبب</Label>
              <Textarea
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                placeholder="أدخل سبب الغياب..."
                className="rounded-lg"
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">سيتم إرسال إشعار تلقائي لولي أمر التلميذ</p>
                <p className="text-blue-600 mt-0.5">سيظهر الغياب أيضاً في لوحة تحكم المدير</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)} className="rounded-lg">
              إلغاء
            </Button>
            <Button
              onClick={handleRegisterAbsence}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              تسجيل وإشعار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Absence Detail Dialog */}
      <Dialog open={showStudentDetail} onOpenChange={setShowStudentDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              سجل غيابات التلميذ
            </DialogTitle>
          </DialogHeader>

          {studentAbsenceSummary && (
            <div className="space-y-4 py-2">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-edutrack-primary" />
                </div>
                <div>
                  <p className="font-bold text-edutrack-dark">{studentAbsenceSummary.student.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{studentAbsenceSummary.student.level}</Badge>
                    {studentAbsenceSummary.student.section && (
                      <Badge variant="outline" className="text-xs">{studentAbsenceSummary.student.section.name}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-inter text-red-600">{studentAbsenceSummary.totalAbsences}</p>
                  <p className="text-[10px] text-red-500 font-medium">إجمالي الغيابات</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold font-inter text-amber-600">
                    {new Set(studentAbsenceSummary.absences.map(a => a.subjectName)).size}
                  </p>
                  <p className="text-[10px] text-amber-500 font-medium">مواد مختلفة</p>
                </div>
              </div>

              {/* Warning if high absence */}
              {studentAbsenceSummary.totalAbsences >= 3 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-800">
                    <p className="font-medium">تنبيه: عدد غيابات مرتفع</p>
                    <p className="text-red-600 mt-0.5">يُنصح بالتواصل مع ولي الأمر</p>
                  </div>
                </div>
              )}

              {/* Absences List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-edutrack-primary" />
                  الحصص المتغيب عنها
                </h4>
                {studentAbsenceSummary.absences.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد غيابات</p>
                ) : (
                  studentAbsenceSummary.absences.map((absence) => (
                    <div key={absence.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-edutrack-dark">{absence.subjectName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {DAYS_AR[absence.sessionDay]} - {absence.sessionTime} | {new Date(absence.createdAt).toLocaleDateString('ar-DZ')}
                        </p>
                        {absence.reason && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">السبب: {absence.reason}</p>
                        )}
                      </div>
                      {absence.notificationSent ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] gap-1">
                          <Check className="h-2.5 w-2.5" />
                          مُبلغ
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] gap-1">
                          <XCircle className="h-2.5 w-2.5" />
                          غير مُبلغ
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
