'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardCheck, Clock, CheckCircle, XCircle,
  Send, Users, UserCheck, UserX, Timer, StickyNote,
  Check, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface SessionSection {
  id: string;
  name: string;
  yearName: string;
  level: string;
}

interface AttendanceSession {
  id: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  section: SessionSection | null;
  recordedAttendanceCount: number;
  totalStudents: number;
  isFullyRecorded: boolean;
}

interface SectionOption {
  id: string;
  name: string;
  yearName: string;
  level: string;
  studentCount: number;
  isSupervisor: boolean;
}

interface StudentInfo {
  id: string;
  name: string;
  level: string;
  gender: string | null;
  section: { id: string; name: string };
}

interface StudentAttendance {
  student: StudentInfo;
  status: AttendanceStatus;
  note: string;
}

// ─── Arabic day names ────────────────────────────────────────────────────────

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AttendanceView() {
  const user = useAppStore((s) => s.user);

  // ── Data state ──
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);

  // ── Selection state ──
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // ── UI state ──
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ── Derived teacher ID ──
  const teacherId = user?.teacherId || user?.id || '';

  // ── Today info ──
  const todayDayOfWeek = currentTime.getDay();
  const todayDateStr = currentTime.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch sessions from API
  // ─────────────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    if (!teacherId) return;
    setIsLoadingSessions(true);
    try {
      const params = new URLSearchParams({ teacherId });
      if (selectedSectionId) params.set('sectionId', selectedSectionId);

      const res = await fetch(`/api/teacher/attendance-sessions?${params}`);
      if (!res.ok) throw new Error('فشل في جلب الحصص');

      const data = await res.json();
      setSessions(data.sessions || []);
      setSections(data.sections || []);
    } catch {
      toast.error('فشل في جلب الحصص');
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [teacherId, selectedSectionId]);

  // Fetch sessions on mount and when section filter changes
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Reset session selection when section changes
  useEffect(() => {
    setSelectedSessionId('');
    setStudentRecords([]);
    setHasSubmitted(false);
  }, [selectedSectionId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived: filtered sessions (already filtered by API, but kept for safety)
  // ─────────────────────────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    if (!selectedSectionId) return sessions;
    return sessions.filter((s) => s.section?.id === selectedSectionId);
  }, [sessions, selectedSectionId]);

  // ── Selected session object ──
  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch students when session is selected
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSession?.section?.id || !user?.institutionId) {
      setStudents([]);
      setStudentRecords([]);
      return;
    }

    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const params = new URLSearchParams({
          sectionId: selectedSession.section!.id,
          institutionId: user!.institutionId,
          limit: '100',
        });

        const res = await fetch(`/api/students?${params}`);
        if (!res.ok) throw new Error('فشل في جلب التلاميذ');

        const data = await res.json();
        const studentList: StudentInfo[] = (data.students || []).map(
          (s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            level: s.level as string,
            gender: (s.gender as string) || null,
            section: s.section as { id: string; name: string },
          })
        );

        setStudents(studentList);
        setStudentRecords(
          studentList.map((student) => ({
            student,
            status: 'PRESENT' as AttendanceStatus,
            note: '',
          }))
        );
        setHasSubmitted(false);
      } catch {
        toast.error('فشل في جلب التلاميذ');
        setStudents([]);
        setStudentRecords([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedSessionId, selectedSession, user?.institutionId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Timer alert: show if 15+ minutes past session start
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSession) {
      setShowTimerAlert(false);
      return;
    }
    const [h, m] = selectedSession.startTime.split(':').map(Number);
    const sessionStart = new Date();
    sessionStart.setHours(h, m, 0, 0);
    const diff = (currentTime.getTime() - sessionStart.getTime()) / 60000;
    setShowTimerAlert(diff > 15 && diff < 120);
  }, [selectedSession, currentTime]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
    const late = studentRecords.filter((r) => r.status === 'LATE').length;
    return {
      total: studentRecords.length,
      present,
      absent,
      late,
      presentPct:
        studentRecords.length > 0
          ? Math.round((present / studentRecords.length) * 100)
          : 0,
    };
  }, [studentRecords]);

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setStudentRecords((prev) =>
      prev.map((r) => (r.student.id === studentId ? { ...r, status } : r))
    );
  };

  const updateNote = (studentId: string, note: string) => {
    setStudentRecords((prev) =>
      prev.map((r) => (r.student.id === studentId ? { ...r, note } : r))
    );
  };

  const markAllPresent = () => {
    setStudentRecords((prev) =>
      prev.map((r) => ({ ...r, status: 'PRESENT' as AttendanceStatus }))
    );
    toast.success('تم تسجيل حضور جميع التلاميذ');
  };

  const handleSubmit = async () => {
    if (studentRecords.length === 0 || !selectedSessionId) return;
    setIsSubmitting(true);

    try {
      const records = studentRecords.map((r) => ({
        studentId: r.student.id,
        status: r.status,
        note: r.note || undefined,
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, records }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل في إرسال الكشف');
      }

      const result = await res.json();
      setHasSubmitted(true);
      toast.success(
        'تم إرسال كشف الحضور بنجاح - سيتم إشعار المدير',
        { duration: 5000 }
      );

      // Refresh sessions to update isFullyRecorded
      fetchSessions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الكشف'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-edutrack-dark flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-edutrack-primary" />
            تسجيل الحضور
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تسجيل حضور وغياب وتأخر التلاميذ
          </p>
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-edutrack-dark">
            {DAYS_AR[todayDayOfWeek]}
          </p>
          <p className="font-inter text-xs text-muted-foreground">
            {todayDateStr}
          </p>
        </div>
      </div>

      {/* ── Section Filter + Session Selector ── */}
      <Card className="p-4 border-border/50">
        <div className="flex flex-col gap-3">
          {/* Section filter row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="h-4 w-4 text-edutrack-primary" />
              <Label className="text-sm font-medium">القسم:</Label>
            </div>
            <Select
              value={selectedSectionId}
              onValueChange={setSelectedSectionId}
            >
              <SelectTrigger className="w-full sm:w-[260px] rounded-lg">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    <div className="flex items-center gap-2">
                      <span>{sec.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({sec.yearName})
                      </span>
                      {sec.isSupervisor && (
                        <Badge className="bg-edutrack-primary/10 text-edutrack-primary text-[9px] px-1 py-0">
                          مشرف
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session selector row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-sm font-medium shrink-0">حصة اليوم:</Label>
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="w-full sm:w-[400px] rounded-lg">
                <SelectValue placeholder="اختر الحصة" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessions ? (
                  <SelectItem value="loading" disabled>
                    جاري التحميل...
                  </SelectItem>
                ) : filteredSessions.length === 0 ? (
                  <SelectItem value="none" disabled>
                    لا توجد حصص اليوم
                  </SelectItem>
                ) : (
                  filteredSessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-edutrack-primary/10 text-edutrack-primary text-[10px] px-1">
                          {s.subjectName}
                        </Badge>
                        <span className="font-inter text-xs">
                          {s.startTime} - {s.endTime}
                        </span>
                        {s.section && (
                          <span className="text-xs text-muted-foreground">
                            {s.section.name}
                          </span>
                        )}
                        {s.isFullyRecorded && (
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Selected session badges */}
            {selectedSession && (
              <div className="flex items-center gap-2 mr-auto flex-wrap">
                <Badge className="bg-edutrack-primary/10 text-edutrack-primary border border-edutrack-primary/20">
                  {selectedSession.subjectName}
                </Badge>
                <Badge variant="outline" className="font-inter text-xs">
                  <Clock className="h-3 w-3 ml-1" />
                  {selectedSession.startTime} - {selectedSession.endTime}
                </Badge>
                {selectedSession.section && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedSession.section.name} - {selectedSession.section.yearName}
                  </Badge>
                )}
                {selectedSession.isFullyRecorded && (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                    <Check className="h-3 w-3 ml-1" />
                    تم التسجيل
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Timer Alert ── */}
      <AnimatePresence>
        {showTimerAlert && !hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-3 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    تنبيه: لم يتم تسجيل الحضور
                  </p>
                  <p className="text-xs text-amber-600">
                    مرت أكثر من 15 دقيقة على بداية الحصة
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs"
                  onClick={() => setShowTimerAlert(false)}
                >
                  فهمت
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submitted confirmation ── */}
      <AnimatePresence>
        {hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-3 border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-800">
                    تم إرسال كشف الحضور بنجاح
                  </p>
                  <p className="text-xs text-emerald-600">
                    سيتم إشعار المدير تلقائيًا بنتائج الحضور
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Cards ── */}
      {selectedSession && studentRecords.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'إجمالي التلاميذ',
              value: stats.total,
              icon: <Users className="h-5 w-5" />,
              color: 'text-edutrack-primary',
              bg: 'bg-edutrack-primary/10',
            },
            {
              label: 'حاضر',
              value: stats.present,
              icon: <UserCheck className="h-5 w-5" />,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'غائب',
              value: stats.absent,
              icon: <UserX className="h-5 w-5" />,
              color: 'text-red-600',
              bg: 'bg-red-50',
            },
            {
              label: 'متأخر',
              value: stats.late,
              icon: <Clock className="h-5 w-5" />,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-3 border-border/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-inter text-xl font-bold text-edutrack-dark">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Attendance Progress ── */}
      {selectedSession && studentRecords.length > 0 && (
        <Card className="p-3 border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">نسبة الحضور</span>
            <span className="font-inter text-sm font-bold text-edutrack-primary">
              {stats.presentPct}%
            </span>
          </div>
          <Progress value={stats.presentPct} className="h-2" />
        </Card>
      )}

      {/* ── Student List ── */}
      {selectedSession && !isLoadingStudents ? (
        studentRecords.length > 0 ? (
          <Card className="flex-1 border-border/50 overflow-hidden min-h-0">
            <div className="h-full overflow-auto max-h-[50vh]">
              {/* Action bar - sticky at top */}
              <div className="sticky top-0 z-10 bg-white border-b border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    قائمة التلاميذ - {selectedSession.section?.name || ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllPresent}
                    disabled={hasSubmitted}
                    className="text-xs rounded-lg gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                    تسجيل حضور الكل
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || hasSubmitted}
                    className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-lg gap-2 text-sm shadow-lg shadow-edutrack-primary/25"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    إرسال الكشف
                  </Button>
                </div>
              </div>

              {/* Student rows */}
              <div className="divide-y divide-border/50">
                {studentRecords.map((record, i) => (
                  <motion.div
                    key={record.student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Student info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          record.student.gender === 'FEMALE'
                            ? 'bg-pink-50 text-pink-700'
                            : 'bg-edutrack-dark/5 text-edutrack-dark'
                        }`}
                      >
                        {record.student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {record.student.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {record.student.section?.name || record.student.level}
                        </p>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(record.student.id, 'PRESENT')}
                        disabled={hasSubmitted}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        } ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        حاضر
                      </button>
                      <button
                        onClick={() => updateStatus(record.student.id, 'ABSENT')}
                        disabled={hasSubmitted}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'ABSENT'
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        } ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        غائب
                      </button>
                      <button
                        onClick={() => updateStatus(record.student.id, 'LATE')}
                        disabled={hasSubmitted}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'LATE'
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        } ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        متأخر
                      </button>
                    </div>

                    {/* Note input */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <StickyNote className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={record.note}
                        onChange={(e) =>
                          updateNote(record.student.id, e.target.value)
                        }
                        disabled={hasSubmitted}
                        placeholder="ملاحظة..."
                        className="h-8 text-xs rounded-lg w-full sm:w-[120px]"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          /* No students in this section */
          <Card className="flex-1 border-border/50 flex items-center justify-center">
            <div className="text-center p-8">
              <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-edutrack-dark mb-2">
                لا يوجد تلاميذ في هذا القسم
              </h3>
              <p className="text-sm text-muted-foreground">
                لم يتم العثور على تلاميذ مسجلين في هذا القسم
              </p>
            </div>
          </Card>
        )
      ) : selectedSession && isLoadingStudents ? (
        /* Loading students */
        <Card className="flex-1 border-border/50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="h-8 w-8 border-2 border-edutrack-primary/30 border-t-edutrack-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              جاري تحميل قائمة التلاميذ...
            </p>
          </div>
        </Card>
      ) : !selectedSession && !isLoadingSessions ? (
        /* No session selected */
        <Card className="flex-1 border-border/50 flex items-center justify-center">
          <div className="text-center p-8">
            {filteredSessions.length === 0 && !isLoadingSessions ? (
              <>
                <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-edutrack-dark mb-2">
                  لا توجد حصص اليوم
                </h3>
                <p className="text-sm text-muted-foreground">
                  ليس لديك حصص مجدولة لهذا اليوم
                </p>
              </>
            ) : (
              <>
                <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-edutrack-dark mb-2">
                  اختر حصة لبدء التسجيل
                </h3>
                <p className="text-sm text-muted-foreground">
                  حدد الحصة من القائمة أعلاه لتسجيل الحضور
                </p>
              </>
            )}
          </div>
        </Card>
      ) : (
        /* Loading sessions */
        <Card className="flex-1 border-border/50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="h-8 w-8 border-2 border-edutrack-primary/30 border-t-edutrack-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              جاري تحميل الحصص...
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
