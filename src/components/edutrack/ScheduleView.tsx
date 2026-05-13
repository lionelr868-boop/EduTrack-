'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  DEMO_SESSIONS, DEMO_TEACHERS, DEMO_SUBJECTS, DEMO_LEVELS,
  DAYS_AR, getSubjectColor, DemoSession,
} from '@/lib/demo-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Filter, Calendar, Clock, Edit3, XCircle, RefreshCw,
  MoreVertical, ChevronLeft, ChevronRight, Search, AlertTriangle,
  Check, Trash2, Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleViewProps {
  mode: 'director' | 'teacher';
}

const SLOT_HEIGHT = 48; // px per 30-min slot
const HEADER_HEIGHT = 44;

export default function ScheduleView({ mode }: ScheduleViewProps) {
  const user = useAppStore((s) => s.user);
  const [sessions, setSessions] = useState<DemoSession[]>(DEMO_SESSIONS);
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editSession, setEditSession] = useState<DemoSession | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelSession, setCancelSession] = useState<DemoSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCompensateDialog, setShowCompensateDialog] = useState(false);
  const [compensateSession, setCompensateSession] = useState<DemoSession | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form state
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formDay, setFormDay] = useState('0');
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('09:30');
  const [formRepeatType, setFormRepeatType] = useState('WEEKLY');

  // Current day of week for highlighting
  const today = currentTime.getDay();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (mode === 'teacher' && user) {
      const teacher = DEMO_TEACHERS.find(t => t.name === user.name);
      if (teacher) result = result.filter(s => s.teacherId === teacher.id);
    }
    if (filterTeacher !== 'all') result = result.filter(s => s.teacherId === filterTeacher);
    if (filterLevel !== 'all') result = result.filter(s => s.level === filterLevel);
    if (filterSubject !== 'all') result = result.filter(s => s.subjectId === filterSubject);
    return result;
  }, [sessions, filterTeacher, filterLevel, filterSubject, mode, user]);

  // Available teachers for selected subject
  const availableTeachers = useMemo(() => {
    if (!formSubject) return DEMO_TEACHERS;
    return DEMO_TEACHERS.filter(t => t.subjects.includes(formSubject));
  }, [formSubject]);

  // Conflict detection
  const checkConflict = useCallback((session: Partial<DemoSession>, excludeId?: string) => {
    return sessions.filter(s => {
      if (s.id === excludeId) return false;
      if (s.status === 'CANCELLED') return false;
      if (s.dayOfWeek !== Number(session.dayOfWeek)) return false;
      if (s.teacherId === session.teacherId || s.level === session.level) {
        const sStart = s.startTime;
        const sEnd = s.endTime;
        const nStart = session.startTime || '';
        const nEnd = session.endTime || '';
        if (nStart < sEnd && nEnd > sStart) return true;
      }
      return false;
    });
  }, [sessions]);

  // Time to slot index (30-min resolution)
  const timeToSlot = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h - 8) * 2 + (m >= 30 ? 1 : 0);
  };

  const slotToTime = (slot: number) => {
    const h = Math.floor(slot / 2) + 8;
    const m = slot % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const getSessionHeight = (start: string, end: string) => {
    const startSlot = timeToSlot(start);
    const endSlot = timeToSlot(end);
    return (endSlot - startSlot) * SLOT_HEIGHT;
  };

  const getSessionTop = (start: string) => {
    return timeToSlot(start) * SLOT_HEIGHT;
  };

  // Current time indicator position
  const currentTimeTop = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (h < 8 || h >= 17) return -1;
    return ((h - 8) * 2 + (m >= 30 ? 1 : 0)) * SLOT_HEIGHT + (m % 30) / 30 * SLOT_HEIGHT;
  }, [currentTime]);

  // Handle add session
  const handleAddSession = () => {
    setEditSession(null);
    setFormSubject('');
    setFormTeacher('');
    setFormLevel('');
    setFormDay('0');
    setFormStartTime('08:00');
    setFormEndTime('09:30');
    setFormRepeatType('WEEKLY');
    setShowAddDialog(true);
  };

  // Handle edit session
  const handleEditSession = (session: DemoSession) => {
    setEditSession(session);
    setFormSubject(session.subjectId);
    setFormTeacher(session.teacherId);
    setFormLevel(session.level);
    setFormDay(String(session.dayOfWeek));
    setFormStartTime(session.startTime);
    setFormEndTime(session.endTime);
    setFormRepeatType(session.repeatType);
    setShowAddDialog(true);
  };

  // Save session
  const handleSaveSession = () => {
    const subject = DEMO_SUBJECTS.find(s => s.id === formSubject);
    const teacher = DEMO_TEACHERS.find(t => t.id === formTeacher);

    if (!subject || !teacher || !formLevel) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newSession: DemoSession = {
      id: editSession?.id || `s${Date.now()}`,
      subjectId: formSubject,
      subjectName: subject.name,
      teacherId: formTeacher,
      teacherName: teacher.name,
      institutionId: user?.institutionId || 'inst1',
      dayOfWeek: Number(formDay),
      startTime: formStartTime,
      endTime: formEndTime,
      status: 'SCHEDULED',
      level: formLevel,
      repeatType: formRepeatType,
    };

    // Check conflicts
    const conflicts = checkConflict(newSession, editSession?.id);
    if (conflicts.length > 0) {
      toast.error('يوجد تعارض في الجدول! يرجى اختيار وقت أو أستاذ آخر');
      return;
    }

    if (editSession) {
      setSessions(prev => prev.map(s => s.id === editSession.id ? newSession : s));
      toast.success('تم تعديل الحصة بنجاح');
    } else {
      setSessions(prev => [...prev, newSession]);
      toast.success('تمت إضافة الحصة بنجاح');
    }

    setShowAddDialog(false);
  };

  // Cancel session
  const handleCancelSession = () => {
    if (!cancelSession || !cancelReason.trim()) {
      toast.error('يرجى إدخال سبب الإلغاء');
      return;
    }
    setSessions(prev => prev.map(s =>
      s.id === cancelSession.id ? { ...s, status: 'CANCELLED', cancelReason } : s
    ));
    toast.success('تم إلغاء الحصة وإشعار أولياء الأمور');
    setShowCancelDialog(false);
    setCancelSession(null);
    setCancelReason('');
  };

  // Compensate session
  const handleCompensateSession = () => {
    if (!compensateSession) return;
    const newSession: DemoSession = {
      id: `s${Date.now()}`,
      subjectId: compensateSession.subjectId,
      subjectName: compensateSession.subjectName,
      teacherId: compensateSession.teacherId,
      teacherName: compensateSession.teacherName,
      institutionId: compensateSession.institutionId,
      dayOfWeek: Number(formDay),
      startTime: formStartTime,
      endTime: formEndTime,
      status: 'SCHEDULED',
      level: compensateSession.level,
      repeatType: 'EXCEPTIONAL',
    };
    setSessions(prev => [...prev, newSession]);
    toast.success('تم برمجة حصة تعويضية بنجاح');
    setShowCompensateDialog(false);
    setCompensateSession(null);
  };

  // Delete session
  const handleDeleteSession = (session: DemoSession) => {
    setSessions(prev => prev.filter(s => s.id !== session.id));
    toast.success('تم حذف الحصة');
  };

  // Render time labels
  const renderTimeLabels = () => {
    const labels = [];
    for (let h = 8; h <= 17; h++) {
      labels.push(
        <div
          key={h}
          className="absolute right-0 flex items-start justify-end pr-2 text-[11px] text-muted-foreground font-inter"
          style={{ top: (h - 8) * 2 * SLOT_HEIGHT, height: SLOT_HEIGHT * 2 }}
        >
          <span className="-translate-y-2">{`${String(h).padStart(2, '0')}:00`}</span>
        </div>
      );
    }
    return labels;
  };

  // Render grid lines
  const renderGridLines = () => {
    const lines = [];
    for (let i = 0; i <= 18; i++) {
      lines.push(
        <div
          key={i}
          className={`absolute left-0 right-0 border-t ${i % 2 === 0 ? 'border-border/60' : 'border-border/30'}`}
          style={{ top: i * SLOT_HEIGHT }}
        />
      );
    }
    return lines;
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-edutrack-dark flex items-center gap-2">
            <Calendar className="h-6 w-6 text-edutrack-primary" />
            الجدول الدراسي
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'director' ? 'إدارة وتنظيم الحصص الدراسية' : 'عرض جدول الحصص الأسبوعي'}
          </p>
        </div>
        {mode === 'director' && (
          <Button
            onClick={handleAddSession}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/25 rounded-xl gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة حصة
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3 border-border/50">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">تصفية:</span>

          <Select value={filterTeacher} onValueChange={setFilterTeacher}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="الأستاذ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأساتذة</SelectItem>
              {DEMO_TEACHERS.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[140px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {DEMO_LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[140px] h-9 text-sm rounded-lg">
              <SelectValue placeholder="المادة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {[...new Map(DEMO_SUBJECTS.map(s => [s.name, s])).values()].map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterTeacher !== 'all' || filterLevel !== 'all' || filterSubject !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterTeacher('all');
                setFilterLevel('all');
                setFilterSubject('all');
              }}
              className="h-9 text-xs text-edutrack-danger"
            >
              <XCircle className="h-3 w-3 ml-1" />
              مسح الفلاتر
            </Button>
          )}

          <Badge variant="secondary" className="mr-auto text-xs">
            {filteredSessions.filter(s => s.status !== 'CANCELLED').length} حصة
          </Badge>
        </div>
      </Card>

      {/* Schedule Grid */}
      <Card className="flex-1 border-border/50 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="min-w-[700px] lg:min-w-0">
            {/* Day Headers */}
            <div className="sticky top-0 z-20 grid border-b border-border bg-white"
              style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}
            >
              <div className="flex items-center justify-center border-l border-border bg-muted/30 p-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              {DAYS_AR.slice(0, 5).map((day, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-center border-l border-border p-2 text-sm font-semibold ${
                    today === idx ? 'bg-edutrack-primary/5 text-edutrack-primary' : 'text-edutrack-dark'
                  }`}
                >
                  {day}
                  {today === idx && (
                    <Badge className="mr-2 h-5 w-5 p-0 flex items-center justify-center bg-edutrack-primary text-[10px] text-white">
                      اليوم
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Grid Content */}
            <div className="relative grid"
              style={{ gridTemplateColumns: '60px repeat(5, 1fr)' }}
            >
              {/* Time Labels Column */}
              <div className="relative border-l border-border bg-muted/10" style={{ height: 18 * SLOT_HEIGHT }}>
                {renderTimeLabels()}
              </div>

              {/* Day Columns */}
              {[0, 1, 2, 3, 4].map((dayIdx) => {
                const daySessions = filteredSessions.filter(s => s.dayOfWeek === dayIdx);
                return (
                  <div
                    key={dayIdx}
                    className={`relative border-l border-border ${today === dayIdx ? 'bg-edutrack-primary/[0.02]' : ''}`}
                    style={{ height: 18 * SLOT_HEIGHT }}
                  >
                    {/* Grid lines */}
                    {renderGridLines()}

                    {/* Current time indicator */}
                    {today === dayIdx && currentTimeTop >= 0 && (
                      <div
                        className="absolute left-0 right-0 z-10 flex items-center"
                        style={{ top: currentTimeTop }}
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -mr-1.5 z-10" />
                        <div className="flex-1 h-[2px] bg-red-500" />
                      </div>
                    )}

                    {/* Session Cards */}
                    {daySessions.map((session, i) => {
                      const color = getSubjectColor(session.subjectName);
                      const top = getSessionTop(session.startTime);
                      const height = getSessionHeight(session.startTime, session.endTime);
                      const isCancelled = session.status === 'CANCELLED';

                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          className={`absolute right-1 left-1 z-5 rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:z-10 ${
                            isCancelled
                              ? 'border-red-200 bg-red-50/80 opacity-60'
                              : `${color.border} ${color.light}`
                          }`}
                          style={{ top, height, minHeight: SLOT_HEIGHT }}
                          onClick={() => {
                            if (mode === 'director') handleEditSession(session);
                          }}
                        >
                          <div className={`h-1 ${isCancelled ? 'bg-red-400' : color.bg}`} />
                          <div className="p-1.5">
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-[11px] font-bold leading-tight ${isCancelled ? 'text-red-600 line-through' : color.text}`}>
                                {session.subjectName}
                              </p>
                              {mode === 'director' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className="shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors">
                                      <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditSession(session); }}>
                                      <Edit3 className="h-4 w-4 ml-2" />
                                      تعديل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteSession(session); }}>
                                      <Trash2 className="h-4 w-4 ml-2" />
                                      حذف
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCancelSession(session);
                                        setCancelReason('');
                                        setShowCancelDialog(true);
                                      }}
                                      disabled={isCancelled}
                                    >
                                      <XCircle className="h-4 w-4 ml-2" />
                                      إلغاء الحصة
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCompensateSession(session);
                                        setFormDay(String(session.dayOfWeek));
                                        setFormStartTime(session.startTime);
                                        setFormEndTime(session.endTime);
                                        setShowCompensateDialog(true);
                                      }}
                                      disabled={!isCancelled}
                                    >
                                      <RefreshCw className="h-4 w-4 ml-2" />
                                      تعويض الحصة
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                              {session.teacherName}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-inter text-[9px] text-muted-foreground">
                                {session.startTime} - {session.endTime}
                              </span>
                            </div>
                            <Badge variant="secondary" className="mt-1 h-4 text-[9px] px-1">
                              {session.level}
                            </Badge>
                            {isCancelled && (
                              <Badge className="mt-1 h-4 text-[9px] px-1 bg-red-100 text-red-700 mr-1">
                                ملغاة
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Add/Edit Session Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              {editSession ? <Edit3 className="h-5 w-5 text-edutrack-primary" /> : <Plus className="h-5 w-5 text-edutrack-primary" />}
              {editSession ? 'تعديل حصة' : 'إضافة حصة جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">المادة</Label>
                <Select value={formSubject} onValueChange={(v) => { setFormSubject(v); setFormTeacher(''); }}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Map(DEMO_SUBJECTS.map(s => [s.name, s])).values()].map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">الأستاذ</Label>
                <Select value={formTeacher} onValueChange={setFormTeacher}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="اختر الأستاذ" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">المستوى</Label>
                <Select value={formLevel} onValueChange={setFormLevel}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="اختر المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_LEVELS.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">اليوم</Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="اختر اليوم" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_AR.slice(0, 5).map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">وقت البداية</Label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="rounded-lg font-inter"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">وقت النهاية</Label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="rounded-lg font-inter"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">التكرار</Label>
              <Select value={formRepeatType} onValueChange={setFormRepeatType}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">أسبوعي</SelectItem>
                  <SelectItem value="EXCEPTIONAL">استثنائي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-lg">
              إلغاء
            </Button>
            <Button onClick={handleSaveSession} className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-lg gap-2">
              <Check className="h-4 w-4" />
              {editSession ? 'حفظ التعديلات' : 'إضافة الحصة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Session Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              إلغاء حصة
            </DialogTitle>
          </DialogHeader>
          {cancelSession && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium text-red-800">
                  {cancelSession.subjectName} - {cancelSession.teacherName}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {DAYS_AR[cancelSession.dayOfWeek]} | {cancelSession.startTime} - {cancelSession.endTime} | {cancelSession.level}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">سبب الإلغاء</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="أدخل سبب إلغاء الحصة..."
                  className="rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                سيتم إشعار أولياء الأمور بإلغاء الحصة
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="rounded-lg">
              رجوع
            </Button>
            <Button onClick={handleCancelSession} className="bg-red-600 hover:bg-red-700 text-white rounded-lg gap-2">
              <XCircle className="h-4 w-4" />
              تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compensate Session Dialog */}
      <Dialog open={showCompensateDialog} onOpenChange={setShowCompensateDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-primary">
              <RefreshCw className="h-5 w-5" />
              برمجة حصة تعويضية
            </DialogTitle>
          </DialogHeader>
          {compensateSession && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm font-medium text-blue-800">
                  تعويض: {compensateSession.subjectName} - {compensateSession.teacherName}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {compensateSession.level} | الحصة الملغاة
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">اليوم</Label>
                  <Select value={formDay} onValueChange={setFormDay}>
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
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="rounded-lg font-inter"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">النهاية</Label>
                  <Input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
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
            <Button onClick={handleCompensateSession} className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white rounded-lg gap-2">
              <Check className="h-4 w-4" />
              برمجة التعويض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
