'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  DEMO_ABSENCES, DEMO_SESSIONS, DEMO_TEACHERS, DEMO_STUDENTS,
  DAYS_AR, getSubjectColor, DemoAbsence,
} from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardCheck, Filter, UserX, Calendar, Send, RefreshCw,
  Download, FileSpreadsheet, FileText, AlertTriangle, Plus,
  MoreVertical, Search, Check, XCircle, Bell, BellOff, GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AbsencesView() {
  const user = useAppStore((s) => s.user);
  const [absences, setAbsences] = useState<DemoAbsence[]>(DEMO_ABSENCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterNotification, setFilterNotification] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showStudentRegisterDialog, setShowStudentRegisterDialog] = useState(false);
  const [showCompensateDialog, setShowCompensateDialog] = useState(false);
  const [compensateAbsence, setCompensateAbsence] = useState<DemoAbsence | null>(null);

  // Fetch absences from API on mount
  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const res = await fetch('/api/absences');
        if (res.ok) {
          const data = await res.json();
          setAbsences(data);
        }
      } catch (error) {
        console.error('Failed to fetch absences:', error);
      }
    };
    fetchAbsences();
  }, []);

  // Register form state
  const [regTeacherId, setRegTeacherId] = useState('');
  const [regSessionId, setRegSessionId] = useState('');
  const [regReason, setRegReason] = useState('');

  // Register student form state
  const [regStudentId, setRegStudentId] = useState('');
  const [regStudentSessionId, setRegStudentSessionId] = useState('');
  const [regStudentReason, setRegStudentReason] = useState('');
  const [regCompensateDay, setRegCompensateDay] = useState('0');
  const [regCompensateTime, setRegCompensateTime] = useState('08:00');
  const [regCompensateEndTime, setRegCompensateEndTime] = useState('09:30');

  // Filter absences
  const filteredAbsences = useMemo(() => {
    let result = absences;
    if (filterType !== 'all') result = result.filter(a => a.absenceType === filterType);
    if (filterSubject !== 'all') result = result.filter(a => a.subjectName === filterSubject);
    if (filterNotification !== 'all') {
      const sent = filterNotification === 'sent';
      result = result.filter(a => a.notificationSent === sent);
    }
    if (filterDateFrom) result = result.filter(a => a.createdAt >= filterDateFrom);
    if (filterDateTo) result = result.filter(a => a.createdAt <= filterDateTo + 'T23:59:59');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        (a.studentName && a.studentName.toLowerCase().includes(term)) ||
        (a.teacherName && a.teacherName.toLowerCase().includes(term)) ||
        a.subjectName.toLowerCase().includes(term)
      );
    }
    return result;
  }, [absences, filterType, filterSubject, filterNotification, filterDateFrom, filterDateTo, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const studentAbsences = absences.filter(a => a.absenceType === 'STUDENT');
    const teacherAbsences = absences.filter(a => a.absenceType === 'TEACHER');
    const unnotified = absences.filter(a => !a.notificationSent);
    return {
      total: absences.length,
      students: studentAbsences.length,
      teachers: teacherAbsences.length,
      unnotified: unnotified.length,
    };
  }, [absences]);

  // Get sessions for selected teacher
  const teacherSessions = useMemo(() => {
    if (!regTeacherId) return [];
    return DEMO_SESSIONS.filter(s => s.teacherId === regTeacherId && s.status === 'SCHEDULED');
  }, [regTeacherId]);

  // Get sessions for selected student based on their level
  const studentSessions = useMemo(() => {
    if (!regStudentId) return [];
    const student = DEMO_STUDENTS.find(s => s.id === regStudentId);
    if (!student) return [];
    return DEMO_SESSIONS.filter(s => s.level === student.level && s.status === 'SCHEDULED');
  }, [regStudentId]);

  // Unique subjects for filter
  const uniqueSubjects = [...new Set(DEMO_ABSENCES.map(a => a.subjectName))];

  // Resend notification
  const handleResendNotification = (absence: DemoAbsence) => {
    setAbsences(prev => prev.map(a =>
      a.id === absence.id ? { ...a, notificationSent: true } : a
    ));
    toast.success('تم إعادة إرسال الإشعار بنجاح');
  };

  // Register teacher absence
  const handleRegisterAbsence = async () => {
    if (!regTeacherId || !regSessionId || !regReason.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: regTeacherId,
          sessionId: regSessionId,
          reason: regReason,
          absenceType: 'TEACHER',
        }),
      });

      if (res.ok) {
        const newAbsence = await res.json();
        setAbsences(prev => [newAbsence, ...prev]);
        toast.success('تم تسجيل غياب الأستاذ وإشعار أولياء الأمور');
        setShowRegisterDialog(false);
        setRegTeacherId('');
        setRegSessionId('');
        setRegReason('');
      } else {
        toast.error('حدث خطأ أثناء التسجيل');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Register student absence
  const handleRegisterStudentAbsence = async () => {
    if (!regStudentId || !regStudentSessionId || !regStudentReason.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: regStudentId,
          sessionId: regStudentSessionId,
          reason: regStudentReason,
          absenceType: 'STUDENT',
        }),
      });

      if (res.ok) {
        const newAbsence = await res.json();
        setAbsences(prev => [newAbsence, ...prev]);
        toast.success('تم تسجيل غياب التلميذ وإشعار ولي الأمر');
        setShowStudentRegisterDialog(false);
        setRegStudentId('');
        setRegStudentSessionId('');
        setRegStudentReason('');
      } else {
        toast.error('حدث خطأ أثناء التسجيل');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال بالخادم');
    }
  };

  // Export handlers (demo)
  const handleExportPDF = () => {
    toast.success('جاري تصدير التقرير بصيغة PDF...');
  };

  const handleExportExcel = () => {
    toast.success('جاري تصدير التقرير بصيغة Excel...');
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-edutrack-dark flex items-center gap-2">
            <UserX className="h-6 w-6 text-edutrack-primary" />
            إدارة الغيابات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة وتسجيل غيابات التلاميذ والأساتذة
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="rounded-xl gap-2 text-sm"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="rounded-xl gap-2 text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={() => setShowStudentRegisterDialog(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            تسجيل غياب تلميذ
          </Button>
          <Button
            onClick={() => setShowRegisterDialog(true)}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/25 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            تسجيل غياب أستاذ
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي الغيابات', value: stats.total, icon: <ClipboardCheck className="h-5 w-5" />, color: 'text-edutrack-primary', bg: 'bg-edutrack-primary/10' },
          { label: 'غيابات التلاميذ', value: stats.students, icon: <UserX className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'غيابات الأساتذة', value: stats.teachers, icon: <Calendar className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'إشعارات غير مرسلة', value: stats.unnotified, icon: <BellOff className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="font-inter text-2xl font-bold text-edutrack-dark">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
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

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="STUDENT">تلميذ</SelectItem>
              <SelectItem value="TEACHER">أستاذ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[130px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="المادة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {uniqueSubjects.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterNotification} onValueChange={setFilterNotification}>
            <SelectTrigger className="w-[150px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="حالة الإشعار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="sent">أُرسل الإشعار</SelectItem>
              <SelectItem value="not-sent">لم يُرسل</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-[140px] h-9 text-sm rounded-lg font-inter"
            dir="ltr"
            placeholder="من تاريخ"
          />
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-[140px] h-9 text-sm rounded-lg font-inter"
            dir="ltr"
            placeholder="إلى تاريخ"
          />
        </div>
      </Card>

      {/* Absences Table */}
      <Card className="flex-1 border-border/50 overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-semibold">التلميذ/الأستاذ</TableHead>
                <TableHead className="text-right font-semibold">المادة</TableHead>
                <TableHead className="text-right font-semibold">التاريخ</TableHead>
                <TableHead className="text-right font-semibold">السبب</TableHead>
                <TableHead className="text-right font-semibold">حالة الإشعار</TableHead>
                <TableHead className="text-right font-semibold">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredAbsences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardCheck className="h-12 w-12 opacity-20" />
                        <p className="text-sm">لا توجد غيابات مسجلة</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAbsences.map((absence, i) => {
                    const color = getSubjectColor(absence.subjectName);
                    return (
                      <motion.tr
                        key={absence.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-muted/30 border-b transition-colors"
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                              absence.absenceType === 'STUDENT' ? 'bg-amber-500' : 'bg-purple-500'
                            }`}>
                              {absence.absenceType === 'STUDENT'
                                ? absence.studentName?.charAt(0)
                                : absence.teacherName?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {absence.absenceType === 'STUDENT' ? absence.studentName : absence.teacherName}
                              </p>
                              <Badge variant="secondary" className={`text-[10px] h-4 px-1 ${
                                absence.absenceType === 'STUDENT' ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                {absence.absenceType === 'STUDENT' ? 'تلميذ' : 'أستاذ'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`${color.light} ${color.text} ${color.border} border text-xs`}>
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
                          <p className="text-sm text-muted-foreground">
                            {absence.reason || '—'}
                          </p>
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
                          <div className="flex items-center gap-1">
                            {!absence.notificationSent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendNotification(absence)}
                                className="h-8 px-2 text-xs text-edutrack-primary hover:bg-edutrack-primary/10 rounded-lg gap-1"
                              >
                                <RefreshCw className="h-3 w-3" />
                                إعادة إرسال
                              </Button>
                            )}
                            {absence.absenceType === 'TEACHER' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCompensateAbsence(absence);
                                  setShowCompensateDialog(true);
                                }}
                                className="h-8 px-2 text-xs text-purple-600 hover:bg-purple-50 rounded-lg gap-1"
                              >
                                <Calendar className="h-3 w-3" />
                                تعويض
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Register Teacher Absence Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <UserX className="h-5 w-5 text-edutrack-primary" />
              تسجيل غياب أستاذ
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">الأستاذ</Label>
              <Select value={regTeacherId} onValueChange={(v) => { setRegTeacherId(v); setRegSessionId(''); }}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر الأستاذ" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_TEACHERS.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الحصة المتأثرة</Label>
              <Select value={regSessionId} onValueChange={setRegSessionId}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر الحصة" />
                </SelectTrigger>
                <SelectContent>
                  {teacherSessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.subjectName} - {DAYS_AR[s.dayOfWeek]} {s.startTime}-{s.endTime} ({s.level})
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

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">سيتم إرسال إشعارات لأولياء الأمور</p>
                <p className="text-amber-600 mt-0.5">يمكنك برمجة حصة تعويضية لاحقاً</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRegisterDialog(false)} className="rounded-lg">
              إلغاء
            </Button>
            <Button onClick={handleRegisterAbsence} className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-lg gap-2">
              <Send className="h-4 w-4" />
              تسجيل وإشعار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Student Absence Dialog */}
      <Dialog open={showStudentRegisterDialog} onOpenChange={setShowStudentRegisterDialog}>
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
              <Select value={regStudentId} onValueChange={(v) => { setRegStudentId(v); setRegStudentSessionId(''); }}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر التلميذ" />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_STUDENTS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.level})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الحصة</Label>
              <Select value={regStudentSessionId} onValueChange={setRegStudentSessionId}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="اختر الحصة" />
                </SelectTrigger>
                <SelectContent>
                  {studentSessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.subjectName} - {DAYS_AR[s.dayOfWeek]} {s.startTime}-{s.endTime} (أ. {s.teacherName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">السبب</Label>
              <Textarea
                value={regStudentReason}
                onChange={(e) => setRegStudentReason(e.target.value)}
                placeholder="أدخل سبب الغياب..."
                className="rounded-lg"
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
              <Bell className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium">سيتم إرسال إشعار لولي أمر التلميذ فور التسجيل</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowStudentRegisterDialog(false)} className="rounded-lg">
              إلغاء
            </Button>
            <Button onClick={handleRegisterStudentAbsence} className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg gap-2">
              <Send className="h-4 w-4" />
              تسجيل وإشعار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compensate Absence Dialog */}
      <Dialog open={showCompensateDialog} onOpenChange={setShowCompensateDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-primary">
              <RefreshCw className="h-5 w-5" />
              برمجة حصة تعويضية
            </DialogTitle>
          </DialogHeader>
          {compensateAbsence && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm font-medium text-blue-800">
                  تعويض غياب: {compensateAbsence.teacherName}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {compensateAbsence.subjectName} | {DAYS_AR[compensateAbsence.sessionDay]} - {compensateAbsence.sessionTime}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">اليوم</Label>
                  <Select value={regCompensateDay} onValueChange={setRegCompensateDay}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_AR.slice(0, 5).map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">البداية</Label>
                  <Input
                    type="time"
                    value={regCompensateTime}
                    onChange={(e) => setRegCompensateTime(e.target.value)}
                    className="rounded-lg font-inter"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">النهاية</Label>
                  <Input
                    type="time"
                    value={regCompensateEndTime}
                    onChange={(e) => setRegCompensateEndTime(e.target.value)}
                    className="rounded-lg font-inter"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCompensateDialog(false)} className="rounded-lg">
              إلغاء
            </Button>
            <Button onClick={() => {
              toast.success('تم برمجة حصة تعويضية');
              setShowCompensateDialog(false);
            }} className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-lg gap-2">
              <Check className="h-4 w-4" />
              برمجة التعويض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
