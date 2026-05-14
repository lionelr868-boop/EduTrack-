'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────
interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalSections: number;
  totalYears: number;
  attendanceRate: number;
  monthlyRevenue: number;
  revenue: number;
  unexcusedAbsences: number;
  todaySessionsCount: number;
  totalSessions: number;
  studentAbsences: number;
  teacherAbsences: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenueTrend: Array<{ month: string; revenue: number; paidInvoices: number }>;
  attendanceTrend: Array<{ day: string; rate: number }>;
  studentsByLevel: Array<{ level: string; count: number; color: string }>;
  sectionsByLevel: Array<{ level: string; count: number }>;
  yearsHierarchy: Array<{
    id: string;
    name: string;
    level: string;
    order: number;
    sections: Array<{
      id: string;
      name: string;
      studentCount: number;
      supervisorName: string | null;
      capacity: number;
    }>;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    subjectName: string;
    level: string;
    phone: string | null;
    supervisedSections: Array<{ id: string; name: string; yearName: string }>;
  }>;
  absenceDistribution: { student: number; teacher: number };
  recentActivities: Array<{
    id: string;
    text: string;
    time: string;
    color: string;
    type: string;
  }>;
  notifications: {
    unreadCount: number;
    latest: Array<{
      id: string;
      title: string | null;
      message: string;
      type: string;
      read: boolean;
      createdAt: string;
    }>;
  };
}

// ─── Custom Tooltip ──────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 text-right"
      dir="rtl"
    >
      <p className="text-xs font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full ml-1"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{' '}
          <span className="font-semibold text-gray-800 font-inter">
            {typeof p.value === 'number' && p.value > 1000
              ? p.value.toLocaleString('ar-DZ')
              : p.value}
          </span>
          {p.value > 1000 && (
            <span className="text-muted-foreground mr-1">دج</span>
          )}
        </p>
      ))}
    </div>
  );
}

// ─── Charts Component ────────────────────────────────────────
export default function DashboardCharts({ data }: { data: DashboardData }) {
  const sessionsData = data.revenueTrend.map((d) => ({
    month: d.month,
    planned: data.totalSessions > 0 ? Math.round(data.totalSessions / 6) : 0,
    completed: data.totalSessions > 0 ? Math.round((data.totalSessions / 6) * (data.attendanceRate / 100)) : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
      {/* Revenue Line Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            تطور رقم الأعمال
          </CardTitle>
          <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                          ? `${(value / 1000).toFixed(0)}K`
                          : `${value}`
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="الإيرادات"
                    stroke="#0D9488"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Bar Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            نسبة الحضور أسبوعياً
          </CardTitle>
          <p className="text-xs text-muted-foreground">حسب أيام الأسبوع</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {data.attendanceTrend.some((d) => d.rate > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attendanceTrend.filter((d) => d.rate > 0)} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[70, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" name="نسبة الحضور" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {data.attendanceTrend
                      .filter((d) => d.rate > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.rate >= 90 ? '#10B981' : entry.rate >= 85 ? '#F59E0B' : '#EF4444'}
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات حضور
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Distribution Pie Chart - No inline labels, legend shows percentages */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-500" />
            توزيع التلاميذ حسب المستوى
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            إجمالي: <span className="font-inter font-semibold">{data.totalStudents}</span> تلميذ
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center">
            {data.studentsByLevel.length > 0 && data.studentsByLevel.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.studentsByLevel.filter((d) => d.count > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="level"
                  >
                    {data.studentsByLevel
                      .filter((d) => d.count > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => {
                      const item = data.studentsByLevel.find((d) => d.level === value);
                      const count = item?.count || 0;
                      const total = data.totalStudents || 1;
                      const pct = ((count / total) * 100).toFixed(0);
                      return (
                        <span className="text-xs text-gray-800">
                          {value} ({pct}%)
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-10 w-10 text-gray-300" />
                  <p>لا توجد بيانات تلاميذ</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Overview Area Chart */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-500" />
            الحصص المقررة vs المنجزة
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            بناءً على نسبة الحضور{' '}
            <span className="font-inter font-semibold">{data.attendanceRate}%</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {sessionsData.length > 0 && data.totalSessions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="planned" name="المقررة" stroke="#0D9488" fill="#0D9488" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" name="المنجزة" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-gray-800">{value}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                لا توجد بيانات حصص
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
