'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Users,
  GraduationCap,
  School,
  Loader2,
  UserCircle,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionItem {
  id: string;
  name: string;
  studentCount: number;
  capacity: number;
  supervisor: { id: string; name: string } | null;
}

interface YearItem {
  id: string;
  name: string;
  level: string;
  order: number;
  sections: SectionItem[];
}

interface TeacherOption {
  id: string;
  name: string;
  level: string;
  subject: { id: string; name: string; level: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const levelOrder = ['ابتدائي', 'متوسط', 'ثانوي'] as const;

const levelConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  lightBg: string;
  iconBg: string;
  badgeClass: string;
  accentBg: string;
  progressColor: string;
}> = {
  'ابتدائي': {
    label: 'الطور الابتدائي',
    icon: <School className="h-5 w-5" />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    lightBg: 'bg-blue-50/50',
    iconBg: 'bg-blue-100',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    accentBg: 'bg-blue-500',
    progressColor: '[&>div]:bg-blue-500',
  },
  'متوسط': {
    label: 'الطور المتوسط',
    icon: <GraduationCap className="h-5 w-5" />,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    lightBg: 'bg-emerald-50/50',
    iconBg: 'bg-emerald-100',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentBg: 'bg-emerald-500',
    progressColor: '[&>div]:bg-emerald-500',
  },
  'ثانوي': {
    label: 'الطور الثانوي',
    icon: <Building2 className="h-5 w-5" />,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    lightBg: 'bg-purple-50/50',
    iconBg: 'bg-purple-100',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    accentBg: 'bg-purple-500',
    progressColor: '[&>div]:bg-purple-500',
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SectionsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  // Data state
  const [groupedByLevel, setGroupedByLevel] = useState<Record<string, YearItem[]>>({});
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded levels
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['ابتدائي', 'متوسط', 'ثانوي']));
  // Expanded years
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem & { yearId: string } | null>(null);
  const [sectionFormName, setSectionFormName] = useState('');
  const [sectionFormYearId, setSectionFormYearId] = useState('');
  const [sectionFormCapacity, setSectionFormCapacity] = useState('30');
  const [sectionFormSupervisorId, setSectionFormSupervisorId] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  // Year dialog state
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<YearItem | null>(null);
  const [yearFormName, setYearFormName] = useState('');
  const [yearFormLevel, setYearFormLevel] = useState('');
  const [yearFormOrder, setYearFormOrder] = useState('1');
  const [savingYear, setSavingYear] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'year'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchYears = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/years?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setGroupedByLevel(data.groupedByLevel || {});
        // Expand all years by default on first load
        const allYearIds = (data.years || []).map((y: YearItem) => y.id);
        setExpandedYears(new Set(allYearIds));
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  const fetchTeachers = useCallback(async () => {
    if (!institutionId) return;
    try {
      const res = await fetch(`/api/teachers?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.teachers || []);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  useEffect(() => {
    fetchYears();
    fetchTeachers();
  }, [fetchYears, fetchTeachers]);

  // ─── Computed Stats ───────────────────────────────────────────────────────

  const allYears = Object.values(groupedByLevel).flat();
  const allSections = allYears.flatMap((y) => y.sections);
  const totalStudents = allSections.reduce((acc, s) => acc + s.studentCount, 0);
  const totalYears = allYears.length;
  const totalSections = allSections.length;

  // Flat list of years for dropdowns
  const flatYears: Array<{ id: string; name: string; level: string; order: number }> = [];
  for (const level of levelOrder) {
    const years = groupedByLevel[level] || [];
    for (const y of years) {
      flatYears.push({ id: y.id, name: y.name, level: y.level, order: y.order });
    }
  }

  // ─── Level Toggle ─────────────────────────────────────────────────────────

  const toggleLevel = (level: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const toggleYear = (yearId: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(yearId)) {
        next.delete(yearId);
      } else {
        next.add(yearId);
      }
      return next;
    });
  };

  // ─── Section CRUD ─────────────────────────────────────────────────────────

  const openAddSectionDialog = (preselectedYearId?: string) => {
    setEditingSection(null);
    setSectionFormName('');
    setSectionFormYearId(preselectedYearId || '');
    setSectionFormCapacity('30');
    setSectionFormSupervisorId('');
    setSectionDialogOpen(true);
  };

  const openEditSectionDialog = (section: SectionItem, yearId: string) => {
    setEditingSection({ ...section, yearId });
    setSectionFormName(section.name);
    setSectionFormYearId(yearId);
    setSectionFormCapacity(String(section.capacity));
    setSectionFormSupervisorId(section.supervisor?.id || '');
    setSectionDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionFormName.trim() || !sectionFormYearId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const capacity = parseInt(sectionFormCapacity);
    if (isNaN(capacity) || capacity < 1) {
      toast.error('الطاقة الاستيعابية يجب أن تكون رقماً أكبر من 0');
      return;
    }

    setSavingSection(true);
    try {
      const body: Record<string, unknown> = {
        name: sectionFormName.trim(),
        yearId: sectionFormYearId,
        institutionId,
        capacity,
        supervisorId: sectionFormSupervisorId || null,
      };

      if (editingSection) {
        // Update
        const res = await fetch(`/api/sections/${editingSection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sectionFormName.trim(),
            capacity,
            supervisorId: sectionFormSupervisorId || null,
            yearId: sectionFormYearId,
          }),
        });
        if (res.ok) {
          toast.success('تم تعديل القسم بنجاح');
          setSectionDialogOpen(false);
          fetchYears();
        } else {
          const data = await res.json();
          toast.error(data.error || 'حدث خطأ');
        }
      } else {
        // Create
        const res = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('تم إضافة القسم بنجاح');
          setSectionDialogOpen(false);
          fetchYears();
        } else {
          const data = await res.json();
          toast.error(data.error || 'حدث خطأ');
        }
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSavingSection(false);
    }
  };

  // ─── Year CRUD ────────────────────────────────────────────────────────────

  const openAddYearDialog = (preselectedLevel?: string) => {
    setEditingYear(null);
    setYearFormName('');
    setYearFormLevel(preselectedLevel || '');
    setYearFormOrder('1');
    setYearDialogOpen(true);
  };

  const openEditYearDialog = (year: YearItem) => {
    setEditingYear(year);
    setYearFormName(year.name);
    setYearFormLevel(year.level);
    setYearFormOrder(String(year.order));
    setYearDialogOpen(true);
  };

  const handleSaveYear = async () => {
    if (!yearFormName.trim() || !yearFormLevel) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const order = parseInt(yearFormOrder);
    if (isNaN(order) || order < 1) {
      toast.error('الترتيب يجب أن يكون رقماً أكبر من 0');
      return;
    }

    setSavingYear(true);
    try {
      if (editingYear) {
        // Update
        const res = await fetch(`/api/years/${editingYear.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: yearFormName.trim(),
            level: yearFormLevel,
            order,
          }),
        });
        if (res.ok) {
          toast.success('تم تعديل السنة الدراسية بنجاح');
          setYearDialogOpen(false);
          fetchYears();
        } else {
          const data = await res.json();
          toast.error(data.error || 'حدث خطأ');
        }
      } else {
        // Create
        const res = await fetch('/api/years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: yearFormName.trim(),
            level: yearFormLevel,
            order,
            institutionId,
          }),
        });
        if (res.ok) {
          toast.success('تم إضافة السنة الدراسية بنجاح');
          setYearDialogOpen(false);
          fetchYears();
        } else {
          const data = await res.json();
          toast.error(data.error || 'حدث خطأ');
        }
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSavingYear(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const openDeleteDialog = (type: 'section' | 'year', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const endpoint = deleteTarget.type === 'section'
        ? `/api/sections/${deleteTarget.id}`
        : `/api/years/${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        toast.success(
          deleteTarget.type === 'section'
            ? 'تم حذف القسم بنجاح'
            : 'تم حذف السنة الدراسية بنجاح'
        );
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        fetchYears();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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
              <Layers className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة الأقسام
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">تنظيم الأقسام والسنوات الدراسية حسب الطور</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => openAddYearDialog()}
            variant="outline"
            className="h-10 border-edutrack-primary/20 text-edutrack-primary hover:bg-edutrack-primary/5"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة سنة
          </Button>
          <Button
            onClick={() => openAddSectionDialog()}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة قسم
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي السنوات</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{totalYears}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                <School className="h-6 w-6 text-edutrack-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي الأقسام</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{totalSections}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-edutrack-secondary/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-edutrack-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي التلاميذ</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{totalStudents}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-edutrack-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-edutrack-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Levels Accordion */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin" />
                <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
              </div>
            </CardContent>
          </Card>
        ) : totalYears === 0 ? (
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-3">
                <Building2 className="h-12 w-12 text-gray-300" />
                <p className="text-muted-foreground font-medium">لا توجد سنوات دراسية بعد</p>
                <p className="text-xs text-muted-foreground">أضف سنة دراسية جديدة للبدء</p>
                <Button
                  onClick={() => openAddYearDialog()}
                  className="mt-2 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة سنة دراسية
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          levelOrder.map((level) => {
            const config = levelConfig[level];
            const years = groupedByLevel[level] || [];
            const isExpanded = expandedLevels.has(level);
            const levelStudentCount = years.reduce((acc, y) => acc + y.sections.reduce((a, s) => a + s.studentCount, 0), 0);
            const levelSectionCount = years.reduce((acc, y) => acc + y.sections.length, 0);
            const levelCapacity = years.reduce((acc, y) => acc + y.sections.reduce((a, s) => a + s.capacity, 0), 0);

            return (
              <motion.div key={level} variants={itemVariants}>
                <Card className={`border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden`}>
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(level)}
                    className="w-full text-right p-5 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                          <span className={config.textColor}>{config.icon}</span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-edutrack-dark">{config.label}</h2>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              <span className="font-inter font-semibold">{years.length}</span> سنة
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-inter font-semibold">{levelSectionCount}</span> قسم
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-inter font-semibold">{levelStudentCount}</span> تلميذ
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {levelCapacity > 0 && (
                          <div className="hidden sm:flex items-center gap-2">
                            <Progress
                              value={levelCapacity > 0 ? (levelStudentCount / levelCapacity) * 100 : 0}
                              className={`w-24 h-2 ${config.progressColor}`}
                            />
                            <span className="text-xs text-muted-foreground font-inter">
                              {levelCapacity > 0 ? Math.round((levelStudentCount / levelCapacity) * 100) : 0}%
                            </span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddYearDialog(level);
                          }}
                          title="إضافة سنة"
                        >
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </div>
                  </button>

                  {/* Level Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          {years.length === 0 ? (
                            <div className={`rounded-xl ${config.bgColor} p-6 text-center`}>
                              <p className="text-sm text-muted-foreground">لا توجد سنوات دراسية في هذا الطور</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`mt-2 ${config.textColor} hover:${config.bgColor}`}
                                onClick={() => openAddYearDialog(level)}
                              >
                                <Plus className="h-4 w-4 ml-1" />
                                إضافة سنة
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {years.map((year) => {
                                const isYearExpanded = expandedYears.has(year.id);
                                const yearStudentCount = year.sections.reduce((a, s) => a + s.studentCount, 0);
                                const yearCapacity = year.sections.reduce((a, s) => a + s.capacity, 0);

                                return (
                                  <div key={year.id} className={`rounded-xl border ${config.borderColor} ${config.lightBg} overflow-hidden`}>
                                    {/* Year Header */}
                                    <button
                                      onClick={() => toggleYear(year.id)}
                                      className="w-full text-right p-4 hover:bg-white/50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className={`h-8 w-8 rounded-lg ${config.accentBg} flex items-center justify-center`}>
                                            <span className="text-white text-sm font-bold font-inter">{year.order}</span>
                                          </div>
                                          <div>
                                            <h3 className="font-semibold text-edutrack-dark text-sm">{year.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <Badge variant="outline" className={`${config.badgeClass} text-[10px] h-5 px-1.5`}>
                                                {year.sections.length} قسم
                                              </Badge>
                                              <span className="text-[10px] text-muted-foreground font-inter">
                                                {yearStudentCount}/{yearCapacity} تلميذ
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditYearDialog(year);
                                            }}
                                            title="تعديل السنة"
                                          >
                                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openAddSectionDialog(year.id);
                                            }}
                                            title="إضافة قسم"
                                          >
                                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDeleteDialog('year', year.id, year.name);
                                            }}
                                            title="حذف السنة"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                          </Button>
                                          <motion.div
                                            animate={{ rotate: isYearExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mr-1"
                                          >
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          </motion.div>
                                        </div>
                                      </div>
                                    </button>

                                    {/* Year Content - Sections Grid */}
                                    <AnimatePresence>
                                      {isYearExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-4 pb-4">
                                            {year.sections.length === 0 ? (
                                              <div className="bg-white rounded-lg p-4 text-center">
                                                <p className="text-xs text-muted-foreground">لا توجد أقسام في هذه السنة</p>
                                                <Button
                                                  variant="link"
                                                  size="sm"
                                                  className="text-edutrack-primary h-6 text-xs"
                                                  onClick={() => openAddSectionDialog(year.id)}
                                                >
                                                  إضافة قسم
                                                </Button>
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {year.sections.map((section, index) => {
                                                  const fillPercent = section.capacity > 0 ? Math.round((section.studentCount / section.capacity) * 100) : 0;
                                                  const isOverCapacity = section.studentCount > section.capacity;

                                                  return (
                                                    <motion.div
                                                      key={section.id}
                                                      initial={{ opacity: 0, y: 10 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      transition={{ delay: index * 0.05, duration: 0.3 }}
                                                    >
                                                      <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <CardContent className="p-4">
                                                          {/* Section Header */}
                                                          <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                              <div className={`h-8 w-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
                                                                <Building2 className={`h-4 w-4 ${config.textColor}`} />
                                                              </div>
                                                              <div>
                                                                <h4 className="font-semibold text-edutrack-dark text-sm">{section.name}</h4>
                                                                <p className="text-[10px] text-muted-foreground">{year.name}</p>
                                                              </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => openEditSectionDialog(section, year.id)}
                                                                title="تعديل"
                                                              >
                                                                <Pencil className="h-3 w-3 text-edutrack-primary" />
                                                              </Button>
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0"
                                                                onClick={() => openDeleteDialog('section', section.id, section.name)}
                                                                title="حذف"
                                                              >
                                                                <Trash2 className="h-3 w-3 text-red-400" />
                                                              </Button>
                                                            </div>
                                                          </div>

                                                          {/* Student Count / Capacity */}
                                                          <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                              <div className="flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className={`text-sm font-inter font-semibold ${isOverCapacity ? 'text-red-500' : 'text-edutrack-dark'}`}>
                                                                  {section.studentCount}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">/ {section.capacity}</span>
                                                              </div>
                                                              <span className={`text-[10px] font-inter font-medium ${
                                                                isOverCapacity ? 'text-red-500' : fillPercent >= 90 ? 'text-amber-500' : 'text-muted-foreground'
                                                              }`}>
                                                                {fillPercent}%
                                                              </span>
                                                            </div>
                                                            <Progress
                                                              value={Math.min(fillPercent, 100)}
                                                              className={`h-1.5 ${
                                                                isOverCapacity
                                                                  ? '[&>div]:bg-red-500'
                                                                  : fillPercent >= 90
                                                                    ? '[&>div]:bg-amber-500'
                                                                    : config.progressColor
                                                              }`}
                                                            />
                                                          </div>

                                                          {/* Supervisor */}
                                                          <div className="flex items-center gap-2">
                                                            {section.supervisor ? (
                                                              <>
                                                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-xs text-edutrack-dark truncate">{section.supervisor.name}</span>
                                                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-gray-50 border-gray-200 text-muted-foreground">
                                                                  المشرف
                                                                </Badge>
                                                              </>
                                                            ) : (
                                                              <>
                                                                <UserCircle className="h-3.5 w-3.5 text-gray-300" />
                                                                <span className="text-xs text-muted-foreground">بدون مشرف</span>
                                                              </>
                                                            )}
                                                          </div>
                                                        </CardContent>
                                                      </Card>
                                                    </motion.div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Section Dialog ────────────────────────────────────────────────── */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Building2 className="h-5 w-5 text-edutrack-primary" />
              {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم القسم *</Label>
              <Input
                placeholder="مثال: قسم أ، علوم تجريبية"
                value={sectionFormName}
                onChange={(e) => setSectionFormName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">السنة الدراسية *</Label>
              <Select value={sectionFormYearId} onValueChange={setSectionFormYearId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  {flatYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} ({levelConfig[y.level]?.label || y.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الطاقة الاستيعابية *</Label>
              <Input
                type="number"
                placeholder="30"
                value={sectionFormCapacity}
                onChange={(e) => setSectionFormCapacity(e.target.value)}
                className="h-11 font-inter"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">المشرف</Label>
              <Select value={sectionFormSupervisorId} onValueChange={setSectionFormSupervisorId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المشرف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مشرف</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} — {t.subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setSectionDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSection}
              disabled={savingSection || !sectionFormName.trim() || !sectionFormYearId}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {savingSection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingSection ? 'حفظ التعديلات' : 'إضافة القسم'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Year Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <School className="h-5 w-5 text-edutrack-primary" />
              {editingYear ? 'تعديل السنة الدراسية' : 'إضافة سنة دراسية جديدة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم السنة الدراسية *</Label>
              <Input
                placeholder="مثال: السنة الأولى متوسط"
                value={yearFormName}
                onChange={(e) => setYearFormName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الطور الدراسي *</Label>
              <Select value={yearFormLevel} onValueChange={setYearFormLevel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الطور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="ثانوي">ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">الترتيب *</Label>
              <Input
                type="number"
                placeholder="1"
                value={yearFormOrder}
                onChange={(e) => setYearFormOrder(e.target.value)}
                className="h-11 font-inter"
                min="1"
              />
              <p className="text-[10px] text-muted-foreground">يُستخدم لترتيب السنوات داخل الطور (1 = الأولى)</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setYearDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveYear}
              disabled={savingYear || !yearFormName.trim() || !yearFormLevel}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {savingYear ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingYear ? 'حفظ التعديلات' : 'إضافة السنة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.type === 'year' ? (
              <>
                هل أنت متأكد من حذف السنة الدراسية <span className="font-semibold text-edutrack-dark">&quot;{deleteTarget?.name}&quot;</span>؟
                سيتم حذف جميع الأقسام التابعة لها أيضاً. لا يمكن التراجع عن هذا الإجراء.
              </>
            ) : (
              <>
                هل أنت متأكد من حذف القسم <span className="font-semibold text-edutrack-dark">&quot;{deleteTarget?.name}&quot;</span>؟
                لا يمكن التراجع عن هذا الإجراء.
              </>
            )}
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white h-10"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
