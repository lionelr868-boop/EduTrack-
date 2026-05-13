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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherSubject {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; level: string };
}

interface Teacher {
  id: string;
  userId: string;
  institutionId: string;
  user: { id: string; name: string; email: string };
  subjects: TeacherSubject[];
  _count?: { sessions: number };
}

interface SubjectOption {
  id: string;
  name: string;
  level: string;
}

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

export default function TeachersView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Disabled teacher IDs (simulated state)
  const [disabledTeachers, setDisabledTeachers] = useState<Set<string>>(new Set());

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubjectIds, setInviteSubjectIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editSubjectIds, setEditSubjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Subjects list
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

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
          subjectIds: inviteSubjectIds,
          institutionId,
        }),
      });

      if (res.ok) {
        toast.success('تم إرسال الدعوة بنجاح');
        setInviteDialogOpen(false);
        setInviteEmail('');
        setInviteSubjectIds([]);
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

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditSubjectIds(teacher.subjects.map((ts) => ts.subjectId));
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    setSaving(true);
    try {
      // Simulate save
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

  const toggleSubjectSelection = (subjectId: string, isInvite: boolean) => {
    if (isInvite) {
      setInviteSubjectIds((prev) =>
        prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
      );
    } else {
      setEditSubjectIds((prev) =>
        prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
      );
    }
  };

  const activeTeachers = teachers.filter((t) => !disabledTeachers.has(t.id));
  const disabledCount = teachers.length - activeTeachers.length;

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
              <Users className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة الأساتذة
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة ومتابعة أساتذة المؤسسة</p>
        </div>

        <Button
          onClick={() => setInviteDialogOpen(true)}
          className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
        >
          <Mail className="h-4 w-4 ml-2" />
          دعوة أستاذ
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">إجمالي الأساتذة</p>
                <p className="text-2xl font-bold text-edutrack-dark font-inter">{teachers.length}</p>
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
                <p className="text-sm text-muted-foreground mb-1">الأساتذة النشطون</p>
                <p className="text-2xl font-bold text-emerald-600 font-inter">{activeTeachers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">الأساتذة المعطلون</p>
                <p className="text-2xl font-bold text-red-600 font-inter">{disabledCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <UserX className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الأستاذ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-10 bg-white border-gray-200 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Teachers Grid */}
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
        ) : teachers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-muted-foreground text-lg">لا يوجد أساتذة</p>
            <p className="text-sm text-muted-foreground">ادعُ أستاذ جديد للبدء</p>
          </div>
        ) : (
          teachers.map((teacher, index) => {
            const isDisabled = disabledTeachers.has(teacher.id);
            const initials = teacher.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
            const subjectNames = teacher.subjects.map((ts) => ts.subject.name);

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
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <Avatar className={`h-16 w-16 mb-3 border-2 shadow-md group-hover:scale-105 transition-transform ${isDisabled ? 'border-gray-300' : 'border-edutrack-primary/20'}`}>
                        <AvatarFallback className={`${isDisabled ? 'bg-gray-100 text-gray-500' : 'bg-edutrack-primary/10 text-edutrack-primary'} text-lg font-bold`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <h3 className="font-bold text-edutrack-dark text-base">{teacher.user.name}</h3>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground mt-0.5 mb-3 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {teacher.user.email}
                      </p>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`mb-3 text-xs ${
                          isDisabled
                            ? 'bg-gray-50 text-gray-500 border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isDisabled ? 'معطل' : 'نشط'}
                      </Badge>

                      {/* Subjects */}
                      <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                        {subjectNames.length > 0 ? (
                          subjectNames.map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="text-[10px] bg-edutrack-primary/5 text-edutrack-primary border-edutrack-primary/10"
                            >
                              <BookOpen className="h-2.5 w-2.5 ml-1" />
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">لا توجد مواد</span>
                        )}
                      </div>

                      <Separator className="mb-4" />

                      {/* Actions */}
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-xs"
                          onClick={() => openEditDialog(teacher)}
                        >
                          <Pencil className="h-3.5 w-3.5 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          variant={isDisabled ? 'outline' : 'outline'}
                          size="sm"
                          className={`flex-1 h-9 text-xs ${isDisabled ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                          onClick={() => handleToggleStatus(teacher.id)}
                        >
                          <Power className="h-3.5 w-3.5 ml-1" />
                          {isDisabled ? 'تفعيل' : 'تعطيل'}
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

      {/* Invite Teacher Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Mail className="h-5 w-5 text-edutrack-primary" />
              دعوة أستاذ جديد
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
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">المواد الدراسية</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                {subjects.length === 0 ? (
                  <span className="text-xs text-muted-foreground">لا توجد مواد متاحة</span>
                ) : (
                  subjects.map((subject) => {
                    const isSelected = inviteSubjectIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubjectSelection(subject.id, true)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-edutrack-primary text-white shadow-sm'
                            : 'bg-white text-muted-foreground border border-gray-200 hover:border-edutrack-primary/30'
                        }`}
                      >
                        {subject.name} ({subject.level})
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">انقر على المادة لتحديدها أو إلغاء تحديدها</p>
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

      {/* Edit Teacher Dialog */}
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
                    {editingTeacher.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-edutrack-dark text-sm">{editingTeacher.user.name}</p>
                  <p className="text-xs text-muted-foreground">{editingTeacher.user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">المواد الدراسية</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {subjects.map((subject) => {
                    const isSelected = editSubjectIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        onClick={() => toggleSubjectSelection(subject.id, false)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          isSelected
                            ? 'bg-edutrack-primary text-white shadow-sm'
                            : 'bg-white text-muted-foreground border border-gray-200 hover:border-edutrack-primary/30'
                        }`}
                      >
                        {subject.name} ({subject.level})
                      </button>
                    );
                  })}
                </div>
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
    </motion.div>
  );
}
