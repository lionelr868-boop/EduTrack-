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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Printer,
  Eye,
  Banknote,
  CalendarDays,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  subjectName: string;
  totalSessions: number;
  absentSessions: number;
  pricePerSession: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  studentId: string;
  institutionId: string;
  month: number;
  year: number;
  totalSessions: number;
  absentSessions: number;
  compensatedSessions: number;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  student: { id: string; name: string; level: string };
  lineItems: LineItem[];
}

interface Summary {
  totalRevenue: number;
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

const months = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  PAID: { label: 'مدفوعة', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  PENDING: { label: 'معلقة', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: <Clock className="h-3.5 w-3.5" /> },
  OVERDUE: { label: 'متأخرة', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'تحويل بنكي',
  CHEQUE: 'شيك',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

export default function BillingView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || 'inst_1';

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [markPaidInvoiceId, setMarkPaidInvoiceId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(now.getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        institutionId,
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        page: page.toString(),
        limit: '10',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('حدث خطأ أثناء تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  }, [institutionId, selectedMonth, selectedYear, statusFilter, levelFilter, searchQuery, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, levelFilter, searchQuery, selectedMonth, selectedYear]);

  const handleMarkPaid = async () => {
    if (!markPaidInvoiceId || !paymentMethod) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/invoices/${markPaidInvoiceId}/mark-paid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAt: paymentDate || new Date().toISOString(),
          paymentMethod,
        }),
      });
      if (res.ok) {
        toast.success('تم تحديد الفاتورة كمدفوعة بنجاح');
        setMarkPaidDialogOpen(false);
        setMarkPaidInvoiceId(null);
        setPaymentDate('');
        setPaymentMethod('');
        fetchInvoices();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setMarkingPaid(false);
    }
  };

  const openMarkPaidDialog = (invoiceId: string) => {
    setMarkPaidInvoiceId(invoiceId);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setMarkPaidDialogOpen(true);
  };

  const openDetailDialog = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
        setDetailDialogOpen(true);
      }
    } catch {
      toast.error('تعذر تحميل تفاصيل الفاتورة');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerateProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          month: generateMonth,
          year: generateYear,
        }),
      });

      clearInterval(progressInterval);
      setGenerateProgress(100);

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setGenerateDialogOpen(false);
        setSelectedMonth(generateMonth);
        setSelectedYear(generateYear);
        fetchInvoices();
      } else {
        toast.error(data.error || 'حدث خطأ أثناء توليد الفواتير');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setGenerating(false);
      setGenerateProgress(0);
    }
  };

  const fetchStudentCount = async () => {
    try {
      const res = await fetch(`/api/invoices?institutionId=${institutionId}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        setStudentCount(data.total);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (generateDialogOpen) {
      fetchStudentCount();
    }
  }, [generateDialogOpen]);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0" dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-edutrack-primary" />
            </div>
            الفوترة
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة الفواتير والمدفوعات</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px] h-10 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px] h-10 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setGenerateMonth(selectedMonth);
              setGenerateYear(selectedYear);
              setGenerateDialogOpen(true);
            }}
            className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/20 h-10"
          >
            <Sparkles className="h-4 w-4 ml-2" />
            توليد فواتير الشهر
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-edutrack-dark font-inter">{formatAmount(summary.totalRevenue)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-edutrack-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الفواتير المدفوعة</p>
                  <p className="text-2xl font-bold text-emerald-600 font-inter">{formatAmount(summary.paidAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-inter">{summary.paidCount} فاتورة</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الفواتير المعلقة</p>
                  <p className="text-2xl font-bold text-amber-600 font-inter">{formatAmount(summary.pendingAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-inter">{summary.pendingCount} فاتورة</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الفواتير المتأخرة</p>
                  <p className="text-2xl font-bold text-red-600 font-inter">{formatAmount(summary.overdueAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-inter">{summary.overdueCount} فاتورة</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters & Table */}
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="PAID">مدفوعة</SelectItem>
                    <SelectItem value="PENDING">معلقة</SelectItem>
                    <SelectItem value="OVERDUE">متأخرة</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[130px] h-10 bg-gray-50 border-gray-200">
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
                    <TableHead className="text-right font-semibold text-edutrack-dark">التلميذ</TableHead>
                    <TableHead className="text-right font-semibold text-edutrack-dark">الشهر</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">عدد الحصص</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">الغيابات</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">التعويضية</TableHead>
                    <TableHead className="text-right font-semibold text-edutrack-dark">المبلغ</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">الحالة</TableHead>
                    <TableHead className="text-center font-semibold text-edutrack-dark">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-5 bg-gray-100 rounded animate-pulse" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-gray-300" />
                          <p className="text-muted-foreground">لا توجد فواتير</p>
                          <p className="text-xs text-muted-foreground">قم بتوليد فواتير الشهر للبدء</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice, index) => {
                      const status = statusConfig[invoice.status] || statusConfig.PENDING;
                      return (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                          className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-edutrack-dark text-sm">{invoice.student.name}</p>
                              <p className="text-xs text-muted-foreground">{invoice.student.level}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {months[invoice.month - 1]} <span className="font-inter">{invoice.year}</span>
                          </TableCell>
                          <TableCell className="text-center font-inter text-sm">{invoice.totalSessions}</TableCell>
                          <TableCell className="text-center font-inter text-sm">{invoice.absentSessions}</TableCell>
                          <TableCell className="text-center font-inter text-sm">{invoice.compensatedSessions}</TableCell>
                          <TableCell className="font-inter font-semibold text-sm text-edutrack-dark">
                            {formatAmount(invoice.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`${status.bgColor} ${status.color} border text-xs gap-1`}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {invoice.status !== 'PAID' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => openMarkPaidDialog(invoice.id)}
                                  title="تحديد كمدفوع"
                                >
                                  <Banknote className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-edutrack-primary hover:text-edutrack-primary/80 hover:bg-edutrack-primary/5"
                                onClick={() => openDetailDialog(invoice.id)}
                                title="تفاصيل"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                onClick={() => toast.success('جاري تحضير PDF...')}
                                title="طباعة"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
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

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <FileText className="h-5 w-5 text-edutrack-primary" />
              تفاصيل الفاتورة
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">التلميذ</p>
                  <p className="font-semibold text-edutrack-dark">{selectedInvoice.student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المستوى</p>
                  <p className="font-semibold text-edutrack-dark">{selectedInvoice.student.level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الشهر</p>
                  <p className="font-semibold text-edutrack-dark font-inter">
                    {months[selectedInvoice.month - 1]} {selectedInvoice.year}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge variant="outline" className={`${statusConfig[selectedInvoice.status]?.bgColor} ${statusConfig[selectedInvoice.status]?.color} border text-xs gap-1 mt-1`}>
                    {statusConfig[selectedInvoice.status]?.icon}
                    {statusConfig[selectedInvoice.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Line Items Table */}
              {selectedInvoice.lineItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-edutrack-dark mb-3 text-sm">تفاصيل المواد</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-right text-xs">المادة</TableHead>
                          <TableHead className="text-center text-xs">عدد الحصص</TableHead>
                          <TableHead className="text-center text-xs">الغيابات</TableHead>
                          <TableHead className="text-right text-xs">سعر الحصة</TableHead>
                          <TableHead className="text-right text-xs">المبلغ الجزئي</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium">{item.subjectName}</TableCell>
                            <TableCell className="text-center font-inter text-sm">{item.totalSessions}</TableCell>
                            <TableCell className="text-center font-inter text-sm">{item.absentSessions}</TableCell>
                            <TableCell className="font-inter text-sm">{formatAmount(item.pricePerSession)}</TableCell>
                            <TableCell className="font-inter text-sm font-semibold">{formatAmount(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-edutrack-primary/5 rounded-xl">
                <span className="font-bold text-edutrack-dark">المبلغ الإجمالي</span>
                <span className="text-2xl font-bold text-edutrack-primary font-inter">{formatAmount(selectedInvoice.amount)}</span>
              </div>

              {/* Payment info */}
              {selectedInvoice.status === 'PAID' && selectedInvoice.paidAt && (
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">تم الدفع</span>
                  </div>
                  <p className="text-sm text-emerald-600 mt-1">
                    تاريخ الدفع: <span className="font-inter">{new Date(selectedInvoice.paidAt).toLocaleDateString('ar-DZ')}</span>
                    {selectedInvoice.paymentMethod && ` — ${paymentMethodLabels[selectedInvoice.paymentMethod] || selectedInvoice.paymentMethod}`}
                  </p>
                </div>
              )}

              {/* Mark as paid button if not paid */}
              {selectedInvoice.status !== 'PAID' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openMarkPaidDialog(selectedInvoice.id);
                  }}
                >
                  <Banknote className="h-4 w-4 ml-2" />
                  تحديد كمدفوع
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={markPaidDialogOpen} onOpenChange={setMarkPaidDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              تحديد الفاتورة كمدفوعة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">تاريخ الدفع</Label>
              <div className="relative">
                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="pr-10 h-11 font-inter"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">طريقة الدفع</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">نقدي</SelectItem>
                  <SelectItem value="BANK_TRANSFER">تحويل بنكي</SelectItem>
                  <SelectItem value="CHEQUE">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setMarkPaidDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={!paymentMethod || markingPaid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10"
            >
              {markingPaid ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'تأكيد الدفع'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Invoices Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Sparkles className="h-5 w-5 text-edutrack-secondary" />
              توليد فواتير الشهر
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">الشهر</Label>
                <Select value={generateMonth.toString()} onValueChange={(v) => setGenerateMonth(parseInt(v))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">السنة</Label>
                <Select value={generateYear.toString()} onValueChange={(v) => setGenerateYear(parseInt(v))}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-semibold">تنبيه</span>
              </div>
              <p className="text-sm text-amber-600">
                سيتم توليد فواتير لجميع التلاميذ المسجلين للمؤسسة. هذه العملية لا يمكن التراجع عنها.
              </p>
            </div>

            <div className="p-4 bg-edutrack-primary/5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">عدد التلاميذ المتوقع</span>
                <span className="font-bold text-edutrack-primary font-inter">{studentCount}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">الشهر المحدد</span>
                <span className="font-semibold text-edutrack-dark font-inter">{months[generateMonth - 1]} {generateYear}</span>
              </div>
            </div>

            {generating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">جاري التوليد...</span>
                  <span className="font-inter font-semibold text-edutrack-primary">{generateProgress}%</span>
                </div>
                <Progress value={generateProgress} className="h-2" />
              </motion.div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
              className="h-10"
            >
              <X className="h-4 w-4 ml-1" />
              إلغاء
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Sparkles className="h-4 w-4 ml-2" />
              )}
              تأكيد التوليد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
