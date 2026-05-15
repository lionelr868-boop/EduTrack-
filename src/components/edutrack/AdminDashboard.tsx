'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Building2, Users, CreditCard, TrendingUp,
  TrendingDown, GraduationCap, UserCheck, AlertTriangle,
  DollarSign, Activity, Crown, Shield, ChevronRight,
  ArrowUpRight, ArrowDownRight, Minus, Clock, CheckCircle2,
  XCircle, Eye
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface DashboardData {
  institutions: {
    total: number;
    active: number;
    frozen: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  users: {
    byRole: Array<{ role: string; count: number }>;
    total: number;
  };
  students: number;
  teachers: number;
  parents: number;
  revenue: {
    total: number;
    pending: number;
  };
  recentInstitutions: Array<{
    id: string;
    name: string;
    subscriptionPlan: string;
    frozen: boolean;
    createdAt: string;
    city: string | null;
    _count: { students: number; teachers: number; users: number };
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    plan: string;
    createdAt: string;
    institution: { id: string; name: string };
  }>;
  monthlyRevenue: Array<{
    month: string;
    invoiceRevenue: number;
    paymentRevenue: number;
    total: number;
  }>;
  growth: {
    institutions: { thisMonth: number; lastMonth: number; growthPercent: string };
    students: { thisMonth: number; lastMonth: number; growthPercent: string };
    users: { thisMonth: number; lastMonth: number; growthPercent: string };
  };
}

function GrowthIndicator({ percent }: { percent: string }) {
  const val = parseFloat(percent);
  if (val > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
      <ArrowUpRight className="h-3 w-3" />+{percent}%
    </span>
  );
  if (val < 0) return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
      <ArrowDownRight className="h-3 w-3" />{percent}%
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs font-medium">
      <Minus className="h-3 w-3" />0%
    </span>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString('ar-DZ');
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

function roleLabel(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'مدير مؤسسة';
    case 'TEACHER': return 'أستاذ';
    case 'PARENT': return 'ولي أمر';
    case 'ADMIN': return 'مدير نظام';
    default: return role;
  }
}

function SimpleBarChart({ data, maxVal }: { data: Array<{ label: string; value: number; color: string }>; maxVal: number }) {
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <span className="text-[9px] text-muted-foreground font-medium">{item.value > 0 ? formatNumber(item.value) : '-'}</span>
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: maxVal > 0 ? `${Math.max(4, (item.value / maxVal) * 72)}px` : '4px',
              backgroundColor: item.color,
            }}
          />
          <span className="text-[9px] text-muted-foreground truncate max-w-[40px]" title={item.label}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'x-user-role': 'ADMIN' },
      });
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('خطأ في تحميل لوحة التحكم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="p-0" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-edutrack-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-edutrack-dark">لوحة تحكم المدير</h1>
            <p className="text-muted-foreground text-sm">جاري التحميل...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-md shadow-gray-100/80 bg-white">
              <CardContent className="p-5">
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                  <div className="h-7 bg-gray-200 rounded w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-0" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-edutrack-dark">خطأ</h1>
            <p className="text-muted-foreground text-sm">{error || 'لا توجد بيانات'}</p>
          </div>
        </div>
        <Button onClick={fetchDashboard}>إعادة المحاولة</Button>
      </div>
    );
  }

  // Role distribution
  const directorCount = data.users.byRole.find(r => r.role === 'DIRECTOR')?.count || 0;
  const teacherCount = data.users.byRole.find(r => r.role === 'TEACHER')?.count || 0;
  const parentCount = data.users.byRole.find(r => r.role === 'PARENT')?.count || 0;
  const adminCount = data.users.byRole.find(r => r.role === 'ADMIN')?.count || 0;

  // Plan distribution
  const premiumCount = data.institutions.byPlan.find(p => p.plan === 'PREMIUM')?.count || 0;
  const basicCount = data.institutions.byPlan.find(p => p.plan === 'BASIC')?.count || 0;
  const freeCount = data.institutions.byPlan.find(p => p.plan === 'FREE')?.count || 0;

  // Monthly revenue chart data
  const revenueChartData = data.monthlyRevenue.map(m => ({
    label: m.month.split(' ')[0].substring(0, 3),
    value: m.total,
    color: '#10b981',
  }));
  const maxRevenue = Math.max(...revenueChartData.map(d => d.value), 1);

  // User distribution chart
  const userChartData = [
    { label: 'مدير', value: directorCount, color: '#6366f1' },
    { label: 'أستاذ', value: teacherCount, color: '#f59e0b' },
    { label: 'ولي', value: parentCount, color: '#06b6d4' },
    { label: 'نظام', value: adminCount, color: '#8b5cf6' },
  ];
  const maxUsers = Math.max(...userChartData.map(d => d.value), 1);

  // Plan distribution chart
  const planChartData = [
    { label: 'برومزي', value: premiumCount, color: '#f59e0b' },
    { label: 'أساسي', value: basicCount, color: '#0ea5e9' },
    { label: 'مجاني', value: freeCount, color: '#9ca3af' },
  ];
  const maxPlans = Math.max(...planChartData.map(d => d.value), 1);

  const mainStats = [
    {
      label: 'المؤسسات',
      value: formatNumber(data.institutions.total),
      sub: `${data.institutions.active} نشطة · ${data.institutions.frozen} مجمدة`,
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-sky-50 text-sky-600',
      growth: <GrowthIndicator percent={data.growth.institutions.growthPercent} />,
    },
    {
      label: 'المستخدمون',
      value: formatNumber(data.users.total),
      sub: `${directorCount} مدير · ${teacherCount} أستاذ · ${parentCount} ولي`,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-emerald-50 text-emerald-600',
      growth: <GrowthIndicator percent={data.growth.users.growthPercent} />,
    },
    {
      label: 'التلاميذ',
      value: formatNumber(data.students),
      sub: `${data.teachers} أستاذ · ${data.parents} ولي أمر`,
      icon: <GraduationCap className="h-5 w-5" />,
      color: 'bg-violet-50 text-violet-600',
      growth: <GrowthIndicator percent={data.growth.students.growthPercent} />,
    },
    {
      label: 'الإيرادات',
      value: formatCurrency(data.revenue.total),
      sub: `${formatCurrency(data.revenue.pending)} معلّقة`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-amber-50 text-amber-600',
      growth: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-0"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-edutrack-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground text-sm">نظرة شاملة على المنصة</p>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mainStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-0 shadow-md shadow-gray-100/80 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-edutrack-dark mt-1 truncate">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {stat.growth}
                      <span className="text-[10px] text-muted-foreground truncate">{stat.sub}</span>
                    </div>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Revenue Trend */}
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white md:col-span-1">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              إيرادات الأشهر الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <SimpleBarChart data={revenueChartData} maxVal={maxRevenue} />
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-500" />
              توزيع المستخدمين
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <SimpleBarChart data={userChartData} maxVal={maxUsers} />
          </CardContent>
        </Card>

        {/* Institutions by Plan */}
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              المؤسسات حسب الخطة
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <SimpleBarChart data={planChartData} maxVal={maxPlans} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Institutions + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Institutions */}
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-500" />
                آخر المؤسسات
              </CardTitle>
              <button
                onClick={() => setView('admin-institutions')}
                className="text-xs text-edutrack-primary hover:underline flex items-center gap-1"
              >
                عرض الكل <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.recentInstitutions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">لا توجد مؤسسات بعد</p>
              ) : (
                data.recentInstitutions.map((inst) => (
                  <div key={inst.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${inst.frozen ? 'bg-red-50' : 'bg-sky-50'}`}>
                      {inst.frozen ? <Shield className="h-4 w-4 text-red-500" /> : <Building2 className="h-4 w-4 text-sky-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-edutrack-dark truncate">{inst.name}</p>
                        {planBadge(inst.subscriptionPlan)}
                        {inst.frozen && <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0 border">مجمدة</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {inst._count.students} تلميذ · {inst._count.teachers} أستاذ
                        {inst.city && ` · ${inst.city}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-500" />
                آخر المدفوعات
              </CardTitle>
              <button
                onClick={() => setView('admin-payments')}
                className="text-xs text-edutrack-primary hover:underline flex items-center gap-1"
              >
                عرض الكل <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.recentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">لا توجد مدفوعات بعد</p>
              ) : (
                data.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      payment.status === 'PAID' ? 'bg-emerald-50' :
                      payment.status === 'PENDING' ? 'bg-amber-50' : 'bg-red-50'
                    }`}>
                      {payment.status === 'PAID' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                       payment.status === 'PENDING' ? <Clock className="h-4 w-4 text-amber-500" /> :
                       <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-edutrack-dark truncate">{payment.institution.name}</p>
                        {statusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-edutrack-dark">{formatCurrency(payment.amount)}</span>
                        {planBadge(payment.plan)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
