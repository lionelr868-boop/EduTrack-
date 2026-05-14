'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Filter,
  UserCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  FileText,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────

interface ParentInfo {
  id: string;
  userId: string;
  phone: string | null;
  user: { name: string; email: string };
}

interface SectionInfo {
  id: string;
  name: string;
  year: { id: string; name: string; level: string; order: number };
  supervisor?: { id: string; user: { name: string } } | null;
}

interface Student {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
  institutionId: string;
  sectionId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
  parent: ParentInfo | null;
  section: SectionInfo | null;
}

interface StudentDetail extends Student {
  absences: Array<{
    id: string;
    reason: string | null;
    createdAt: string;
    session: { subject: { name: string } } | null;
  }>;
  attendances: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
    session: { subject: { name: string } } | null;
  }>;
  invoices: Array<{
    id: string;
    month: number;
    year: number;
    amount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    lineItems: Array<{
      id: string;
      subjectName: string;
      totalSessions: number;
      absentSessions: number;
      pricePerSession: number;
      subtotal: number;
    }>;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    grade: number | null;
    maxGrade: number | null;
    date: string;
    teacher: { user: { name: string }; subject: { name: string } };
    section: { id: string; name: string };
  }>;
  attendanceSummary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  };
}

interface ParentOption {
  id: string;
  name: string;
  phone: string | null;
}

interface SectionOption {
  id: string;
  name: string;
  yearId: string;
  yearName: string;
  yearLevel: string;
  yearOrder: number;
}

// ─── Constants ────────────────────────────────────────────────────

const levelLabels: Record<string, string> = {
  'ابتدائي': 'ابتدائي',
  'متوسط': 'متوسط',
  'ثانوي': 'ثانوي',
};

const levelColors: Record<string, string> = {
  'ابتدائي': 'bg-blue-50 text-blue-700 border-blue-200',
  'متوسط': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ثانوي': 'bg-purple-50 text-purple-700 border-purple-200',
};

const genderLabels: Record<string, string> = {
  'ذكر': 'ذكر',
  'أنثى': 'أنثى',
};

const invoiceStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'مدفوعة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE: { label: 'متأخرة', color: 'bg-red-50 text-red-700 border-red-200' },
};

const activityTypeLabels: Record<string, string> = {
  HOMEWORK: 'واجب منزلي',
  EXAM: 'امتحان',
  QUIZ: 'اختبار قصير',
  PARTICIPATION: 'مشاركة',
  BEHAVIOR: 'سلوك',
  NOTE: 'ملاحظة',
};

const activityTypeColors: Record<string, string> = {
  HOMEWORK: 'bg-sky-50 text-sky-700 border-sky-200',
  EXAM: 'bg-rose-50 text-rose-700 border-rose-200',
  QUIZ: 'bg-violet-50 text-violet-700 border-violet-200',
  PARTICIPATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BEHAVIOR: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE: 'bg-gray-50 text-gray-700 border-gray-200',
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ─── Component ────────────────────────────────────────────────────

export default function StudentsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  // ─── Table state ───
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // ─── Add/Edit dialog ───
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formDateOfBirth, setFormDateOfBirth] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── Delete dialog ───
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Detail sheet ───
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  // Edit form state for detail sheet
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // ─── Data ───
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  // ─── Helpers ───

  const filteredSectionsForLevel = (level: string) =>
    sections.filter((s) => s.yearLevel === level);

  const filteredSectionsForFilter = levelFilter === 'all'
    ? sections
    : sections.filter((s) => s.yearLevel === levelFilter);

  // ─── Fetch students ───

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        institutionId,
        page: page.toString(),
        limit: '10',
      });
      if (searchQuery) params.set('search', searchQuery);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (sectionFilter !== 'all') params.set('sectionId', sectionFilter);

      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('حدث خطأ أثناء تحميل التلاميذ');
    } finally {
      setLoading(false);
    }
  }, [institutionId, page, searchQuery, levelFilter, sectionFilter]);

  const fetchParents = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/parents?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setParents(data.parents);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/sections?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: SectionOption[] = (data.sections || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          name: s.name as string,
          yearId: (s.year as Record<string, unknown>)?.id as string,
          yearName: (s.year as Record<string, unknown>)?.name as string,
          yearLevel: (s.year as Record<string, unknown>)?.level as string,
          yearOrder: (s.year as Record<string, unknown>)?.order as number,
        }));
        setSections(mapped);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchParents();
    fetchSections();
  }, [fetchParents, fetchSections]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, levelFilter, sectionFilter]);

  // Reset section filter when level changes
  useEffect(() => {
    setSectionFilter('all');
  }, [levelFilter]);

  // ─── Add/Edit dialog handlers ───

  const resetForm = () => {
    setFormName('');
    setFormLevel('');
    setFormSectionId('');
    setFormParentId('');
    setFormDateOfBirth('');
    setFormGender('');
    setFormPhone('');
    setFormAddress('');
  };

  const openAddDialog = () => {
    setEditingStudent(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormLevel(student.level);
    setFormSectionId(student.sectionId || '');
    setFormParentId(student.parentId || '');
    setFormDateOfBirth(student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '');
    setFormGender(student.gender || '');
    setFormPhone(student.phone || '');
    setFormAddress(student.address || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formLevel) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: formName.trim(),
        level: formLevel,
        institutionId,
        sectionId: formSectionId || null,
        parentId: formParentId || null,
        dateOfBirth: formDateOfBirth || null,
        gender: formGender || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
      };

      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingStudent ? 'تم تعديل التلميذ بنجاح' : 'تم إضافة التلميذ بنجاح');
        setDialogOpen(false);
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف التلميذ بنجاح');
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchStudents();
      } else {
        toast.error('حدث خطأ أثناء الحذف');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Detail sheet ───

  const openDetailSheet = async (student: Student) => {
    setDetailLoading(true);
    setDetailOpen(true);
    setDetailEditMode(false);
    setSelectedStudent(null);

    try {
      const res = await fetch(`/api/students/${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedStudent(data);
        // Populate edit fields
        setEditName(data.name);
        setEditLevel(data.level);
        setEditSectionId(data.sectionId || '');
        setEditParentId(data.parentId || '');
        setEditDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '');
        setEditGender(data.gender || '');
        setEditPhone(data.phone || '');
        setEditAddress(data.address || '');
      } else {
        toast.error('حدث خطأ أثناء تحميل بيانات التلميذ');
        setDetailOpen(false);
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDetailSave = async () => {
    if (!selectedStudent || !editName.trim() || !editLevel) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setDetailSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        level: editLevel,
        sectionId: editSectionId || null,
        parentId: editParentId || null,
        dateOfBirth: editDateOfBirth || null,
        gender: editGender || null,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
      };

      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('تم تعديل التلميذ بنجاح');
        setDetailEditMode(false);
        // Refresh detail
        const detailRes = await fetch(`/api/students/${selectedStudent.id}`);
        if (detailRes.ok) {
          const data = await detailRes.json();
          setSelectedStudent(data);
        }
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setDetailSaving(false);
    }
  };

  // ─── Render helpers ───

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-DZ');
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'LATE':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAttendanceStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'حاضر';
      case 'ABSENT': return 'غائب';
      case 'LATE': return 'متأخر';
      default: return status;
    }
  };

  // ─── Render ───

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
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة التلاميذ
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة وتتبع تلاميذ المؤسسة</p>
        </div>

        <Button
          onClick={openAddDialog}
          className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة تلميذ
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي التلاميذ</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-edutrack-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المستوى الابتدائي</p>
                <p className="text-2xl font-bold text-blue-600 font-inter">
                  {students.filter(s => s.level === 'ابتدائي').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المستوى المتوسط</p>
                <p className="text-2xl font-bold text-emerald-600 font-inter">
                  {students.filter(s => s.level === 'متوسط').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardContent className="p-5">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث باسم التلميذ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-10 bg-gray-50 border-gray-200"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[140px] h-10 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="المستوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المستويات</SelectItem>
                    <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                    <SelectItem value="متوسط">متوسط</SelectItem>
                    <SelectItem value="ثانوي">ثانوي</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                  <SelectTrigger className="w-[160px] h-10 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأقسام</SelectItem>
                    {filteredSectionsForFilter.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.yearName} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-right font-semibold text-edutrack-dark">الاسم</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">المستوى</TableHead>
                    <TableHead className="text-right font-semibold text-edutrack-dark">القسم</TableHead>
                    <TableHead className="text-right font-semibold text-edutrack-dark">ولي الأمر</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">تاريخ التسجيل</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-5 bg-gray-100 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <GraduationCap className="h-12 w-12 text-gray-300" />
                          <p className="text-muted-foreground">لا يوجد تلاميذ</p>
                          <p className="text-xs text-muted-foreground">أضف تلميذ جديد للبدء</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="border-b border-gray-100 hover:bg-edutrack-primary/5 transition-colors cursor-pointer"
                        onClick={() => openDetailSheet(student)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-edutrack-primary">
                                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-edutrack-dark text-sm block">{student.name}</span>
                              {student.gender && (
                                <span className="text-xs text-muted-foreground">{genderLabels[student.gender] || student.gender}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${levelColors[student.level] || 'bg-gray-50 text-gray-700 border-gray-200'} text-xs`}>
                            {levelLabels[student.level] || student.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.section ? (
                            <span className="text-sm text-edutrack-dark">
                              {student.section.year?.name} - {student.section.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.parent ? (
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-edutrack-dark">{student.parent.user.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-inter text-sm text-muted-foreground">
                          {formatDate(student.enrollmentDate || student.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-edutrack-primary hover:text-edutrack-primary/80 hover:bg-edutrack-primary/5"
                              onClick={() => openEditDialog(student)}
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingId(student.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-muted-foreground font-inter">
                  عرض <span className="font-semibold">{(page - 1) * 10 + 1}</span> - <span className="font-semibold">{Math.min(page * 10, total)}</span> من <span className="font-semibold">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-inter">{page} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Add/Edit Student Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              {editingStudent ? 'تعديل التلميذ' : 'إضافة تلميذ جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم التلميذ *</Label>
              <Input
                placeholder="أدخل اسم التلميذ"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">تاريخ الميلاد</Label>
              <Input
                type="date"
                value={formDateOfBirth}
                onChange={(e) => setFormDateOfBirth(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">الجنس</Label>
              <Select value={formGender} onValueChange={setFormGender}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">المستوى *</Label>
              <Select
                value={formLevel}
                onValueChange={(val) => {
                  setFormLevel(val);
                  setFormSectionId(''); // Reset section when level changes
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="ثانوي">ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Section (filtered by level) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">القسم</Label>
              <Select value={formSectionId} onValueChange={setFormSectionId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون قسم</SelectItem>
                  {formLevel &&
                    filteredSectionsForLevel(formLevel).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.yearName} - {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">ولي الأمر</Label>
              <Select value={formParentId} onValueChange={setFormParentId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر ولي الأمر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون ولي أمر</SelectItem>
                  {parents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">رقم هاتف التلميذ</Label>
              <Input
                placeholder="رقم الهاتف (اختياري)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="h-11"
                dir="ltr"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">عنوان السكن</Label>
              <Input
                placeholder="عنوان السكن (اختياري)"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formLevel}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingStudent ? 'حفظ التعديلات' : 'إضافة التلميذ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من حذف هذا التلميذ؟ لا يمكن التراجع عن هذا الإجراء.
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

      {/* ─── Student Detail Sheet ─── */}
      <Sheet open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailEditMode(false); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0" dir="rtl">
          {detailLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-edutrack-primary" />
            </div>
          ) : selectedStudent ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="p-5 pb-3 border-b bg-gradient-to-l from-edutrack-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-3 text-edutrack-dark">
                    <div className="h-12 w-12 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-edutrack-primary">
                        {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-lg">{selectedStudent.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`${levelColors[selectedStudent.level] || ''} text-xs`}>
                          {levelLabels[selectedStudent.level] || selectedStudent.level}
                        </Badge>
                        {selectedStudent.gender && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
                            {genderLabels[selectedStudent.gender] || selectedStudent.gender}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SheetTitle>
                  {!detailEditMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-edutrack-primary border-edutrack-primary/30 hover:bg-edutrack-primary/5"
                      onClick={() => setDetailEditMode(true)}
                    >
                      <Pencil className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  )}
                </div>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {detailEditMode ? (
                  /* ─── Edit Mode ─── */
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">اسم التلميذ *</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">تاريخ الميلاد</Label>
                      <Input type="date" value={editDateOfBirth} onChange={(e) => setEditDateOfBirth(e.target.value)} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الجنس</Label>
                      <Select value={editGender} onValueChange={setEditGender}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="اختر الجنس" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ذكر">ذكر</SelectItem>
                          <SelectItem value="أنثى">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">المستوى *</Label>
                      <Select
                        value={editLevel}
                        onValueChange={(val) => {
                          setEditLevel(val);
                          setEditSectionId('');
                        }}
                      >
                        <SelectTrigger className="h-10"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                          <SelectItem value="متوسط">متوسط</SelectItem>
                          <SelectItem value="ثانوي">ثانوي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">القسم</Label>
                      <Select value={editSectionId} onValueChange={setEditSectionId}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون قسم</SelectItem>
                          {editLevel &&
                            filteredSectionsForLevel(editLevel).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.yearName} - {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">ولي الأمر</Label>
                      <Select value={editParentId} onValueChange={setEditParentId}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="اختر ولي الأمر" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون ولي أمر</SelectItem>
                          {parents.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} {p.phone ? `(${p.phone})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">رقم هاتف التلميذ</Label>
                      <Input placeholder="رقم الهاتف" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-10" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">عنوان السكن</Label>
                      <Input placeholder="العنوان" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="h-10" />
                    </div>

                    <div className="flex gap-2 pt-3">
                      <Button
                        onClick={handleDetailSave}
                        disabled={detailSaving || !editName.trim() || !editLevel}
                        className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10 flex-1"
                      >
                        {detailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDetailEditMode(false)}
                        className="h-10 flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ─── View Mode ─── */
                  <Tabs defaultValue="info" className="w-full">
                    <div className="px-5 pt-4">
                      <TabsList className="w-full bg-gray-100/80 h-10">
                        <TabsTrigger value="info" className="flex-1 text-xs sm:text-sm">
                          <UserCircle className="h-4 w-4 ml-1" />
                          المعلومات
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="flex-1 text-xs sm:text-sm">
                          <Clock className="h-4 w-4 ml-1" />
                          الحضور
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="flex-1 text-xs sm:text-sm">
                          <CreditCard className="h-4 w-4 ml-1" />
                          الفواتير
                        </TabsTrigger>
                        <TabsTrigger value="activities" className="flex-1 text-xs sm:text-sm">
                          <Activity className="h-4 w-4 ml-1" />
                          الأنشطة
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* ─── Info Tab ─── */}
                    <TabsContent value="info" className="px-5 mt-4">
                      <div className="space-y-4">
                        {/* Personal Info Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-edutrack-dark mb-3 flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-edutrack-primary" />
                            المعلومات الشخصية
                          </h3>
                          <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">تاريخ الميلاد</p>
                                <p className="text-sm font-medium text-edutrack-dark">
                                  {selectedStudent.dateOfBirth ? formatDate(selectedStudent.dateOfBirth) : 'غير محدد'}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                              <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">المستوى</p>
                                <p className="text-sm font-medium text-edutrack-dark">
                                  {levelLabels[selectedStudent.level] || selectedStudent.level}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">القسم</p>
                                <p className="text-sm font-medium text-edutrack-dark">
                                  {selectedStudent.section
                                    ? `${selectedStudent.section.year?.name || ''} - ${selectedStudent.section.name}`
                                    : 'غير محدد'}
                                </p>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                                <p className="text-sm font-medium text-edutrack-dark font-inter">
                                  {formatDate(selectedStudent.enrollmentDate)}
                                </p>
                              </div>
                            </div>
                            {selectedStudent.phone && (
                              <>
                                <Separator />
                                <div className="flex items-center gap-3">
                                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">هاتف التلميذ</p>
                                    <p className="text-sm font-medium text-edutrack-dark font-inter" dir="ltr">{selectedStudent.phone}</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {selectedStudent.address && (
                              <>
                                <Separator />
                                <div className="flex items-center gap-3">
                                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">العنوان</p>
                                    <p className="text-sm font-medium text-edutrack-dark">{selectedStudent.address}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Parent Info Section */}
                        <div>
                          <h3 className="text-sm font-semibold text-edutrack-dark mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-edutrack-primary" />
                            ولي الأمر
                          </h3>
                          <div className="bg-gray-50/80 rounded-xl p-4">
                            {selectedStudent.parent ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">الاسم</p>
                                    <p className="text-sm font-medium text-edutrack-dark">{selectedStudent.parent.user.name}</p>
                                  </div>
                                </div>
                                <Separator />
                                <div className="flex items-center gap-3">
                                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                                    <p className="text-sm font-medium text-edutrack-dark font-inter" dir="ltr">{selectedStudent.parent.user.email}</p>
                                  </div>
                                </div>
                                {selectedStudent.parent.phone && (
                                  <>
                                    <Separator />
                                    <div className="flex items-center gap-3">
                                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">الهاتف</p>
                                        <p className="text-sm font-medium text-edutrack-dark font-inter" dir="ltr">{selectedStudent.parent.phone}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">لم يتم تعيين ولي أمر</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* ─── Attendance Tab ─── */}
                    <TabsContent value="attendance" className="px-5 mt-4">
                      <div className="space-y-4">
                        {/* Attendance Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <Card className="border-0 shadow-sm bg-emerald-50/60">
                            <CardContent className="p-3 text-center">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-emerald-700 font-inter">{selectedStudent.attendanceSummary.present}</p>
                              <p className="text-xs text-emerald-600">حاضر</p>
                            </CardContent>
                          </Card>
                          <Card className="border-0 shadow-sm bg-red-50/60">
                            <CardContent className="p-3 text-center">
                              <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-red-700 font-inter">{selectedStudent.attendanceSummary.absent}</p>
                              <p className="text-xs text-red-600">غائب</p>
                            </CardContent>
                          </Card>
                          <Card className="border-0 shadow-sm bg-amber-50/60">
                            <CardContent className="p-3 text-center">
                              <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                              <p className="text-lg font-bold text-amber-700 font-inter">{selectedStudent.attendanceSummary.late}</p>
                              <p className="text-xs text-amber-600">متأخر</p>
                            </CardContent>
                          </Card>
                          <Card className="border-0 shadow-sm bg-edutrack-primary/5">
                            <CardContent className="p-3 text-center">
                              <div className="text-lg font-bold text-edutrack-primary font-inter">{selectedStudent.attendanceSummary.attendanceRate}%</div>
                              <p className="text-xs text-edutrack-primary/70">نسبة الحضور</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Recent Attendance */}
                        <div>
                          <h3 className="text-sm font-semibold text-edutrack-dark mb-3">آخر سجلات الحضور</h3>
                          {selectedStudent.attendances.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              لا توجد سجلات حضور
                            </div>
                          ) : (
                            <ScrollArea className="max-h-64">
                              <div className="space-y-2">
                                {selectedStudent.attendances.map((att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      {getAttendanceStatusIcon(att.status)}
                                      <div>
                                        <p className="text-sm font-medium text-edutrack-dark">
                                          {att.session?.subject?.name || 'حصة'}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-inter">
                                          {formatDate(att.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${
                                      att.status === 'PRESENT'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : att.status === 'ABSENT'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {getAttendanceStatusLabel(att.status)}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* ─── Invoices Tab ─── */}
                    <TabsContent value="invoices" className="px-5 mt-4">
                      <div className="space-y-4">
                        {selectedStudent.invoices.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            لا توجد فواتير
                          </div>
                        ) : (
                          <ScrollArea className="max-h-96">
                            <div className="space-y-3">
                              {selectedStudent.invoices.map((inv) => {
                                const statusInfo = invoiceStatusMap[inv.status] || { label: inv.status, color: 'bg-gray-50 text-gray-700 border-gray-200' };
                                return (
                                  <Card key={inv.id} className="border shadow-sm overflow-hidden">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-edutrack-primary" />
                                          <span className="text-sm font-semibold text-edutrack-dark">
                                            فاتورة {inv.month}/{inv.year}
                                          </span>
                                        </div>
                                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                                          {statusInfo.label}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                        <span>المبلغ</span>
                                        <span className="font-bold text-edutrack-dark font-inter">{inv.amount.toLocaleString('ar-DZ')} د.ج</span>
                                      </div>
                                      {inv.lineItems.length > 0 && (
                                        <div className="border-t pt-2 mt-2 space-y-1">
                                          {inv.lineItems.map((li) => (
                                            <div key={li.id} className="flex items-center justify-between text-xs">
                                              <span className="text-muted-foreground">{li.subjectName}</span>
                                              <span className="font-inter">{li.subtotal.toLocaleString('ar-DZ')} د.ج</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {inv.paidAt && (
                                        <p className="text-xs text-emerald-600 mt-2">
                                          تم الدفع في {formatDate(inv.paidAt)}
                                        </p>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>

                    {/* ─── Activities Tab ─── */}
                    <TabsContent value="activities" className="px-5 mt-4 pb-6">
                      <div className="space-y-4">
                        {selectedStudent.activities.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            لا توجد أنشطة
                          </div>
                        ) : (
                          <ScrollArea className="max-h-96">
                            <div className="space-y-3">
                              {selectedStudent.activities.map((act) => (
                                <Card key={act.id} className="border shadow-sm overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-xs ${activityTypeColors[act.type] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                          {activityTypeLabels[act.type] || act.type}
                                        </Badge>
                                        <span className="text-sm font-semibold text-edutrack-dark">{act.title}</span>
                                      </div>
                                      {act.grade !== null && act.maxGrade !== null && (
                                        <span className="text-sm font-bold text-edutrack-primary font-inter">
                                          {act.grade}/{act.maxGrade}
                                        </span>
                                      )}
                                    </div>
                                    {act.description && (
                                      <p className="text-xs text-muted-foreground mb-2">{act.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span>الأستاذ: {act.teacher.user.name}</span>
                                      <span>•</span>
                                      <span>{act.teacher.subject.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-inter">{formatDate(act.date)}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
