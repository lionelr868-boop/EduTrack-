'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard, Plus, Search, CheckCircle2, Clock, XCircle,
  DollarSign, TrendingUp, AlertTriangle, Filter, ChevronLeft,
  ChevronRight, Building2, RefreshCw
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Payment {
  id: string;
  amount: number;
  plan: string;
  periodMonths: number;
  status: string;
  paymentMethod: string | null;
  transactionRef: string | null;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  dueDate: string | null;
  institution: {
    id: string;
    name: string;
    subscriptionPlan: string;
    frozen: boolean;
  };
}

interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  failedAmount: number;
  totalPayments: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
}

interface PaymentResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: PaymentSummary;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('ar-DZ') + ' دج';
}

function planLabel(plan: string): string {
  switch (plan) {
    case 'PREMIUM': return 'برومزي';
    case 'BASIC': return 'أساسي';
    case 'FREE': return 'مجاني';
    default: return plan;
  }
}

function planBadge(plan: string) {
  const cls = plan === 'PREMIUM'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : plan === 'BASIC'
      ? 'bg-sky-50 text-sky-700 border-sky-200'
      : 'bg-gray-50 text-gray-600 border-gray-200';
  return <Badge className={`${cls} text-[10px] px-1.5 py-0 border font-medium`}>{planLabel(plan)}</Badge>;
}

function statusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 border font-medium">مدفوع</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 border font-medium">معلّق</Badge>;
    case 'FAILED':
      return <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0 border font-medium">فاشل</Badge>;
    case 'REFUNDED':
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0 border font-medium">مسترد</Badge>;
    default:
      return <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 border">{status}</Badge>;
  }
}

function paymentMethodLabel(method: string | null): string {
  if (!method) return '-';
  switch (method) {
    case 'CCP': return 'CCP';
    case 'BANK_TRANSFER': return 'تحويل بنكي';
    case 'BARIDIMOB': return 'بريدي موب';
    case 'CASH': return 'نقدي';
    default: return method;
  }
}

export default function AdminPaymentsView() {
  const [data, setData] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`, {
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Payments fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, planFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
    try {
      setUpdating(paymentId);
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      await fetchPayments();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const summary = data?.summary;

  const summaryCards = summary ? [
    {
      label: 'إجمالي المدفوعات',
      value: formatCurrency(summary.totalAmount),
      count: summary.totalPayments,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'المدفوعة',
      value: formatCurrency(summary.paidAmount),
      count: summary.paidCount,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'المعلّقة',
      value: formatCurrency(summary.pendingAmount),
      count: summary.pendingCount,
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'الفاشلة',
      value: formatCurrency(summary.failedAmount),
      count: summary.failedCount,
      icon: <XCircle className="h-5 w-5" />,
      color: 'bg-red-50 text-red-600',
    },
  ] : [];

  // Filter payments by search term
  const filteredPayments = data?.payments.filter(p =>
    !search || p.institution.name.includes(search) || (p.transactionRef && p.transactionRef.includes(search)) || p.id.includes(search)
  ) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-0"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة المدفوعات
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">تتبع وإدارة مدفوعات الاشتراكات</p>
        </div>
        <Button
          onClick={fetchPayments}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card, i) => (
          <Card key={i} className="border-0 shadow-md shadow-gray-100/80 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-bold text-edutrack-dark mt-0.5 truncate">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground">{card.count} عملية</p>
                </div>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md shadow-gray-100/80 bg-white mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالمؤسسة أو رقم العملية..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val === 'ALL' ? '' : val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="PAID">مدفوع</SelectItem>
                <SelectItem value="PENDING">معلّق</SelectItem>
                <SelectItem value="FAILED">فاشل</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={(val) => { setPlanFilter(val === 'ALL' ? '' : val); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="الخطة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="PREMIUM">برومزي</SelectItem>
                <SelectItem value="BASIC">أساسي</SelectItem>
                <SelectItem value="FREE">مجاني</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground text-sm">جاري التحميل...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">لا توجد مدفوعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">المؤسسة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">المبلغ</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">الخطة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">المدة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">طريقة الدفع</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">الحالة</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">التاريخ</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${payment.institution.frozen ? 'bg-red-50' : 'bg-sky-50'}`}>
                            <Building2 className={`h-3.5 w-3.5 ${payment.institution.frozen ? 'text-red-500' : 'text-sky-500'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-edutrack-dark truncate max-w-[150px]">{payment.institution.name}</p>
                            {payment.transactionRef && (
                              <p className="text-[10px] text-muted-foreground">{payment.transactionRef}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-edutrack-dark">{formatCurrency(payment.amount)}</td>
                      <td className="p-3">{planBadge(payment.plan)}</td>
                      <td className="p-3 text-muted-foreground">{payment.periodMonths} شهر</td>
                      <td className="p-3 text-muted-foreground text-xs">{paymentMethodLabel(payment.paymentMethod)}</td>
                      <td className="p-3">{statusBadge(payment.status)}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="p-3">
                        {payment.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[11px]"
                              disabled={updating === payment.id}
                              onClick={() => handleStatusUpdate(payment.id, 'PAID')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                              تأكيد
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px]"
                              disabled={updating === payment.id}
                              onClick={() => handleStatusUpdate(payment.id, 'FAILED')}
                            >
                              <XCircle className="h-3.5 w-3.5 ml-1" />
                              رفض
                            </Button>
                          </div>
                        )}
                        {payment.status === 'FAILED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-[11px]"
                            disabled={updating === payment.id}
                            onClick={() => handleStatusUpdate(payment.id, 'PENDING')}
                          >
                            <RefreshCw className="h-3.5 w-3.5 ml-1" />
                            إعادة
                          </Button>
                        )}
                        {updating === payment.id && (
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-xs text-muted-foreground">
                عرض {((page - 1) * 15) + 1} - {Math.min(page * 15, data.total)} من {data.total}
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
