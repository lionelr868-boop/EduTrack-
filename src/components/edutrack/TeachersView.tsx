'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Users,
  Search,
  Plus,
  Mail,
  Pencil,
  Power,
  Send,
  Loader2,
  BookOpen,
  UserCheck,
  UserX,
  Phone,
  GraduationCap,
  Eye,
  KeyRound,
  UserPlus,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface TeacherSubject {
  id: string;
  name: string;
  level: string;
}

interface SupervisedSection {
  id: string;
  name: string;
  year: { name: string; level: string };
  studentCount: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  level: string;
  subject: TeacherSubject | null;
  phone: string | null;
  specialization: string | null;
  supervisedSections: SupervisedSection[];
}

interface SubjectOption {
  id: string;
  name: string;
  level: string;
}

// ─── Level Config ──────────────────────────────────────────
const levelLabels: Record<string, string> = {
  'ابتدائي': 'ابتدائي',
  'متوسط': 'متوسط',
  'ثانوي': 'ثانوي',
};

const levelColors: Record<string, string> = {
  'ابتدائي': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'متوسط': 'bg-amber-100 text-amber-700 border-amber-200',
  'ثانوي': 'bg-violet-100 text-violet-700 border-violet-200',
};

const levelBgColors: Record<string, string> = {
  'ابتدائي': 'bg-emerald-50',
  'متوسط': 'bg-amber-50',
  'ثانوي': 'bg-violet-50',
};

// ─── Animation Variants ────────────────────────────────────
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Main Component ────────────────────────────────────────
export default function TeachersView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Disabled teacher IDs (simulated state)
  const [disabledTeachers, setDisabledTeachers] = useState<Set<string>>(new Set());

  // Add teacher dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addLevel, setAddLevel] = useState('');
  const [addSubjectId, setAddSubjectId] = useState('');
  const [addSpecialization, setAddSpecialization] = useState('');
  const [adding, setAdding] = useState(false);

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editLevel, setEditLevel] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [saving, setSaving] = useState(false);

  // Section details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsTeacher, setDetailsTeacher] = useState<Teacher | null>(null);

  // Subjects list
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Filter level for the main view
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // ─── Fetch Teachers ────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ institutionId });
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/teachers?${params}`);
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('حدث خطأ أثناء تحميل الأساتذة');
    } finally {
      setLoading(false);
    }
  }, [institutionId, searchQuery]);

  // ─── Fetch Subjects ────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/teachers/subjects?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // ─── Filter subjects by level for add dialog ──────────
  const filteredSubjects = addLevel
    ? subjects.filter((s) => s.level === addLevel)
    : [];

  const editFilteredSubjects = editLevel
    ? subjects.filter((s) => s.level === editLevel)
    : [];

  // ─── Filter teachers by level ─────────────────────────
  const filteredTeachers = filterLevel === 'all'
    ? teachers
    : teachers.filter((t) => t.level === filterLevel);

  const activeTeachers = filteredTeachers.filter((t) => !disabledTeachers.has(t.id));
  const disabledCount = filteredTeachers.length - activeTeachers.length;

  // ─── Level stats ──────────────────────────────────────
  const levelStats = {
    'ابتدائي': teachers.filter((t) => t.level === 'ابتدائي').length,
    'متوسط': teachers.filter((t) => t.level === 'متوسط').length,
    'ثانوي': teachers.filter((t) => t.level === 'ثانوي').length,
  };

  // ─── Handle Add Teacher ───────────────────────────────
  const handleAddTeacher = async () => {
    if (!addName.trim()) {
      toast.error('يرجى إدخال اسم الأستاذ');
      return;
    }
    if (!addEmail.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (!addPassword || addPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (!addLevel) {
      toast.error('يرجى اختيار الطور الدراسي');
      return;
    }
    if (!addSubjectId) {
      toast.error('يرجى اختيار المادة الدراسية');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          email: addEmail.trim(),
          password: addPassword,
          institutionId,
          level: addLevel,
          subjectId: addSubjectId,
          phone: addPhone.trim() || undefined,
          specialization: addSpecialization.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('تم إضافة الأستاذ بنجاح');
        resetAddForm();
        setAddDialogOpen(false);
        fetchTeachers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء الإضافة');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setAdding(false);
    }
  };

  const resetAddForm = () => {
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddPhone('');
    setAddLevel('');
    setAddSubjectId('');
    setAddSpecialization('');
  };

  // ─── Handle Invite ────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('يرجى إدخال البريد الإلكتروني');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/teachers/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          institutionId,
        }),
      });

      if (res.ok) {
        toast.success('تم إرسال الدعوة بنجاح');
        setInviteDialogOpen(false);
        setInviteEmail('');
        fetchTeachers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setInviting(false);
    }
  };

  // ─── Handle Toggle Status ─────────────────────────────
  const handleToggleStatus = (teacherId: string) => {
    setDisabledTeachers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
        toast.success('تم تفعيل الأستاذ');
      } else {
        newSet.add(teacherId);
        toast.success('تم تعطيل الأستاذ');
      }
      return newSet;
    });
  };

  // ─── Open Edit Dialog ─────────────────────────────────
  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditLevel(teacher.level);
    setEditSubjectId(teacher.subject?.id || '');
    setEditPhone(teacher.phone || '');
    setEditSpecialization(teacher.specialization || '');
    setEditDialogOpen(true);
  };

  // ─── Handle Save Edit ─────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    setSaving(true);
    try {
      // Simulate save (could be expanded to a real PUT endpoint)
      await new Promise((r) => setTimeout(r, 500));
      toast.success('تم تعديل بيانات الأستاذ بنجاح');
      setEditDialogOpen(false);
      setEditingTeacher(null);
      fetchTeachers();
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ─── Open Details Dialog ──────────────────────────────
  const openDetails = (teacher: Teacher) => {
    setDetailsTeacher(teacher);
    setDetailsDialogOpen(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0"
      dir="rtl"
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة الأساتذة
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة ومتابعة أساتذة المؤسسة</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setInviteDialogOpen(true)}
            variant="outline"
            className="border-edutrack-primary/30 text-edutrack-primary hover:bg-edutrack-primary/5 h-10"
          >
            <Mail className="h-4 w-4 ml-2" />
            دعوة بالبريد
          </Button>
          <Button
            onClick={() => {
              resetAddForm();
              setAddDialogOpen(true);
            }}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
          >
            <UserPlus className="h-4 w-4 ml-2" />
            إضافة أستاذ
          </Button>
        </div>
      </motion.div>

      {/* ─── Summary Cards ───────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي الأساتذة</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{teachers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-edutrack-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">النشطون</p>
                <p className="text-2xl font-bold text-emerald-600 font-inter">{activeTeachers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">المعطلون</p>
                <p className="text-2xl font-bold text-red-600 font-inter">{disabledCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">ابتدائي</span>
                  <span className="text-[10px] font-bold text-edutrack-dark font-inter">{levelStats['ابتدائي']}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground">متوسط</span>
                  <span className="text-[10px] font-bold text-edutrack-dark font-inter">{levelStats['متوسط']}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-[10px] text-muted-foreground">ثانوي</span>
                  <span className="text-[10px] font-bold text-edutrack-dark font-inter">{levelStats['ثانوي']}</span>
                </div>
              </div>
              <GraduationCap className="h-5 w-5 text-muted-foreground mr-auto" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Search & Filter ─────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الأستاذ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-10 bg-white border-gray-200 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">تصفية حسب الطور:</span>
          <div className="flex gap-1.5">
            {[
              { value: 'all', label: 'الكل' },
              { value: 'ابتدائي', label: 'ابتدائي' },
              { value: 'متوسط', label: 'متوسط' },
              { value: 'ثانوي', label: 'ثانوي' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterLevel(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  filterLevel === opt.value
                    ? opt.value === 'all'
                      ? 'bg-edutrack-primary text-white shadow-sm'
                      : opt.value === 'ابتدائي'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : opt.value === 'متوسط'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-violet-500 text-white shadow-sm'
                    : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Teachers Grid ───────────────────────────────── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-md shadow-gray-100/80 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 animate-pulse" />
                  <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">لا يوجد أساتذة</p>
            <p className="text-sm text-muted-foreground">أضف أستاذ جديد للبدء</p>
          </div>
        ) : (
          filteredTeachers.map((teacher, index) => {
            const isDisabled = disabledTeachers.has(teacher.id);
            const initials = teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
            const levelBadge = levelColors[teacher.level] || 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <motion.div
                key={teacher.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.06 }}
              >
                <Card className={`border-0 shadow-md shadow-gray-100/80 bg-white hover:shadow-lg transition-all duration-300 group overflow-hidden ${isDisabled ? 'opacity-60' : ''}`}>
                  {/* Top accent */}
                  <div className={`h-1.5 ${isDisabled ? 'bg-gray-300' : 'bg-gradient-to-l from-edutrack-primary to-edutrack-secondary'}`} />
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar + Level */}
                      <div className="relative mb-3">
                        <Avatar className={`h-16 w-16 border-2 shadow-md group-hover:scale-105 transition-transform ${isDisabled ? 'border-gray-300' : 'border-edutrack-primary/20'}`}>
                          <AvatarFallback className={`${isDisabled ? 'bg-gray-100 text-gray-500' : 'bg-edutrack-primary/10 text-edutrack-primary'} text-lg font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Level badge on avatar */}
                        <Badge className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0 border ${levelBadge} whitespace-nowrap`}>
                          {teacher.level}
                        </Badge>
                      </div>

                      {/* Name */}
                      <h3 className="font-bold text-edutrack-dark text-base mt-1">{teacher.name}</h3>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {teacher.email}
                      </p>

                      {/* Phone */}
                      {teacher.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="font-inter" dir="ltr">{teacher.phone}</span>
                        </p>
                      )}

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`mt-2 text-xs ${
                          isDisabled
                            ? 'bg-gray-50 text-gray-500 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isDisabled ? 'معطل' : 'نشط'}
                      </Badge>

                      {/* Subject */}
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {teacher.subject ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-edutrack-primary/5 text-edutrack-primary border-edutrack-primary/10"
                          >
                            <BookOpen className="h-2.5 w-2.5 ml-1" />
                            {teacher.subject.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">لا توجد مادة</span>
                        )}
                        {teacher.specialization && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {teacher.specialization}
                          </Badge>
                        )}
                      </div>

                      {/* Supervised Sections */}
                      {teacher.supervisedSections.length > 0 && (
                        <div className="mt-2 w-full">
                          <p className="text-[10px] text-muted-foreground mb-1">الأقسام المشرفة:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {teacher.supervisedSections.slice(0, 3).map((sec) => (
                              <Badge
                                key={sec.id}
                                variant="outline"
                                className="text-[9px] bg-gray-50 text-gray-600 border-gray-200"
                              >
                                {sec.name} - {sec.year.name}
                              </Badge>
                            ))}
                            {teacher.supervisedSections.length > 3 && (
                              <Badge variant="outline" className="text-[9px] bg-gray-50 text-gray-500 border-gray-200">
                                +{teacher.supervisedSections.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator className="my-3" />

                      {/* Actions */}
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => openDetails(teacher)}
                        >
                          <Eye className="h-3.5 w-3.5 ml-1" />
                          عرض
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => openEditDialog(teacher)}
                        >
                          <Pencil className="h-3.5 w-3.5 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 text-xs px-2 ${isDisabled ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                          onClick={() => handleToggleStatus(teacher.id)}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ─── Add Teacher Dialog ──────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) resetAddForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <div className="h-8 w-8 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-edutrack-primary" />
              </div>
              إضافة أستاذ جديد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                اسم الأستاذ <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="مثال: أحمد منصوري"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="h-11 text-right"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                البريد الإلكتروني <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="example@email.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="pr-10 h-11"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                كلمة المرور <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="6 أحرف على الأقل"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="pr-10 h-11"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="0555123456"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="pr-10 h-11"
                  dir="ltr"
                />
              </div>
            </div>

            <Separator />

            {/* Level Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                الطور الدراسي <span className="text-red-500">*</span>
              </Label>
              <Select
                value={addLevel}
                onValueChange={(value) => {
                  setAddLevel(value);
                  setAddSubjectId(''); // Reset subject when level changes
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الطور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ابتدائي">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      ابتدائي
                    </div>
                  </SelectItem>
                  <SelectItem value="متوسط">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      متوسط
                    </div>
                  </SelectItem>
                  <SelectItem value="ثانوي">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                      ثانوي
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                المادة الدراسية <span className="text-red-500">*</span>
              </Label>
              <Select
                value={addSubjectId}
                onValueChange={setAddSubjectId}
                disabled={!addLevel}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={addLevel ? 'اختر المادة' : 'اختر الطور أولاً'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.length > 0 ? (
                    filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-edutrack-primary" />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      لا توجد مواد لهذا الطور
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {addLevel && filteredSubjects.length === 0 && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  لا توجد مواد مسجلة لهذا الطور بعد
                </p>
              )}
            </div>

            {/* Specialization */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">التخصص</Label>
              <Input
                placeholder="مثال: رياضيات متقدمة"
                value={addSpecialization}
                onChange={(e) => setAddSpecialization(e.target.value)}
                className="h-11 text-right"
              />
              <p className="text-[10px] text-muted-foreground">اختياري — يظهر في بطاقة الأستاذ</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                resetAddForm();
              }}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddTeacher}
              disabled={adding || !addName.trim() || !addEmail.trim() || !addPassword || !addLevel || !addSubjectId}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة الأستاذ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Invite Teacher Dialog ───────────────────────── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Mail className="h-5 w-5 text-edutrack-primary" />
              دعوة أستاذ بالبريد الإلكتروني
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="example@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pr-10 h-11"
                  dir="ltr"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                سيتم إرسال رابط دعوة إلى هذا البريد للتسجيل في المنصة
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 ml-2" />
                  إرسال الدعوة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Teacher Dialog ─────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Pencil className="h-5 w-5 text-edutrack-primary" />
              تعديل بيانات الأستاذ
            </DialogTitle>
          </DialogHeader>

          {editingTeacher && (
            <div className="space-y-4">
              {/* Teacher info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Avatar className="h-10 w-10 border-2 border-edutrack-primary/20">
                  <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary text-sm font-bold">
                    {editingTeacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-edutrack-dark text-sm">{editingTeacher.name}</p>
                  <p className="text-xs text-muted-foreground">{editingTeacher.email}</p>
                </div>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">الطور الدراسي</Label>
                <Select value={editLevel} onValueChange={(value) => {
                  setEditLevel(value);
                  setEditSubjectId('');
                }}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="ثانوي">ثانوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">المادة الدراسية</Label>
                <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {editFilteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">رقم الهاتف</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-11"
                  dir="ltr"
                />
              </div>

              {/* Specialization */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">التخصص</Label>
                <Input
                  value={editSpecialization}
                  onChange={(e) => setEditSpecialization(e.target.value)}
                  className="h-11 text-right"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Teacher Details Dialog ──────────────────────── */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Eye className="h-5 w-5 text-edutrack-primary" />
              تفاصيل الأستاذ
            </DialogTitle>
          </DialogHeader>

          {detailsTeacher && (
            <div className="space-y-5">
              {/* Profile Header */}
              <div className={`rounded-xl p-5 ${levelBgColors[detailsTeacher.level] || 'bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary text-xl font-bold">
                      {detailsTeacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-edutrack-dark text-lg">{detailsTeacher.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {detailsTeacher.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] border ${levelColors[detailsTeacher.level] || ''}`}>
                        {detailsTeacher.level}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] bg-edutrack-primary/5 text-edutrack-primary">
                        <BookOpen className="h-2.5 w-2.5 ml-1" />
                        {detailsTeacher.subject?.name || 'لا توجد مادة'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {detailsTeacher.phone && (
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-muted-foreground mb-0.5">الهاتف</p>
                    <p className="text-sm font-medium text-edutrack-dark font-inter" dir="ltr">{detailsTeacher.phone}</p>
                  </div>
                )}
                {detailsTeacher.specialization && (
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-[10px] text-muted-foreground mb-0.5">التخصص</p>
                    <p className="text-sm font-medium text-edutrack-dark">{detailsTeacher.specialization}</p>
                  </div>
                )}
              </div>

              {/* Supervised Sections */}
              <div>
                <h4 className="text-sm font-bold text-edutrack-dark mb-2 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-edutrack-primary" />
                  الأقسام المشرفة
                  <Badge variant="secondary" className="text-[10px]">
                    {detailsTeacher.supervisedSections.length}
                  </Badge>
                </h4>
                {detailsTeacher.supervisedSections.length > 0 ? (
                  <ScrollArea className="max-h-40">
                    <div className="space-y-2">
                      {detailsTeacher.supervisedSections.map((sec) => (
                        <div
                          key={sec.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-edutrack-dark">{sec.name}</p>
                            <p className="text-[10px] text-muted-foreground">{sec.year.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span className="font-inter">{sec.studentCount}</span>
                            <span>طالب</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground py-3 text-center">لا يشرف على أقسام حالياً</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
