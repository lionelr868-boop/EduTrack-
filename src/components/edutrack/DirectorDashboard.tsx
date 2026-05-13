'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserCheck,
  CheckCircle,
  Banknote,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpLeft,
  ArrowDownLeft,
  GraduationCap,
  BookOpen,
  Receipt,
  X,
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

// ─── Animated Counter Hook ───────────────────────────────────────────────
function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

// ─── Stats Cards Data ────────────────────────────────────────────────────
interface StatCard {
  title: string;
  value: string;
  rawValue: number;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const statsCards: StatCard[] = [
  {
    title: 'التلاميذ المسجلين',
    value: '20',
    rawValue: 20,
    trend: '+12% من الشهر الماضي',
    trendUp: true,
    icon: <Users className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    title: 'الأساتذة النشطون',
    value: '3',
    rawValue: 3,
    trend: '+1 جديد',
    trendUp: true,
    icon: <UserCheck className="h-6 w-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    title: 'نسبة الحضور اليوم',
    value: '87%',
    rawValue: 87,
    trend: 'معدل جيد',
    trendUp: true,
    icon: <CheckCircle className="h-6 w-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    title: 'الإيرادات الشهرية',
    value: '1,560,000',
    rawValue: 1560000,
    trend: '+8%',
    trendUp: true,
    icon: <Banknote className="h-6 w-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    title: 'غيابات غير مبررة',
    value: '5',
    rawValue: 5,
    trend: 'تحتاج متابعة',
    trendUp: false,
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    title: 'حصص اليوم',
    value: '4',
    rawValue: 4,
    trend: 'من أصل 6',
    trendUp: true,
    icon: <Clock className="h-6 w-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
];

// ─── Chart Data ──────────────────────────────────────────────────────────
const revenueData = [
  { month: 'يناير', revenue: 1200000 },
  { month: 'فبراير', revenue: 1350000 },
  { month: 'مارس', revenue: 1100000 },
  { month: 'أبريل', revenue: 1480000 },
  { month: 'مايو', revenue: 1520000 },
  { month: 'يونيو', revenue: 1560000 },
];

const attendanceData = [
  { day: 'الأحد', rate: 92 },
  { day: 'الاثنين', rate: 88 },
  { day: 'الثلاثاء', rate: 85 },
  { day: 'الأربعاء', rate: 90 },
  { day: 'الخميس', rate: 87 },
];

const absenceDistribution = [
  { name: 'تلاميذ', value: 8, color: '#1A56DB' },
  { name: 'أساتذة', value: 1, color: '#F97316' },
];

const sessionsData = [
  { month: 'يناير', planned: 60, completed: 55 },
  { month: 'فبراير', planned: 56, completed: 52 },
  { month: 'مارس', planned: 62, completed: 58 },
  { month: 'أبريل', planned: 58, completed: 54 },
  { month: 'مايو', planned: 60, completed: 56 },
  { month: 'يونيو', planned: 54, completed: 50 },
];

// ─── Activities Data ─────────────────────────────────────────────────────
const activities = [
  { id: 1, text: 'تم تسجيل غياب أمين حسين عن حصة الرياضيات', time: 'منذ 5 دقائق', color: 'bg-red-500', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  { id: 2, text: 'فاتورة ياسين مراد تم دفعها', time: 'منذ 15 دقيقة', color: 'bg-green-500', icon: <Receipt className="h-4 w-4 text-green-500" /> },
  { id: 3, text: 'حصة تعويضية للفيزياء يوم الخميس', time: 'منذ 30 دقيقة', color: 'bg-blue-500', icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
  { id: 4, text: 'تسجيل حضور حصة اللغة الفرنسية', time: 'منذ ساعة', color: 'bg-emerald-500', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
  { id: 5, text: 'إبلاغ ولي أمر سارة حسين بغيابها', time: 'منذ ساعتين', color: 'bg-orange-500', icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
  { id: 6, text: 'تم إضافة تلميذ جديد: زينب شريف', time: 'منذ 3 ساعات', color: 'bg-blue-500', icon: <GraduationCap className="h-4 w-4 text-blue-500" /> },
  { id: 7, text: 'الأستاذ محمد العربي أكمل تسجيل الحضور', time: 'منذ 4 ساعات', color: 'bg-green-500', icon: <UserCheck className="h-4 w-4 text-green-500" /> },
  { id: 8, text: 'تذكير: 5 فواتير متأخرة هذا الشهر', time: 'أمس', color: 'bg-red-500', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
  { id: 9, text: 'تم تأكيد الحصة التعويضية للعلوم', time: 'أمس', color: 'bg-purple-500', icon: <BookOpen className="h-4 w-4 text-purple-500" /> },
  { id: 10, text: 'تقرير الشهر الماضي جاهز للتحميل', time: 'أمس', color: 'bg-blue-500', icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
];

// ─── Custom Tooltip Component ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 text-right" dir="rtl">
      <p className="text-xs font-semibold text-edutrack-dark mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full ml-1" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-edutrack-dark font-inter">{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString('ar-DZ') : p.value}</span>
          {p.value > 1000 && <span className="text-muted-foreground mr-1">دج</span>}
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────
function StatCardComponent({ card, index }: { card: StatCard; index: number }) {
  const animatedValue = useAnimatedCounter(card.rawValue, 1200 + index * 200);

  const formatValue = (val: number, title: string) => {
    if (title === 'الإيرادات الشهرية') {
      return val.toLocaleString('ar-DZ');
    }
    if (title === 'نسبة الحضور اليوم') {
      return `${val}%`;
    }
    return val.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Card className={`relative overflow-hidden border ${card.borderColor} hover:shadow-lg transition-all duration-300 group cursor-pointer`}>
        {/* Gradient accent on top */}
        <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-l ${
          card.title === 'التلاميذ المسجلين' ? 'from-blue-400 to-blue-600' :
          card.title === 'الأساتذة النشطون' ? 'from-green-400 to-green-600' :
          card.title === 'نسبة الحضور اليوم' ? 'from-emerald-400 to-emerald-600' :
          card.title === 'الإيرادات الشهرية' ? 'from-orange-400 to-orange-600' :
          card.title === 'غيابات غير مبررة' ? 'from-red-400 to-red-600' :
          'from-purple-400 to-purple-600'
        }`} />
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className={`text-2xl lg:text-3xl font-bold ${card.color} font-inter`}>
                {formatValue(animatedValue, card.title)}
                {card.title === 'الإيرادات الشهرية' && <span className="text-base mr-1">دج</span>}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {card.trendUp ? (
                  <ArrowUpLeft className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ArrowDownLeft className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend}
                </span>
              </div>
            </div>
            <div className={`${card.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
              <span className={card.color}>{card.icon}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Alert Banner ────────────────────────────────────────────────────────
function AlertBanner({ message, variant, onDismiss }: { message: string; variant: 'warning' | 'danger'; onDismiss: () => void }) {
  const bgColor = variant === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  const textColor = variant === 'warning' ? 'text-orange-800' : 'text-red-800';
  const iconColor = variant === 'warning' ? 'text-orange-500' : 'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor}`}
    >
      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      <p className={`text-sm font-medium flex-1 ${textColor}`}>{message}</p>
      <button
        onClick={onDismiss}
        className={`${iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── Main Director Dashboard ─────────────────────────────────────────────
export default function DirectorDashboard() {
  const user = useAppStore((s) => s.user);
  const [showWarningAlert, setShowWarningAlert] = useState(true);
  const [showDangerAlert, setShowDangerAlert] = useState(true);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-edutrack-dark">
            مرحباً، {user?.name?.split(' ')[0] || 'المدير'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إليك ملخص نشاط مؤسستك اليوم</p>
        </div>
        <Badge variant="outline" className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5">
          {new Date().toLocaleDateString('ar-DZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Badge>
      </motion.div>

      {/* Alert Banners */}
      <AnimatePresence>
        {(showWarningAlert || showDangerAlert) && (
          <div className="space-y-3">
            {showWarningAlert && (
              <AlertBanner
                message="3 تلاميذ غابوا اليوم ولم يُبلَّغ أولياؤهم"
                variant="warning"
                onDismiss={() => setShowWarningAlert(false)}
              />
            )}
            {showDangerAlert && (
              <AlertBanner
                message="5 فواتير متأخرة هذا الشهر"
                variant="danger"
                onDismiss={() => setShowDangerAlert(false)}
              />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((card, index) => (
          <StatCardComponent key={card.title} card={card} index={index} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-edutrack-primary" />
                تطور رقم الأعمال
              </CardTitle>
              <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="الإيرادات"
                      stroke="#1A56DB"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#1A56DB', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#1A56DB', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                نسبة الحضور أسبوعياً
              </CardTitle>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      domain={[70, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rate" name="نسبة الحضور" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {attendanceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.rate >= 90 ? '#10B981' : entry.rate >= 85 ? '#F97316' : '#EF4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Absence Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                توزيع الغيابات
              </CardTitle>
              <p className="text-xs text-muted-foreground">تلاميذ / أساتذة</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={absenceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {absenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-edutrack-dark">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                الحصص المقررة vs المنجزة
              </CardTitle>
              <p className="text-xs text-muted-foreground">آخر 6 أشهر</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionsData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="planned"
                      name="المقررة"
                      stroke="#1A56DB"
                      fill="#1A56DB"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="المنجزة"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-edutrack-dark">{value}</span>}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <Clock className="h-5 w-5 text-edutrack-primary" />
                النشاطات الأخيرة
              </CardTitle>
              <Badge variant="outline" className="text-xs border-edutrack-primary/20 text-edutrack-primary">
                آخر 24 ساعة
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.0 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-edutrack-dark leading-relaxed">{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {activity.icon}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
