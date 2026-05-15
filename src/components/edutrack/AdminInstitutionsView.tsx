'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Search,
  Filter,
  Snowflake,
  Play,
  Plus,
  Eye,
  Crown,
  AlertTriangle,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  CreditCard,
  BarChart3,
  UserCheck,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface InstitutionCount {
  students: number;
  teachers: number;
  users: number;
  payments: number;
}

interface Institution {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  wilaya: string | null;
  phone: string | null;
  directorName: string | null;
  subscriptionPlan: string;
  frozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  subscriptionExpiresAt: string | null;
  maxStudents: number;
  createdAt: string;
  address?: string | null;
  _count: InstitutionCount;
  revenue?: number;
}

interface InstitutionDetail {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  wilaya: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  directorName: string | null;
  subscriptionPlan: string;
  frozen: boolean;
  frozenAt: string | null;
  frozenReason: string | null;
  subscriptionExpiresAt: string | null;
  maxStudents: number;
  createdAt: string;
  academicYear: string | null;
  _count: {
    students: number;
    teachers: number;
    subjects: number;
    sessions: number;
    invoices: number;
    payments: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
  }>;
  stats: {
    revenue: number;
    pendingPayments: number;
    totalInvoices: number;
    totalInvoiceAmount: number;
    paidInvoices: number;
    paidInvoiceAmount: number;
  };
}

interface InstitutionsResponse {
  institutions: Institution[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Plan Configuration ─────────────────────────────────────
const planConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode; maxStudents: number; features: string[] }> = {
  FREE: {
    label: 'مجاني',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: <Building2 className="h-3.5 w-3.5" />,
    maxStudents: 50,
    features: ['حتى 50 تلميذ', 'مدير واحد', 'إدارة أساسية', 'تقارير محدودة'],
  },
  BASIC: {
    label: 'أساسي',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    maxStudents: 200,
    features: ['حتى 200 تلميذ', '5 أساتذة', 'إدارة كاملة', 'تقارير مفصلة', 'إشعارات بالبريد'],
  },
  PREMIUM: {
    label: 'برومزي',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: <Crown className="h-3.5 w-3.5" />,
    maxStudents: 9999,
    features: ['تلاميذ غير محدودين', 'أساتذة غير محدودين', 'جميع المميزات', 'تقارير متقدمة', 'إشعارات SMS وبريد', 'دعم فني أولوي'],
  },
};

// ─── Helper Functions ───────────────────────────────────────
function getPlanBadge(plan: string) {
  const config = planConfig[plan] || planConfig.FREE;
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} ${config.borderColor} text-xs font-semibold px-2.5 py-0.5 gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function getStatusBadge(frozen: boolean) {
  if (frozen) {
    return (
      <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs font-semibold px-2.5 py-0.5 gap-1">
        <Snowflake className="h-3 w-3" />
        مجمّد
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 border border-green-300 text-xs font-semibold px-2.5 py-0.5 gap-1">
      <CheckCircle className="h-3 w-3" />
      نشط
    </Badge>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

// ─── Main Component ─────────────────────────────────────────
export default function AdminInstitutionsView() {
  const { setCurrentView } = useAppStore();

  // State
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialogs
  const [freezeDialog, setFreezeDialog] = useState<{ open: boolean; institution: Institution | null; mode: 'freeze' | 'unfreeze' }>({
    open: false,
    institution: null,
    mode: 'freeze',
  });
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeLoading, setFreezeLoading] = useState(false);

  const [planDialog, setPlanDialog] = useState<{ open: boolean; institution: Institution | null }>({
    open: false,
    institution: null,
  });
  const [selectedPlan, setSelectedPlan] = useState('');
  const [planLoading, setPlanLoading] = useState(false);

  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    subscriptionPlan: 'FREE',
  });
  const [addLoading, setAddLoading] = useState(false);

  const [detailSheet, setDetailSheet] = useState<{ open: boolean; institution: InstitutionDetail | null; loading: boolean }>({
    open: false,
    institution: null,
    loading: false,
  });

  // Fetch institutions
  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (planFilter && planFilter !== 'ALL') params.set('plan', planFilter);
      if (statusFilter && statusFilter !== 'ALL') params.set('frozen', statusFilter === 'FROZEN' ? 'true' : 'false');
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/admin/institutions?${params.toString()}`, {
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const data: InstitutionsResponse = await res.json();
      setInstitutions(data.institutions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('تعذر تحميل بيانات المؤسسات');
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, statusFilter, page]);

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, planFilter, statusFilter]);

  // ─── Freeze/Unfreeze Handler ─────────────────────────────
  const handleFreeze = async () => {
    if (!freezeDialog.institution) return;
    if (freezeDialog.mode === 'freeze' && !freezeReason.trim()) return;

    setFreezeLoading(true);
    try {
      const body =
        freezeDialog.mode === 'freeze'
          ? { frozen: true, frozenReason: freezeReason.trim() }
          : { frozen: false };

      const res = await fetch(`/api/admin/institutions/${freezeDialog.institution.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('فشل في العملية');

      setFreezeDialog({ open: false, institution: null, mode: 'freeze' });
      setFreezeReason('');
      fetchInstitutions();
    } catch (err) {
      console.error('Freeze error:', err);
    } finally {
      setFreezeLoading(false);
    }
  };

  // ─── Change Plan Handler ─────────────────────────────────
  const handleChangePlan = async () => {
    if (!planDialog.institution || !selectedPlan) return;

    setPlanLoading(true);
    try {
      const res = await fetch(`/api/admin/institutions/${planDialog.institution.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ subscriptionPlan: selectedPlan }),
      });

      if (!res.ok) throw new Error('فشل في تغيير الخطة');

      setPlanDialog({ open: false, institution: null });
      setSelectedPlan('');
      fetchInstitutions();
    } catch (err) {
      console.error('Plan change error:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  // ─── Add Institution Handler ─────────────────────────────
  const handleAddInstitution = async () => {
    if (!addForm.name.trim()) return;

    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify(addForm),
      });

      if (!res.ok) throw new Error('فشل في إنشاء المؤسسة');

      setAddDialog(false);
      setAddForm({ name: '', address: '', phone: '', email: '', subscriptionPlan: 'FREE' });
      fetchInstitutions();
    } catch (err) {
      console.error('Add institution error:', err);
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Fetch Detail ────────────────────────────────────────
  const fetchDetail = async (id: string) => {
    setDetailSheet({ open: true, institution: null, loading: true });
    try {
      const res = await fetch(`/api/admin/institutions/${id}`, {
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error('فشل في تحميل التفاصيل');
      const data = await res.json();
      setDetailSheet({ open: true, institution: data, loading: false });
    } catch (err) {
      console.error('Detail fetch error:', err);
      setDetailSheet({ open: false, institution: null, loading: false });
    }
  };

  // ─── Stats Summary ───────────────────────────────────────
  const totalStudents = institutions.reduce((sum, i) => sum + (i._count?.students || 0), 0);
  const totalTeachers = institutions.reduce((sum, i) => sum + (i._count?.teachers || 0), 0);
  const frozenCount = institutions.filter((i) => i.frozen).length;
  const activeCount = institutions.filter((i) => !i.frozen).length;

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-teal-600" />
            إدارة المؤسسات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة ومراقبة جميع المؤسسات التعليمية المسجلة على المنصة
          </p>
        </div>
        <Button
          onClick={() => setAddDialog(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          إضافة مؤسسة
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50">
                <Building2 className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي المؤسسات</p>
                <p className="text-xl font-bold text-gray-800">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نشطة</p>
                <p className="text-xl font-bold text-green-700">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50">
                <Snowflake className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجمّدة</p>
                <p className="text-xl font-bold text-red-600">{frozenCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50">
                <GraduationCap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التلاميذ</p>
                <p className="text-xl font-bold text-orange-700">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو المدينة..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10 pl-4"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                    <SelectValue placeholder="الخطة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع الخطط</SelectItem>
                    <SelectItem value="FREE">مجاني</SelectItem>
                    <SelectItem value="BASIC">أساسي</SelectItem>
                    <SelectItem value="PREMIUM">برومزي</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع الحالات</SelectItem>
                    <SelectItem value="ACTIVE">نشط</SelectItem>
                    <SelectItem value="FROZEN">مجمّد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-gray-200 animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-200 rounded-full" />
                    <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 bg-gray-50 rounded-lg" />
                    <div className="h-12 bg-gray-50 rounded-lg" />
                    <div className="h-12 bg-gray-50 rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" onClick={fetchInstitutions} className="gap-2 border-red-200 text-red-700 hover:bg-red-100">
                <RefreshCw className="h-4 w-4" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && institutions.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-gray-200">
            <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
              <Building2 className="h-16 w-16 text-gray-300" />
              <div>
                <h3 className="text-lg font-semibold text-gray-700">لا توجد مؤسسات</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  لم يتم العثور على مؤسسات تطابق معايير البحث
                </p>
              </div>
              <Button
                onClick={() => {
                  setSearch('');
                  setPlanFilter('ALL');
                  setStatusFilter('ALL');
                }}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" /> إعادة تعيين الفلاتر
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Desktop Table View */}
      {!loading && !error && institutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hidden lg:block"
        >
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-right font-semibold">المؤسسة</TableHead>
                    <TableHead className="text-right font-semibold">الخطة</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                    <TableHead className="text-center font-semibold">التلاميذ</TableHead>
                    <TableHead className="text-center font-semibold">الأساتذة</TableHead>
                    <TableHead className="text-center font-semibold">المستخدمون</TableHead>
                    <TableHead className="text-right font-semibold">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-center font-semibold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {institutions.map((inst, index) => (
                      <motion.tr
                        key={inst.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="group hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                              <Building2 className="h-5 w-5 text-teal-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate max-w-[200px]">{inst.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] flex items-center gap-1">
                                {inst.city && <MapPin className="h-3 w-3 flex-shrink-0" />}
                                {inst.city || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(inst.subscriptionPlan)}</TableCell>
                        <TableCell>{getStatusBadge(inst.frozen)}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold text-gray-700">{inst._count?.students || 0}</span>
                          <span className="text-xs text-muted-foreground">/{inst.maxStudents}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold text-gray-700">{inst._count?.teachers || 0}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-semibold text-gray-700">{inst._count?.users || 0}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(inst.subscriptionExpiresAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchDetail(inst.id)}
                              className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {inst.frozen ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setFreezeDialog({ open: true, institution: inst, mode: 'unfreeze' })
                                }
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                title="إلغاء التجميد"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setFreezeDialog({ open: true, institution: inst, mode: 'freeze' })
                                }
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                title="تجميد"
                              >
                                <Snowflake className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPlanDialog({ open: true, institution: inst });
                                setSelectedPlan(inst.subscriptionPlan);
                              }}
                              className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600"
                              title="تغيير الخطة"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mobile Cards View */}
      {!loading && !error && institutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:hidden space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {institutions.map((inst, index) => (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`border shadow-sm overflow-hidden ${inst.frozen ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${inst.frozen ? 'bg-red-100' : 'bg-teal-50'}`}>
                        <Building2 className={`h-5 w-5 ${inst.frozen ? 'text-red-500' : 'text-teal-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{inst.name}</p>
                            {inst.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" /> {inst.city}
                              </p>
                            )}
                          </div>
                          {inst.frozen && (
                            <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs gap-1 flex-shrink-0">
                              <Snowflake className="h-3 w-3" /> مجمّد
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {getPlanBadge(inst.subscriptionPlan)}
                      {getStatusBadge(inst.frozen)}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <GraduationCap className="h-4 w-4 text-teal-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-gray-800">{inst._count?.students || 0}</p>
                        <p className="text-[10px] text-muted-foreground">تلميذ</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <BookOpen className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-gray-800">{inst._count?.teachers || 0}</p>
                        <p className="text-[10px] text-muted-foreground">أستاذ</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Users className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-gray-800">{inst._count?.users || 0}</p>
                        <p className="text-[10px] text-muted-foreground">مستخدم</p>
                      </div>
                    </div>

                    {/* Expiry */}
                    {inst.subscriptionExpiresAt && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                        <Calendar className="h-3 w-3" />
                        تنتهي الاشتراك: {formatDate(inst.subscriptionExpiresAt)}
                      </p>
                    )}

                    {/* Frozen Reason */}
                    {inst.frozen && inst.frozenReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                        <p className="text-xs text-red-700 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          سبب التجميد: {inst.frozenReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchDetail(inst.id)}
                        className="flex-1 gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> التفاصيل
                      </Button>
                      {inst.frozen ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFreezeDialog({ open: true, institution: inst, mode: 'unfreeze' })}
                          className="flex-1 gap-1 text-xs border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Play className="h-3.5 w-3.5" /> إلغاء التجميد
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFreezeDialog({ open: true, institution: inst, mode: 'freeze' })}
                          className="flex-1 gap-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Snowflake className="h-3.5 w-3.5" /> تجميد
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPlanDialog({ open: true, institution: inst });
                          setSelectedPlan(inst.subscriptionPlan);
                        }}
                        className="flex-1 gap-1 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <Crown className="h-3.5 w-3.5" /> تغيير الخطة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-muted-foreground">
            عرض <span className="font-semibold">{(page - 1) * 20 + 1}</span> -{' '}
            <span className="font-semibold">{Math.min(page * 20, total)}</span> من{' '}
            <span className="font-semibold">{total}</span> مؤسسة
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" /> السابق
            </Button>
            <div className="flex items-center gap-1">
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
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 p-0 ${page === pageNum ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="gap-1"
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ─── Freeze/Unfreeze AlertDialog ─────────────────────── */}
      <AlertDialog
        open={freezeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setFreezeDialog({ open: false, institution: null, mode: 'freeze' });
            setFreezeReason('');
          }
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {freezeDialog.mode === 'freeze' ? (
                <>
                  <Snowflake className="h-5 w-5 text-red-500" />
                  تجميد المؤسسة
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 text-green-600" />
                  إلغاء تجميد المؤسسة
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {freezeDialog.mode === 'freeze' ? (
                <span>
                  هل أنت متأكد من تجميد مؤسسة &quot;{freezeDialog.institution?.name}&quot;؟ لن تتمكن المؤسسة من
                  الوصول إلى المنصة حتى يتم إلغاء التجميد.
                </span>
              ) : (
                <span>
                  هل أنت متأكد من إلغاء تجميد مؤسسة &quot;{freezeDialog.institution?.name}&quot;؟ ستتمكن المؤسسة
                  من الوصول إلى المنصة مرة أخرى.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {freezeDialog.mode === 'freeze' && (
            <div className="space-y-2 py-2">
              <Label htmlFor="freeze-reason" className="text-sm font-medium">
                سبب التجميد <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="freeze-reason"
                placeholder="أدخل سبب التجميد..."
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="min-h-[80px]"
              />
              {!freezeReason.trim() && freezeReason.length > 0 && (
                <p className="text-xs text-red-500">سبب التجميد مطلوب</p>
              )}
            </div>
          )}

          {freezeDialog.mode === 'unfreeze' && freezeDialog.institution?.frozenReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">
                <span className="font-semibold">سبب التجميد السابق:</span>{' '}
                {freezeDialog.institution.frozenReason}
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFreeze}
              disabled={freezeDialog.mode === 'freeze' ? !freezeReason.trim() || freezeLoading : freezeLoading}
              className={
                freezeDialog.mode === 'freeze'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {freezeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              {freezeDialog.mode === 'freeze' ? 'تجميد المؤسسة' : 'إلغاء التجميد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Change Plan Dialog ──────────────────────────────── */}
      <Dialog
        open={planDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPlanDialog({ open: false, institution: null });
            setSelectedPlan('');
          }
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-orange-500" />
              تغيير خطة الاشتراك
            </DialogTitle>
            <DialogDescription>
              تغيير خطة اشتراك مؤسسة &quot;{planDialog.institution?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الخطة الحالية</Label>
              <div>{getPlanBadge(planDialog.institution?.subscriptionPlan || 'FREE')}</div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>الخطة الجديدة</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخطة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">مجاني</SelectItem>
                  <SelectItem value="BASIC">أساسي</SelectItem>
                  <SelectItem value="PREMIUM">برومزي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && planConfig[selectedPlan] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-xl border p-4 ${planConfig[selectedPlan].bgColor} ${planConfig[selectedPlan].borderColor}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {planConfig[selectedPlan].icon}
                  <span className={`font-bold ${planConfig[selectedPlan].color}`}>
                    {planConfig[selectedPlan].label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (حتى {planConfig[selectedPlan].maxStudents === 9999 ? 'غير محدود' : planConfig[selectedPlan].maxStudents} تلميذ)
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {planConfig[selectedPlan].features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${planConfig[selectedPlan].color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {selectedPlan === planDialog.institution?.subscriptionPlan && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  المؤسسة مشتركة بالفعل في هذه الخطة
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPlanDialog({ open: false, institution: null });
                setSelectedPlan('');
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={!selectedPlan || selectedPlan === planDialog.institution?.subscriptionPlan || planLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            >
              {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              تغيير الخطة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Institution Dialog ──────────────────────────── */}
      <Dialog
        open={addDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialog(false);
            setAddForm({ name: '', address: '', phone: '', email: '', subscriptionPlan: 'FREE' });
          }
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              إضافة مؤسسة جديدة
            </DialogTitle>
            <DialogDescription>
              إنشاء حساب مؤسسة تعليمية جديدة على المنصة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inst-name">
                اسم المؤسسة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inst-name"
                placeholder="أدخل اسم المؤسسة..."
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inst-address">العنوان</Label>
              <Input
                id="inst-address"
                placeholder="عنوان المؤسسة..."
                value={addForm.address}
                onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inst-phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> الهاتف
                </Label>
                <Input
                  id="inst-phone"
                  placeholder="05xxxxxxxx"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inst-email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> البريد الإلكتروني
                </Label>
                <Input
                  id="inst-email"
                  placeholder="info@example.dz"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>خطة الاشتراك</Label>
              <Select
                value={addForm.subscriptionPlan}
                onValueChange={(value) => setAddForm((prev) => ({ ...prev, subscriptionPlan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخطة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">مجاني</SelectItem>
                  <SelectItem value="BASIC">أساسي</SelectItem>
                  <SelectItem value="PREMIUM">برومزي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addForm.subscriptionPlan && planConfig[addForm.subscriptionPlan] && (
              <div className={`rounded-xl border p-3 ${planConfig[addForm.subscriptionPlan].bgColor} ${planConfig[addForm.subscriptionPlan].borderColor}`}>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {planConfig[addForm.subscriptionPlan].features.map((feature, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-700">
                      <CheckCircle className={`h-3 w-3 ${planConfig[addForm.subscriptionPlan].color}`} />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddDialog(false);
                setAddForm({ name: '', address: '', phone: '', email: '', subscriptionPlan: 'FREE' });
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddInstitution}
              disabled={!addForm.name.trim() || addLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إنشاء المؤسسة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Institution Detail Sheet ────────────────────────── */}
      <Sheet
        open={detailSheet.open}
        onOpenChange={(open) => {
          if (!open) {
            setDetailSheet({ open: false, institution: null, loading: false });
          }
        }}
      >
        <SheetContent side="left" className="w-full sm:max-w-[600px] p-0" dir="rtl">
          {detailSheet.loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
              </div>
            </div>
          ) : detailSheet.institution ? (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <SheetHeader className="p-0">
                  <SheetTitle className="flex items-center gap-3 text-xl">
                    <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{detailSheet.institution.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPlanBadge(detailSheet.institution.subscriptionPlan)}
                        {getStatusBadge(detailSheet.institution.frozen)}
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Frozen Alert */}
                {detailSheet.institution.frozen && detailSheet.institution.frozenReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-800 text-sm">المؤسسة مجمّدة</p>
                        <p className="text-xs text-red-700 mt-1">السبب: {detailSheet.institution.frozenReason}</p>
                        {detailSheet.institution.frozenAt && (
                          <p className="text-xs text-red-600 mt-0.5">
                            تاريخ التجميد: {formatDate(detailSheet.institution.frozenAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-600" />
                      معلومات المؤسسة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {detailSheet.institution.directorName && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">المدير:</span>
                        <span className="font-medium text-gray-800">{detailSheet.institution.directorName}</span>
                      </div>
                    )}
                    {detailSheet.institution.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">البريد:</span>
                        <span className="font-medium text-gray-800" dir="ltr">{detailSheet.institution.email}</span>
                      </div>
                    )}
                    {detailSheet.institution.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">الهاتف:</span>
                        <span className="font-medium text-gray-800" dir="ltr">{detailSheet.institution.phone}</span>
                      </div>
                    )}
                    {(detailSheet.institution.city || detailSheet.institution.address) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">العنوان:</span>
                        <span className="font-medium text-gray-800">
                          {[detailSheet.institution.address, detailSheet.institution.city, detailSheet.institution.wilaya].filter(Boolean).join('، ')}
                        </span>
                      </div>
                    )}
                    {detailSheet.institution.academicYear && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">السنة الدراسية:</span>
                        <span className="font-medium text-gray-800">{detailSheet.institution.academicYear}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">تاريخ التسجيل:</span>
                      <span className="font-medium text-gray-800">{formatDate(detailSheet.institution.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">الاشتراك ينتهي:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(detailSheet.institution.subscriptionExpiresAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-teal-600" />
                      الإحصائيات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-teal-50 rounded-xl p-3 text-center">
                        <GraduationCap className="h-5 w-5 text-teal-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-teal-700">{detailSheet.institution._count.students}</p>
                        <p className="text-[10px] text-teal-600">تلميذ</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <BookOpen className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-orange-700">{detailSheet.institution._count.teachers}</p>
                        <p className="text-[10px] text-orange-600">أستاذ</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-purple-700">{detailSheet.institution._count.subjects}</p>
                        <p className="text-[10px] text-purple-600">مادة</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <Calendar className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-green-700">{detailSheet.institution._count.sessions}</p>
                        <p className="text-[10px] text-green-600">حصة</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <CreditCard className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-amber-700">{detailSheet.institution._count.invoices}</p>
                        <p className="text-[10px] text-amber-600">فاتورة</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <BarChart3 className="h-5 w-5 text-red-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-700">{detailSheet.institution._count.payments}</p>
                        <p className="text-[10px] text-red-600">دفعة</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Stats */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-teal-600" />
                      الملخص المالي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(detailSheet.institution.stats.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">مدفوعات معلقة</span>
                      <span className="text-sm font-bold text-amber-700">
                        {formatCurrency(detailSheet.institution.stats.pendingPayments)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-muted-foreground">إجمالي الفواتير</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {detailSheet.institution.stats.totalInvoices} ({formatCurrency(detailSheet.institution.stats.totalInvoiceAmount)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">فواتير مدفوعة</span>
                      <span className="text-sm font-semibold text-green-700">
                        {detailSheet.institution.stats.paidInvoices} ({formatCurrency(detailSheet.institution.stats.paidInvoiceAmount)})
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Users */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      المستخدمون
                      <Badge variant="secondary" className="font-inter text-xs">
                        {detailSheet.institution.users.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailSheet.institution.users.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detailSheet.institution.users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-teal-600">{user.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground" dir="ltr">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  user.role === 'DIRECTOR'
                                    ? 'border-teal-300 text-teal-700 bg-teal-50'
                                    : user.role === 'TEACHER'
                                    ? 'border-orange-300 text-orange-700 bg-orange-50'
                                    : user.role === 'PARENT'
                                    ? 'border-purple-300 text-purple-700 bg-purple-50'
                                    : 'border-gray-300 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {user.role === 'DIRECTOR'
                                  ? 'مدير'
                                  : user.role === 'TEACHER'
                                  ? 'أستاذ'
                                  : user.role === 'PARENT'
                                  ? 'ولي أمر'
                                  : user.role}
                              </Badge>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  user.active ? 'bg-green-500' : 'bg-red-400'
                                }`}
                                title={user.active ? 'نشط' : 'غير نشط'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">لا يوجد مستخدمون</p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  {detailSheet.institution.frozen ? (
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        const inst = institutions.find((i) => i.id === detailSheet.institution?.id);
                        if (inst) {
                          setFreezeDialog({ open: true, institution: inst, mode: 'unfreeze' });
                        }
                      }}
                    >
                      <Play className="h-4 w-4" /> إلغاء التجميد
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        const inst = institutions.find((i) => i.id === detailSheet.institution?.id);
                        if (inst) {
                          setFreezeDialog({ open: true, institution: inst, mode: 'freeze' });
                        }
                      }}
                    >
                      <Snowflake className="h-4 w-4" /> تجميد
                    </Button>
                  )}
                  <Button
                    className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      const inst = institutions.find((i) => i.id === detailSheet.institution?.id);
                      if (inst) {
                        setPlanDialog({ open: true, institution: inst });
                        setSelectedPlan(inst.subscriptionPlan);
                      }
                    }}
                  >
                    <Crown className="h-4 w-4" /> تغيير الخطة
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
