'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  DEMO_SESSIONS, DEMO_STUDENTS, DEMO_TEACHERS,
  DAYS_AR, getSubjectColor, DemoAttendance, DemoSession, DemoStudent,
} from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardCheck, Clock, CheckCircle, XCircle, AlertTriangle,
  Send, Users, UserCheck, UserX, Timer, StickyNote,
  Check, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface StudentAttendance {
  student: DemoStudent;
  status: AttendanceStatus;
  note: string;
}

export default function AttendanceView() {
  const user = useAppStore((s) => s.user);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get teacher's sessions for today
  const todayDayOfWeek = currentTime.getDay();

  const todaySessions = useMemo(() => {
    const teacher = DEMO_TEACHERS.find(t => t.name === user?.name);
    if (!teacher) return DEMO_SESSIONS.filter(s => s.dayOfWeek === todayDayOfWeek && s.status === 'SCHEDULED');
    return DEMO_SESSIONS.filter(s => s.teacherId === teacher.id && s.dayOfWeek === todayDayOfWeek && s.status === 'SCHEDULED');
  }, [user, todayDayOfWeek]);

  // Get selected session
  const selectedSession = useMemo(() => {
    return DEMO_SESSIONS.find(s => s.id === selectedSessionId) || null;
  }, [selectedSessionId]);

  // Get students for selected session
  const sessionStudents = useMemo(() => {
    if (!selectedSession) return [];
    return DEMO_STUDENTS.filter(s => s.level === selectedSession.level);
  }, [selectedSession]);

  // Initialize student records when session changes
  useEffect(() => {
    if (selectedSession && sessionStudents.length > 0) {
      setStudentRecords(
        sessionStudents.map(student => ({
          student,
          status: 'PRESENT' as AttendanceStatus,
          note: '',
        }))
      );
    } else {
      setStudentRecords([]);
    }
  }, [selectedSessionId, sessionStudents, selectedSession]);

  // Auto-select first session
  useEffect(() => {
    if (todaySessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(todaySessions[0].id);
    }
  }, [todaySessions, selectedSessionId]);

  // Timer alert: check if attendance hasn't been recorded within 15 min of session start
  useEffect(() => {
    if (!selectedSession) return;
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

  // Stats
  const stats = useMemo(() => {
    const present = studentRecords.filter(r => r.status === 'PRESENT').length;
    const absent = studentRecords.filter(r => r.status === 'ABSENT').length;
    const late = studentRecords.filter(r => r.status === 'LATE').length;
    return {
      total: studentRecords.length,
      present,
      absent,
      late,
      presentPct: studentRecords.length > 0 ? Math.round((present / studentRecords.length) * 100) : 0,
    };
  }, [studentRecords]);

  // Update student status
  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setStudentRecords(prev =>
      prev.map(r => (r.student.id === studentId ? { ...r, status } : r))
    );
  };

  // Update student note
  const updateNote = (studentId: string, note: string) => {
    setStudentRecords(prev =>
      prev.map(r => (r.student.id === studentId ? { ...r, note } : r))
    );
  };

  // Mark all present
  const markAllPresent = () => {
    setStudentRecords(prev => prev.map(r => ({ ...r, status: 'PRESENT' as AttendanceStatus })));
    toast.success('تم تسجيل حضور جميع التلاميذ');
  };

  // Submit attendance
  const handleSubmit = async () => {
    if (studentRecords.length === 0) return;
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`تم إرسال كشف الحضور بنجاح - ${stats.present} حاضر، ${stats.absent} غائب، ${stats.late} متأخر`);
    } catch {
      toast.error('حدث خطأ أثناء إرسال الكشف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const color = selectedSession ? getSubjectColor(selectedSession.subjectName) : null;

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4">
      {/* Header */}
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
            {currentTime.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Session Selection */}
      <Card className="p-4 border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Label className="text-sm font-medium shrink-0">حصة اليوم:</Label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-full sm:w-[400px] rounded-lg">
              <SelectValue placeholder="اختر الحصة" />
            </SelectTrigger>
            <SelectContent>
              {todaySessions.length === 0 ? (
                <SelectItem value="none" disabled>لا توجد حصص اليوم</SelectItem>
              ) : (
                todaySessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getSubjectColor(s.subjectName).light} ${getSubjectColor(s.subjectName).text} text-[10px] px-1`}>
                        {s.subjectName}
                      </Badge>
                      <span className="font-inter text-xs">{s.startTime} - {s.endTime}</span>
                      <span className="text-xs text-muted-foreground">{s.level}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedSession && (
            <div className="flex items-center gap-2 mr-auto">
              <Badge className={`${color?.light} ${color?.text} ${color?.border} border`}>
                {selectedSession.subjectName}
              </Badge>
              <Badge variant="outline" className="font-inter text-xs">
                <Clock className="h-3 w-3 ml-1" />
                {selectedSession.startTime} - {selectedSession.endTime}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {selectedSession.level}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Timer Alert */}
      <AnimatePresence>
        {showTimerAlert && (
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
                  <p className="text-sm font-medium text-amber-800">تنبيه: لم يتم تسجيل الحضور</p>
                  <p className="text-xs text-amber-600">مرت أكثر من 15 دقيقة على بداية الحصة</p>
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

      {/* Stats */}
      {selectedSession && studentRecords.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي التلاميذ', value: stats.total, icon: <Users className="h-5 w-5" />, color: 'text-edutrack-primary', bg: 'bg-edutrack-primary/10' },
            { label: 'حاضر', value: stats.present, icon: <UserCheck className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'غائب', value: stats.absent, icon: <UserX className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'متأخر', value: stats.late, icon: <Clock className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-3 border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-inter text-xl font-bold text-edutrack-dark">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {selectedSession && studentRecords.length > 0 && (
        <Card className="p-3 border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">نسبة الحضور</span>
            <span className="font-inter text-sm font-bold text-edutrack-primary">{stats.presentPct}%</span>
          </div>
          <Progress value={stats.presentPct} className="h-2" />
        </Card>
      )}

      {/* Student List */}
      {selectedSession && studentRecords.length > 0 ? (
        <Card className="flex-1 border-border/50 overflow-hidden">
          <div className="h-full overflow-auto">
            {/* Action bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">قائمة التلاميذ - {selectedSession.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  className="text-xs rounded-lg gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <CheckCircle className="h-3 w-3" />
                  تسجيل حضور الكل
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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

            {/* Students */}
            <div className="divide-y divide-border/50">
              {studentRecords.map((record, i) => {
                const studentColor = getSubjectColor(selectedSession.subjectName);
                return (
                  <motion.div
                    key={record.student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Student info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-edutrack-dark/5 flex items-center justify-center text-sm font-bold text-edutrack-dark shrink-0">
                        {record.student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{record.student.name}</p>
                        <p className="text-[11px] text-muted-foreground">{record.student.level}</p>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(record.student.id, 'PRESENT')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        حاضر ✓
                      </button>
                      <button
                        onClick={() => updateStatus(record.student.id, 'ABSENT')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'ABSENT'
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        غائب ✗
                      </button>
                      <button
                        onClick={() => updateStatus(record.student.id, 'LATE')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          record.status === 'LATE'
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        متأخر ⏱
                      </button>
                    </div>

                    {/* Note */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <StickyNote className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={record.note}
                        onChange={(e) => updateNote(record.student.id, e.target.value)}
                        placeholder="ملاحظة..."
                        className="h-8 text-xs rounded-lg w-full sm:w-[120px]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 border-border/50 flex items-center justify-center">
          <div className="text-center p-8">
            {todaySessions.length === 0 ? (
              <>
                <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-edutrack-dark mb-2">لا توجد حصص اليوم</h3>
                <p className="text-sm text-muted-foreground">ليس لديك حصص مجدولة لهذا اليوم</p>
              </>
            ) : (
              <>
                <ClipboardCheck className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-edutrack-dark mb-2">اختر حصة لبدء التسجيل</h3>
                <p className="text-sm text-muted-foreground">حدد الحصة من القائمة أعلاه لتسجيل الحضور</p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
