'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  GraduationCap,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Users,
  Phone,
  MapPin,
  Loader2,
  Plus,
  BookOpen,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────
interface StudentAttendance {
  attended: number;
  absent: number;
  total: number;
  rate: number;
}

interface StudentSection {
  id: string;
  name: string;
  yearName: string;
}

interface StudentParent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface Student {
  id: string;
  name: string;
  level: string;
  gender: string;
  section: StudentSection | null;
  attendance: StudentAttendance;
  parent: StudentParent | null;
}

interface SectionInfo {
  id: string;
  name: string;
  yearName: string;
}

interface GroupedSection {
  sectionInfo: SectionInfo;
  students: Student[];
}

interface SectionDetail {
  id: string;
  name: string;
  yearName: string;
  level: string;
  studentCount: number;
  isSupervisor: boolean;
}

interface ApiResponse {
  grouped: Record<string, Record<string, GroupedSection>>;
  sections: SectionDetail[];
  totalStudents: number;
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

// ─── Helper: Attendance color ───────────────────────────────
function getAttendanceColor(rate: number) {
  if (rate >= 85) return 'text-emerald-600';
  if (rate >= 75) return 'text-amber-600';
  return 'text-red-600';
}

function getAttendanceBg(rate: number) {
  if (rate >= 85) return 'bg-emerald-500';
  if (rate >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function getAttendanceProgressClass(rate: number) {
  if (rate >= 85) return '[&>div]:bg-emerald-500';
  if (rate >= 75) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getAvatarBorder(rate: number) {
  if (rate >= 85) return 'border-emerald-300';
  if (rate >= 75) return 'border-amber-300';
  return 'border-red-300';
}

function getAvatarColors(rate: number) {
  if (rate >= 85) return 'bg-emerald-50 text-emerald-600';
  if (rate >= 75) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
}

function getCardRing(rate: number) {
  if (rate < 75) return 'ring-1 ring-red-200';
  if (rate < 80) return 'ring-1 ring-amber-200';
  return '';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

function getGenderLabel(gender: string) {
  if (gender === 'MALE' || gender === 'male') return 'ذكر';
  if (gender === 'FEMALE' || gender === 'female') return 'أنثى';
  return gender;
}

// ─── Main Component ─────────────────────────────────────────
export default function TeacherStudentsView() {
  const user = useAppStore((s) => s.user);
  const teacherId = user?.teacherId || '';

  // Data state
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // UI state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Add activity form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState<string>('HOMEWORK');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityGrade, setActivityGrade] = useState('');
  const [activityMaxGrade, setActivityMaxGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick-add dialog state (for student card button)
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddStudent, setQuickAddStudent] = useState<Student | null>(null);
  const [quickActivityType, setQuickActivityType] = useState<string>('HOMEWORK');
  const [quickActivityTitle, setQuickActivityTitle] = useState('');
  const [quickActivityDesc, setQuickActivityDesc] = useState('');
  const [quickActivityGrade, setQuickActivityGrade] = useState('');
  const [quickActivityMaxGrade, setQuickActivityMaxGrade] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // ─── Fetch data ───────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ teacherId });
      if (levelFilter && levelFilter !== 'all') params.set('level', levelFilter);
      if (sectionFilter && sectionFilter !== 'all') params.set('sectionId', sectionFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/teacher/students?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل في جلب البيانات');
      }
      const json: ApiResponse = await res.json();
      setData(json);

      // Auto-expand all levels on first load
      const levels = Object.keys(json.grouped);
      const expanded: Record<string, boolean> = {};
      levels.forEach((l) => (expanded[l] = true));
      setExpandedLevels(expanded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل في جلب بيانات التلاميذ');
    } finally {
      setLoading(false);
    }
  }, [teacherId, levelFilter, sectionFilter, searchQuery]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ─── Derived data ─────────────────────────────────────────
  const availableLevels = useMemo(() => {
    if (!data?.sections) return [];
    const levels = new Set(data.sections.map((s) => s.level).filter(Boolean));
    return Array.from(levels);
  }, [data]);

  const filteredSections = useMemo(() => {
    if (!data?.sections) return [];
    if (levelFilter === 'all') return data.sections;
    return data.sections.filter((s) => s.level === levelFilter);
  }, [data, levelFilter]);

  const hasActiveFilters = levelFilter !== 'all' || sectionFilter !== 'all' || searchQuery.trim() !== '';

  // All students flat (for filtered view)
  const allStudentsFlat = useMemo(() => {
    if (!data?.grouped) return [];
    const students: Student[] = [];
    for (const levelSections of Object.values(data.grouped)) {
      for (const group of Object.values(levelSections)) {
        students.push(...group.students);
      }
    }
    return students;
  }, [data]);

  // ─── Handlers ─────────────────────────────────────────────
  const openStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  const toggleLevel = (level: string) => {
    setExpandedLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const resetFilters = () => {
    setLevelFilter('all');
    setSectionFilter('all');
    setSearchQuery('');
  };

  // When level changes, reset section filter
  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    setSectionFilter('all');
  };

  // ─── Add Activity helpers ───────────────────────────────
  const resetDetailForm = () => {
    setActivityType('HOMEWORK');
    setActivityTitle('');
    setActivityDesc('');
    setActivityGrade('');
    setActivityMaxGrade('');
    setSubmitting(false);
    setShowAddForm(false);
  };

  const resetQuickForm = () => {
    setQuickActivityType('HOMEWORK');
    setQuickActivityTitle('');
    setQuickActivityDesc('');
    setQuickActivityGrade('');
    setQuickActivityMaxGrade('');
    setQuickSubmitting(false);
  };

  const handleSubmitActivity = async (
    student: Student,
    type: string,
    title: string,
    description: string,
    grade: string,
    maxGrade: string,
    onSuccess: () => void
  ) => {
    if (!teacherId) {
      toast.error('معرّف المعلم غير متوفر');
      return;
    }
    if (!student.section?.id) {
      toast.error('معرّف القسم غير متوفر لهذا التلميذ');
      return;
    }
    if (!title.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }

    const parsedGrade = grade ? parseFloat(grade) : undefined;
    const parsedMaxGrade = maxGrade ? parseFloat(maxGrade) : undefined;

    if (parsedGrade !== undefined && (isNaN(parsedGrade) || parsedGrade < 0)) {
      toast.error('النقطة يجب أن تكون رقماً صحيحاً');
      return;
    }
    if (parsedMaxGrade !== undefined && (isNaN(parsedMaxGrade) || parsedMaxGrade <= 0)) {
      toast.error('النقطة القصوى يجب أن تكون رقماً أكبر من صفر');
      return;
    }
    if (parsedGrade !== undefined && parsedMaxGrade === undefined) {
      toast.error('يجب تحديد النقطة القصوى عند إدخال النقطة');
      return;
    }
    if (parsedGrade !== undefined && parsedMaxGrade !== undefined && parsedGrade > parsedMaxGrade) {
      toast.error('النقطة لا يمكن أن تتجاوز النقطة القصوى');
      return;
    }

    const body: Record<string, unknown> = {
      studentId: student.id,
      teacherId,
      sectionId: student.section.id,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
    };
    if (parsedGrade !== undefined) body.grade = parsedGrade;
    if (parsedMaxGrade !== undefined) body.maxGrade = parsedMaxGrade;

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل في إضافة النشاط');
      }
      toast.success('تمت إضافة النشاط بنجاح');
      onSuccess();
      fetchStudents(); // refresh student list
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل في إضافة النشاط');
    }
  };

  const openQuickAdd = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    resetQuickForm();
    setQuickAddStudent(student);
    setQuickAddOpen(true);
  };

  // ─── Loading state ────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24" dir="rtl">
        <Loader2 className="h-10 w-10 text-edutrack-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">جارٍ تحميل بيانات التلاميذ...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
            </div>
            تلاميذي
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة ومتابعة تلاميذك</p>
        </div>
        <Badge
          variant="outline"
          className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
        >
          <Users className="h-3.5 w-3.5 ml-1" />
          {data?.totalStudents ?? 0} تلميذ
        </Badge>
      </motion.div>

      {/* ── Filters Row ─────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن تلميذ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-10 bg-white border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg text-sm"
            />
          </div>

          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-lg bg-white border-gray-200 text-sm">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">المستوى: الكل</SelectItem>
              {availableLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Section Filter */}
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-lg bg-white border-gray-200 text-sm">
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">القسم: الكل</SelectItem>
              {filteredSections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name} {section.yearName ? `- ${section.yearName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter toggle button */}
          <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 rounded-lg border-gray-200 shrink-0 ${
              hasActiveFilters
                ? 'bg-edutrack-primary/10 border-edutrack-primary/30 text-edutrack-primary'
                : 'bg-white text-muted-foreground'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>

          {/* Reset filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-edutrack-primary hover:text-edutrack-dark rounded-lg h-10"
            >
              إعادة تعيين
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Students Content ────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        {data && data.totalStudents === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <GraduationCap className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-edutrack-dark mb-2">لا توجد نتائج</h3>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'لم يتم العثور على تلاميذ مطابقين لمعايير البحث'
                : 'لم يتم العثور على تلاميذ'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={resetFilters}
                className="mt-4 rounded-lg text-edutrack-primary border-edutrack-primary/30"
              >
                إعادة تعيين الفلاتر
              </Button>
            )}
          </div>
        ) : hasActiveFilters ? (
          /* ── Flat filtered list ──────────────────────────── */
          <div className="space-y-3">
            <AnimatePresence>
              {allStudentsFlat.map((student, index) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  index={index}
                  onClick={() => openStudentDetail(student)}
                  onQuickAdd={(e) => openQuickAdd(student, e)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* ── Grouped by Level → Section ─────────────────── */
          <div className="space-y-4">
            {Object.entries(data?.grouped || {}).map(([level, sections]) => {
              const levelStudentCount = Object.values(sections).reduce(
                (acc, s) => acc + s.students.length,
                0
              );
              const isExpanded = expandedLevels[level] !== false;

              return (
                <Collapsible
                  key={level}
                  open={isExpanded}
                  onOpenChange={() => toggleLevel(level)}
                >
                  {/* Level Header */}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto rounded-xl bg-edutrack-light/50 hover:bg-edutrack-light/80 mb-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-edutrack-primary" />
                        </div>
                        <span className="font-bold text-edutrack-dark text-base">
                          {level}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-edutrack-primary/10 text-edutrack-primary"
                        >
                          {levelStudentCount} تلميذ
                        </Badge>
                      </div>
                      <ChevronLeft
                        className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                          isExpanded ? '-rotate-90' : ''
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>

                  {/* Sections under this level */}
                  <CollapsibleContent>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 pr-2 sm:pr-4"
                        >
                          {Object.values(sections).map((sectionGroup) => (
                            <div key={sectionGroup.sectionInfo.id}>
                              {/* Section Header */}
                              <div className="flex items-center gap-2 mb-3 px-1">
                                <MapPin className="h-3.5 w-3.5 text-edutrack-primary" />
                                <span className="text-sm font-semibold text-edutrack-dark">
                                  {sectionGroup.sectionInfo.name}
                                </span>
                                {sectionGroup.sectionInfo.yearName && (
                                  <span className="text-xs text-muted-foreground">
                                    - {sectionGroup.sectionInfo.yearName}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/50"
                                >
                                  {sectionGroup.students.length} تلميذ
                                </Badge>
                              </div>

                              {/* Students in this section */}
                              <div className="space-y-2.5">
                                {sectionGroup.students.map((student, index) => (
                                  <StudentCard
                                    key={student.id}
                                    student={student}
                                    index={index}
                                    onClick={() => openStudentDetail(student)}
                                    onQuickAdd={(e) => openQuickAdd(student, e)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Student Detail Dialog ──────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) resetDetailForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              تفاصيل التلميذ
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Info Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="h-14 w-14 border-2 border-edutrack-primary/20">
                  <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary font-bold text-lg">
                    {getInitials(selectedStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-edutrack-dark text-lg truncate">
                    {selectedStudent.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {selectedStudent.level}
                    </Badge>
                    {selectedStudent.section && (
                      <Badge variant="outline" className="text-xs">
                        {selectedStudent.section.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {getGenderLabel(selectedStudent.gender)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`rounded-xl p-3 text-center ${
                    selectedStudent.attendance.rate >= 85
                      ? 'bg-emerald-50'
                      : selectedStudent.attendance.rate >= 75
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                  }`}
                >
                  <p className="text-[10px] text-muted-foreground mb-1">نسبة الحضور</p>
                  <div className="flex items-center justify-center gap-1">
                    {selectedStudent.attendance.rate >= 85 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : selectedStudent.attendance.rate >= 75 ? (
                      <Clock className="h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <p
                      className={`font-bold text-lg font-inter ${getAttendanceColor(selectedStudent.attendance.rate)}`}
                    >
                      {selectedStudent.attendance.rate}%
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">إجمالي الحصص</p>
                  <p className="font-bold text-lg font-inter text-edutrack-dark">
                    {selectedStudent.attendance.total}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">الغيابات</p>
                  <p className="font-bold text-lg font-inter text-red-600">
                    {selectedStudent.attendance.absent}
                  </p>
                </div>
              </div>

              {/* Attendance Progress */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">نسبة الحضور</span>
                  <span
                    className={`text-sm font-bold font-inter ${getAttendanceColor(selectedStudent.attendance.rate)}`}
                  >
                    {selectedStudent.attendance.rate}%
                  </span>
                </div>
                <Progress
                  value={selectedStudent.attendance.rate}
                  className={`h-2 ${getAttendanceProgressClass(selectedStudent.attendance.rate)}`}
                />
                {selectedStudent.attendance.rate < 80 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">
                      نسبة الحضور أقل من المطلوب
                    </span>
                  </div>
                )}
              </div>

              {/* Add Activity/Grade Button */}
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="w-full rounded-lg bg-edutrack-primary hover:bg-edutrack-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة نقطة/نشاط
                </Button>
              )}

              {/* Inline Add Activity Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-edutrack-primary/5 rounded-xl p-4 space-y-3 border border-edutrack-primary/10">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-edutrack-dark flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-edutrack-primary" />
                          إضافة نشاط جديد
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={resetDetailForm}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Activity Type */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-edutrack-dark">نوع النشاط</Label>
                        <Select value={activityType} onValueChange={setActivityType}>
                          <SelectTrigger className="h-9 rounded-lg bg-white border-gray-200 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOMEWORK">واجب منزلي</SelectItem>
                            <SelectItem value="EXAM">امتحان</SelectItem>
                            <SelectItem value="QUIZ">اختبار قصير</SelectItem>
                            <SelectItem value="PARTICIPATION">مشاركة</SelectItem>
                            <SelectItem value="BEHAVIOR">سلوك</SelectItem>
                            <SelectItem value="NOTE">ملاحظة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-edutrack-dark">
                          العنوان <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="مثال: اختبار الفصل الأول"
                          value={activityTitle}
                          onChange={(e) => setActivityTitle(e.target.value)}
                          className="h-9 bg-white border-gray-200 text-sm rounded-lg"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-edutrack-dark">الوصف (اختياري)</Label>
                        <Textarea
                          placeholder="أضف ملاحظات أو تفاصيل..."
                          value={activityDesc}
                          onChange={(e) => setActivityDesc(e.target.value)}
                          className="bg-white border-gray-200 text-sm rounded-lg min-h-[60px]"
                          rows={2}
                        />
                      </div>

                      {/* Grade and Max Grade */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-edutrack-dark">النقطة (اختياري)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            value={activityGrade}
                            onChange={(e) => setActivityGrade(e.target.value)}
                            className="h-9 bg-white border-gray-200 text-sm rounded-lg font-inter"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-edutrack-dark">النقطة القصوى</Label>
                          <Input
                            type="number"
                            placeholder="20"
                            min="0"
                            value={activityMaxGrade}
                            onChange={(e) => setActivityMaxGrade(e.target.value)}
                            className="h-9 bg-white border-gray-200 text-sm rounded-lg font-inter"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          className="flex-1 rounded-lg bg-edutrack-primary hover:bg-edutrack-primary/90 text-white"
                          disabled={submitting || !activityTitle.trim()}
                          onClick={async () => {
                            setSubmitting(true);
                            await handleSubmitActivity(
                              selectedStudent!,
                              activityType,
                              activityTitle,
                              activityDesc,
                              activityGrade,
                              activityMaxGrade,
                              () => resetDetailForm()
                            );
                            setSubmitting(false);
                          }}
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Plus className="h-4 w-4 ml-2" />
                          )}
                          {submitting ? 'جارٍ الإضافة...' : 'إضافة النشاط'}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-lg"
                          onClick={resetDetailForm}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator />

              {/* Parent Info */}
              {selectedStudent.parent && (
                <div>
                  <h4 className="font-semibold text-edutrack-dark mb-3 text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-edutrack-primary" />
                    معلومات ولي الأمر
                  </h4>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-edutrack-primary/20">
                            <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary text-sm font-bold">
                              {getInitials(selectedStudent.parent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-edutrack-dark">
                              {selectedStudent.parent.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ولي الأمر
                            </p>
                          </div>
                        </div>
                        {selectedStudent.parent.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="font-inter" dir="ltr">
                              {selectedStudent.parent.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Close button */}
              <Button
                variant="outline"
                onClick={() => { setDetailOpen(false); resetDetailForm(); }}
                className="w-full rounded-lg mt-2"
              >
                إغلاق
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Quick Add Activity Dialog ───────────────────────── */}
      <Dialog open={quickAddOpen} onOpenChange={(open) => { setQuickAddOpen(open); if (!open) resetQuickForm(); }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <BookOpen className="h-5 w-5 text-edutrack-primary" />
              إضافة نقطة / نشاط
            </DialogTitle>
          </DialogHeader>

          {quickAddStudent && (
            <div className="space-y-3">
              {/* Student name badge */}
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8 border border-edutrack-primary/20">
                  <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary text-xs font-bold">
                    {getInitials(quickAddStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-edutrack-dark">{quickAddStudent.name}</p>
                  {quickAddStudent.section && (
                    <p className="text-xs text-muted-foreground">{quickAddStudent.section.name}</p>
                  )}
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-edutrack-dark">نوع النشاط</Label>
                <Select value={quickActivityType} onValueChange={setQuickActivityType}>
                  <SelectTrigger className="h-9 rounded-lg bg-white border-gray-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOMEWORK">واجب منزلي</SelectItem>
                    <SelectItem value="EXAM">امتحان</SelectItem>
                    <SelectItem value="QUIZ">اختبار قصير</SelectItem>
                    <SelectItem value="PARTICIPATION">مشاركة</SelectItem>
                    <SelectItem value="BEHAVIOR">سلوك</SelectItem>
                    <SelectItem value="NOTE">ملاحظة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs text-edutrack-dark">
                  العنوان <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="مثال: اختبار الفصل الأول"
                  value={quickActivityTitle}
                  onChange={(e) => setQuickActivityTitle(e.target.value)}
                  className="h-9 bg-white border-gray-200 text-sm rounded-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-edutrack-dark">الوصف (اختياري)</Label>
                <Textarea
                  placeholder="أضف ملاحظات أو تفاصيل..."
                  value={quickActivityDesc}
                  onChange={(e) => setQuickActivityDesc(e.target.value)}
                  className="bg-white border-gray-200 text-sm rounded-lg min-h-[60px]"
                  rows={2}
                />
              </div>

              {/* Grade and Max Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-edutrack-dark">النقطة (اختياري)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={quickActivityGrade}
                    onChange={(e) => setQuickActivityGrade(e.target.value)}
                    className="h-9 bg-white border-gray-200 text-sm rounded-lg font-inter"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-edutrack-dark">النقطة القصوى</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    min="0"
                    value={quickActivityMaxGrade}
                    onChange={(e) => setQuickActivityMaxGrade(e.target.value)}
                    className="h-9 bg-white border-gray-200 text-sm rounded-lg font-inter"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                className="w-full rounded-lg bg-edutrack-primary hover:bg-edutrack-primary/90 text-white"
                disabled={quickSubmitting || !quickActivityTitle.trim()}
                onClick={async () => {
                  setQuickSubmitting(true);
                  await handleSubmitActivity(
                    quickAddStudent!,
                    quickActivityType,
                    quickActivityTitle,
                    quickActivityDesc,
                    quickActivityGrade,
                    quickActivityMaxGrade,
                    () => {
                      resetQuickForm();
                      setQuickAddOpen(false);
                    }
                  );
                  setQuickSubmitting(false);
                }}
              >
                {quickSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Plus className="h-4 w-4 ml-2" />
                )}
                {quickSubmitting ? 'جارٍ الإضافة...' : 'إضافة النشاط'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Student Card Sub-component ──────────────────────────────
function StudentCard({
  student,
  index,
  onClick,
  onQuickAdd,
}: {
  student: Student;
  index: number;
  onClick: () => void;
  onQuickAdd: (e: React.MouseEvent) => void;
}) {
  const rate = student.attendance.rate;
  const isWarning = rate < 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Card
        className={`border-0 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer ${getCardRing(rate)}`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <Avatar className={`h-11 w-11 border-2 ${getAvatarBorder(rate)}`}>
              <AvatarFallback
                className={`text-sm font-bold ${getAvatarColors(rate)}`}
              >
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-sm text-edutrack-dark truncate">
                  {student.name}
                </h3>
                {isWarning && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-600 border-red-200 text-[10px] gap-0.5 px-1.5 py-0 flex-shrink-0"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    غياب كثير
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {student.section
                  ? `${student.section.name}${student.section.yearName ? ` - ${student.section.yearName}` : ''}`
                  : student.level}
              </p>
            </div>

            {/* Attendance */}
            <div className="flex flex-col items-end gap-1.5 min-w-[90px] sm:min-w-[100px]">
              <span
                className={`text-base sm:text-lg font-bold font-inter ${getAttendanceColor(rate)}`}
              >
                {rate}%
              </span>
              <Progress
                value={rate}
                className={`h-1.5 w-full ${getAttendanceProgressClass(rate)}`}
              />
              <span className="text-[10px] text-muted-foreground">
                {student.attendance.absent} غياب من {student.attendance.total}
              </span>
            </div>

            {/* Quick Add Grade Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onQuickAdd}
              className="h-8 px-2 rounded-lg border-edutrack-primary/20 text-edutrack-primary hover:bg-edutrack-primary/10 hover:text-edutrack-primary text-[11px] gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">إضافة نقطة</span>
            </Button>

            {/* Chevron */}
            <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
