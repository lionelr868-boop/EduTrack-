'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
  institutionId: string;
  createdAt: string;
  parent: { id: string; userId: string; phone: string | null; user: { name: string; email: string } } | null;
}

interface ParentOption {
  id: string;
  name: string;
  phone: string | null;
}

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

export default function StudentsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formName, setFormName] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Parents for dropdown
  const [parents, setParents] = useState<ParentOption[]>([]);

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
  }, [institutionId, page, searchQuery, levelFilter]);

  const fetchParents = useCallback(async () => {
    try {
      const res = await fetch(`/api/students?institutionId=${institutionId}&limit=1`);
      if (res.ok) {
        // Fetch parents from a separate call
        const parentsRes = await fetch(`/api/students/parents?institutionId=${institutionId}`);
        if (parentsRes.ok) {
          const data = await parentsRes.json();
          setParents(data.parents);
        }
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
  }, [fetchParents]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, levelFilter]);

  const openAddDialog = () => {
    setEditingStudent(null);
    setFormName('');
    setFormLevel('');
    setFormParentId('');
    setDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormLevel(student.level);
    setFormParentId(student.parentId || '');
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
      };
      if (formParentId) body.parentId = formParentId;

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
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-right font-semibold text-edutrack-dark">الاسم</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">المستوى</TableHead>
                    <TableHead className="text-right font-semibold text-edutrack-dark">ولي الأمر</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">تاريخ التسجيل</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-5 bg-gray-100 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
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
                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-edutrack-primary">
                                {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-edutrack-dark text-sm">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${levelColors[student.level] || 'bg-gray-50 text-gray-700 border-gray-200'} text-xs`}>
                            {levelLabels[student.level] || student.level}
                          </Badge>
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
                          {new Date(student.createdAt).toLocaleDateString('ar-DZ')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
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

      {/* Add/Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              {editingStudent ? 'تعديل التلميذ' : 'إضافة تلميذ جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">اسم التلميذ *</Label>
              <Input
                placeholder="أدخل اسم التلميذ"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">المستوى *</Label>
              <Select value={formLevel} onValueChange={setFormLevel}>
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

      {/* Delete Confirmation Dialog */}
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
    </motion.div>
  );
}
