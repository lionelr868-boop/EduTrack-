'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Loader2,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  BookOpen,
  User,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  Eye,
  Power,
  PowerOff,
  RefreshCcw,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherInfo {
  id: string;
  level: string;
  phone: string | null;
  specialization: string | null;
  subject: { id: string; name: string } | null;
}

interface ParentInfo {
  id: string;
  phone: string | null;
  _count: { students: number };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  institutionId: string;
  institution: { id: string; name: string; subscriptionPlan: string; frozen: boolean } | null;
  teacher: TeacherInfo | null;
  parent: ParentInfo | null;
}

interface UsersResponse {
  users: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  DIRECTOR: {
    label: 'مدير مؤسسة',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <Shield className="h-3.5 w-3.5" />,
  },
  TEACHER: {
    label: 'أستاذ',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <BookOpen className="h-3.5 w-3.5" />,
  },
  PARENT: {
    label: 'ولي أمر',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: <User className="h-3.5 w-3.5" />,
  },
  ADMIN: {
    label: 'مدير النظام',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <Shield className="h-3.5 w-3.5" />,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function AdminUsersView() {
  const user = useAppStore((s) => s.user);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        role: roleFilter === 'ALL' ? '' : roleFilter,
        page: String(page),
        limit: String(limit),
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'x-user-role': user?.role || '' },
      });

      if (res.ok) {
        const data: UsersResponse = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(data.page);
      }
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, page, user?.role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleToggleActive = async (targetUser: UserItem) => {
    setTogglingUserId(targetUser.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          userId: targetUser.id,
          active: !targetUser.active,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, active: !u.active } : u))
        );
        toast.success(targetUser.active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب');
      } else {
        toast.error('حدث خطأ أثناء التحديث');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setTogglingUserId(null);
    }
  };

  const openDetailDialog = (targetUser: UserItem) => {
    setSelectedUser(targetUser);
    setDetailDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.PARENT;
    return (
      <Badge
        variant="outline"
        className={`${config.color} ${config.bgColor} ${config.borderColor} border text-[11px] h-6 px-2 flex items-center gap-1`}
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] h-6 px-2 hover:bg-emerald-100">
        <UserCheck className="h-3 w-3 ml-1" />
        نشط
      </Badge>
    ) : (
      <Badge className="bg-red-50 text-red-700 border border-red-200 text-[11px] h-6 px-2 hover:bg-red-100">
        <UserX className="h-3 w-3 ml-1" />
        معطّل
      </Badge>
    );
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
              <Users className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة المستخدمين
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">عرض وإدارة جميع المستخدمين عبر المؤسسات</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs h-8 px-3">
            {total} مستخدم
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            className="h-8 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCcw className="h-3.5 w-3.5 ml-1" />
            تحديث
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="mb-6">
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد الإلكتروني..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pr-9 h-10 bg-gray-50 border-gray-200 focus:border-edutrack-primary"
                />
              </div>

              {/* Role Filter */}
              <div className="w-full sm:w-48">
                <Select value={roleFilter} onValueChange={handleRoleFilter}>
                  <SelectTrigger className="h-10 bg-gray-50 border-gray-200">
                    <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="فلترة بالدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع الأدوار</SelectItem>
                    <SelectItem value="DIRECTOR">مدير مؤسسة</SelectItem>
                    <SelectItem value="TEACHER">أستاذ</SelectItem>
                    <SelectItem value="PARENT">ولي أمر</SelectItem>
                    <SelectItem value="ADMIN">مدير النظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
          <CardContent className="p-0">
            {loading && users.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">لا يوجد مستخدمون</p>
                <p className="text-xs text-muted-foreground">جرب تعديل معايير البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-right font-bold text-xs">المستخدم</TableHead>
                      <TableHead className="text-right font-bold text-xs">الدور</TableHead>
                      <TableHead className="text-right font-bold text-xs hidden md:table-cell">المؤسسة</TableHead>
                      <TableHead className="text-right font-bold text-xs hidden lg:table-cell">التفاصيل</TableHead>
                      <TableHead className="text-right font-bold text-xs">الحالة</TableHead>
                      <TableHead className="text-right font-bold text-xs">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {users.map((u, index) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="group hover:bg-gray-50/50 transition-colors"
                        >
                          {/* User Info */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-edutrack-primary">
                                  {u.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-edutrack-dark truncate max-w-[180px]">
                                  {u.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" dir="ltr">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Role */}
                          <TableCell>{getRoleBadge(u.role)}</TableCell>

                          {/* Institution */}
                          <TableCell className="hidden md:table-cell">
                            {u.institution ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-edutrack-dark truncate max-w-[150px]">
                                  {u.institution.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Details */}
                          <TableCell className="hidden lg:table-cell">
                            {u.role === 'TEACHER' && u.teacher ? (
                              <div className="space-y-0.5">
                                {u.teacher.subject && (
                                  <p className="text-xs text-muted-foreground">
                                    المادة: <span className="text-edutrack-dark font-medium">{u.teacher.subject.name}</span>
                                  </p>
                                )}
                                {u.teacher.level && (
                                  <p className="text-xs text-muted-foreground">
                                    الطور: <span className="text-edutrack-dark font-medium">{u.teacher.level}</span>
                                  </p>
                                )}
                              </div>
                            ) : u.role === 'PARENT' && u.parent ? (
                              <div className="space-y-0.5">
                                <p className="text-xs text-muted-foreground">
                                  عدد الأبناء: <span className="text-edutrack-dark font-medium">{u.parent._count.students}</span>
                                </p>
                                {u.parent.phone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span dir="ltr">{u.parent.phone}</span>
                                  </p>
                                )}
                              </div>
                            ) : u.role === 'DIRECTOR' ? (
                              <p className="text-xs text-muted-foreground">مدير المؤسسة</p>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>{getStatusBadge(u.active)}</TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDetailDialog(u)}
                                className="h-8 w-8 hover:bg-edutrack-primary/10 text-muted-foreground hover:text-edutrack-primary"
                                title="عرض التفاصيل"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleActive(u)}
                                disabled={togglingUserId === u.id || u.id === user?.id}
                                className={`h-8 w-8 ${
                                  u.active
                                    ? 'hover:bg-red-50 text-muted-foreground hover:text-red-600'
                                    : 'hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600'
                                }`}
                                title={u.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                              >
                                {togglingUserId === u.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : u.active ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-muted-foreground">
                عرض {(page - 1) * limit + 1} - {Math.min(page * limit, total)} من {total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 text-xs ${
                        page === pageNum
                          ? 'bg-edutrack-primary hover:bg-edutrack-primary/90 text-white'
                          : 'hover:bg-edutrack-primary/10'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Users className="h-5 w-5 text-edutrack-primary" />
              تفاصيل المستخدم
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* User Header */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                <div className="h-14 w-14 rounded-full bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-edutrack-primary">
                    {selectedUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-edutrack-dark">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground" dir="ltr">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.active)}
                  </div>
                </div>
              </div>

              {/* Institution */}
              {selectedUser.institution && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-edutrack-dark">المؤسسة</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">{selectedUser.institution.name}</p>
                      <p className="text-xs text-blue-600">خطة: {selectedUser.institution.subscriptionPlan}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Details */}
              {selectedUser.role === 'TEACHER' && selectedUser.teacher && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-edutrack-dark">معلومات الأستاذ</p>
                  <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-100 space-y-1">
                    {selectedUser.teacher.subject && (
                      <p className="text-xs text-muted-foreground">
                        المادة: <span className="font-medium text-orange-900">{selectedUser.teacher.subject.name}</span>
                      </p>
                    )}
                    {selectedUser.teacher.level && (
                      <p className="text-xs text-muted-foreground">
                        الطور: <span className="font-medium text-orange-900">{selectedUser.teacher.level}</span>
                      </p>
                    )}
                    {selectedUser.teacher.specialization && (
                      <p className="text-xs text-muted-foreground">
                        التخصص: <span className="font-medium text-orange-900">{selectedUser.teacher.specialization}</span>
                      </p>
                    )}
                    {selectedUser.teacher.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{selectedUser.teacher.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Parent Details */}
              {selectedUser.role === 'PARENT' && selectedUser.parent && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-edutrack-dark">معلومات ولي الأمر</p>
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      عدد الأبناء: <span className="font-medium text-emerald-900">{selectedUser.parent._count.students}</span>
                    </p>
                    {selectedUser.parent.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{selectedUser.parent.phone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    handleToggleActive(selectedUser);
                    setDetailDialogOpen(false);
                  }}
                  disabled={togglingUserId === selectedUser.id || selectedUser.id === user?.id}
                  className={`w-full h-10 ${
                    selectedUser.active
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {selectedUser.active ? (
                    <>
                      <PowerOff className="h-4 w-4 ml-2" />
                      تعطيل الحساب
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 ml-2" />
                      تفعيل الحساب
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
