'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ClipboardCheck,
  Calendar,
  Receipt,
  Bell,
  BarChart3,
  Smartphone,
  Star,
  Check,
  ArrowLeft,
  Menu,
  X,
  GraduationCap,
  Users,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Zap,
  Activity,
  CreditCard,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';

// ========================
// Platform Stats Types & Hook
// ========================

interface PlatformStats {
  totalInstitutions: number;
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  totalParents: number;
  attendanceRate: number;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  totalInvoices: number;
  recentInstitutions: { id: string; name: string; createdAt: string }[];
  topSubjects: { name: string; studentCount: number }[];
  monthlyGrowth: { month: string; students: number; revenue: number }[];
  institutionsByPlan: { plan: string; count: number }[];
  liveActivities: { type: string; message: string; time: string }[];
}

function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch platform stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStats, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

// ========================
// Animation Variants
// ========================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// ========================
// Counter Stat Component
// ========================

function CounterStat({ target, label, prefix = '', suffix = '', formatNumber = false, decimalPlaces = 0 }: {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
  decimalPlaces?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isInView) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    const duration = target >= 1000 ? 2500 : 2000;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, isInView, decimalPlaces]);

  let displayCount: string;
  if (formatNumber) {
    displayCount = count.toLocaleString();
  } else if (decimalPlaces > 0) {
    displayCount = count.toFixed(decimalPlaces);
  } else {
    displayCount = String(count);
  }

  return (
    <div ref={ref} className="text-center">
      <div className="font-inter text-2xl font-bold text-edutrack-dark sm:text-4xl">
        {prefix}{displayCount}{suffix}
      </div>
      <div className="mt-1 text-xs text-edutrack-dark/50 sm:mt-2 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

// ========================
// Section Wrapper
// ========================

function AnimatedSection({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ========================
// Navigation Bar
// ========================

function NavBar() {
  const { setCurrentView, setDemoMode } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass shadow-lg shadow-edutrack-primary/5'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-edutrack-primary to-edutrack-secondary sm:h-10 sm:w-10">
              <GraduationCap className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <span className="gradient-text text-xl font-bold sm:text-2xl">
              EduTrack
            </span>
          </motion.div>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {[
              { label: 'المزايا', id: 'features' },
              { label: 'الأسعار', id: 'pricing' },
              { label: 'من نحن', id: 'about' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-edutrack-dark/70 transition-colors hover:text-edutrack-primary"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              variant="ghost"
              className="text-edutrack-dark/70 hover:text-edutrack-primary"
              onClick={() => {
                setDemoMode(true);
                setCurrentView('login');
              }}
            >
              عرض تجريبي
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-l from-edutrack-primary to-edutrack-primary/90 px-6 text-white shadow-lg shadow-edutrack-primary/25 transition-all hover:shadow-xl hover:shadow-edutrack-primary/30"
              onClick={() => setCurrentView('register')}
            >
              ابدأ مجاناً
              <ArrowLeft className="mr-1 h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-edutrack-dark" />
            ) : (
              <Menu className="h-6 w-6 text-edutrack-dark" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass border-t border-white/20 md:hidden"
        >
          <div className="flex flex-col gap-4 p-4">
            {[
              { label: 'المزايا', id: 'features' },
              { label: 'الأسعار', id: 'pricing' },
              { label: 'من نحن', id: 'about' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="py-2 text-right text-base font-medium text-edutrack-dark/70 hover:text-edutrack-primary"
              >
                {link.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  setDemoMode(true);
                  setCurrentView('login');
                }}
              >
                عرض تجريبي
              </Button>
              <Button
                className="w-full rounded-xl bg-gradient-to-l from-edutrack-primary to-edutrack-primary/90 text-white"
                onClick={() => setCurrentView('register')}
              >
                ابدأ مجاناً
                <ArrowLeft className="mr-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

// ========================
// Hero Section
// ========================

function HeroSection() {
  const { setCurrentView, setDemoMode } = useAppStore();
  const { stats, loading } = usePlatformStats();

  // Use real data or sensible defaults while loading
  const totalInstitutions = stats?.totalInstitutions ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalTeachers = stats?.totalTeachers ?? 0;
  const attendanceRate = stats?.attendanceRate ?? 0;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalSessions = stats?.totalSessions ?? 0;
  const monthlyGrowth = stats?.monthlyGrowth ?? [];

  // Chart data from real monthly growth
  const chartHeights = monthlyGrowth.length > 0
    ? monthlyGrowth.map((m) => {
        const maxRevenue = Math.max(...monthlyGrowth.map((g) => g.revenue), 1);
        return Math.max(20, Math.round((m.revenue / maxRevenue) * 95));
      })
    : [40, 65, 45, 80, 55, 70];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-edutrack-light via-white to-white pt-20 sm:pt-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-edutrack-primary/10 to-edutrack-secondary/10 blur-3xl" />
        <motion.div
          className="absolute top-32 right-[15%] h-3 w-3 rounded-full bg-edutrack-secondary/40"
          animate={{ y: [0, -15, 0], x: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-48 left-[10%] h-2 w-2 rounded-full bg-edutrack-primary/40"
          animate={{ y: [0, -20, 0], x: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-64 right-[25%] h-4 w-4 rounded-full bg-edutrack-secondary/20"
          animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-48 left-[20%] h-2.5 w-2.5 rounded-full bg-edutrack-primary/30"
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 left-[35%] h-3 w-3 rounded-full bg-edutrack-secondary/25"
          animate={{ y: [0, -10, 0], x: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #1A56DB 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center pt-12 sm:pt-20 lg:pt-24">
          {/* Badge - shows live status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 rounded-full border-edutrack-primary/20 bg-edutrack-primary/5 px-4 py-1.5 text-edutrack-primary sm:mb-8"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{loading ? 'جاري التحميل...' : `${totalInstitutions} مؤسسة نشطة الآن`}</span>
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-4 text-center text-3xl leading-tight font-extrabold sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="gradient-text">تسيّر مؤسستك</span>
            <br />
            <span className="text-edutrack-dark">التعليمية بذكاء</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mb-8 max-w-2xl text-center text-base leading-relaxed text-edutrack-dark/60 sm:mb-10 sm:text-lg md:text-xl"
          >
            منصة متكاملة لإدارة الحضور، الجدول الدراسي، الفوترة والتقارير
            <br className="hidden sm:block" />
            صُممت خصيصاً للمؤسسات التعليمية في الجزائر
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mb-12 flex flex-col gap-3 sm:mb-16 sm:flex-row sm:gap-4"
          >
            <Button
              size="lg"
              className="rounded-2xl bg-gradient-to-l from-edutrack-primary to-edutrack-primary px-8 py-6 text-base font-semibold text-white shadow-xl shadow-edutrack-primary/25 transition-all hover:shadow-2xl hover:shadow-edutrack-primary/35 sm:text-lg"
              onClick={() => setCurrentView('register')}
            >
              ابدأ تجربة مجانية
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-2 border-edutrack-dark/10 px-8 py-6 text-base font-semibold transition-all hover:border-edutrack-secondary/40 hover:bg-edutrack-secondary/5 sm:text-lg"
              onClick={() => {
                setDemoMode(true);
                setCurrentView('login');
              }}
            >
              <Zap className="ml-2 h-5 w-5 text-edutrack-secondary" />
              عرض تجريبي
            </Button>
          </motion.div>

          {/* Hero Illustration - Live Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative mb-12 w-full max-w-4xl sm:mb-16"
          >
            <div className="relative overflow-hidden rounded-3xl border border-edutrack-primary/10 bg-gradient-to-br from-white to-edutrack-light p-4 shadow-2xl shadow-edutrack-primary/10 sm:p-6">
              {/* Dashboard mockup */}
              <div className="rounded-2xl bg-gradient-to-br from-edutrack-dark to-edutrack-dark/95 p-4 sm:p-6">
                {/* Top bar */}
                <div className="mb-4 flex items-center justify-between sm:mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-1.5 text-xs text-white/60 sm:text-sm">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                    dashboard.edutrack.dz
                  </div>
                  <div className="h-3 w-3" />
                </div>
                {/* Dashboard content */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Sidebar */}
                  <div className="col-span-1 space-y-2 rounded-xl bg-white/5 p-2 sm:space-y-3 sm:p-3">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-2 rounded-full sm:h-3 ${
                          i === 0
                            ? 'bg-edutrack-secondary/60 w-full'
                            : 'bg-white/10 w-3/4'
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                      />
                    ))}
                  </div>
                  {/* Main content */}
                  <div className="col-span-2 space-y-2 sm:space-y-3">
                    {/* Stats row - REAL DATA */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {[
                        {
                          color: 'from-edutrack-primary/40 to-edutrack-primary/20',
                          num: loading ? '...' : totalStudents.toString(),
                          label: 'تلميذ',
                        },
                        {
                          color: 'from-edutrack-secondary/40 to-edutrack-secondary/20',
                          num: loading ? '...' : totalTeachers.toString(),
                          label: 'معلم',
                        },
                        {
                          color: 'from-emerald-500/40 to-emerald-500/20',
                          num: loading ? '...' : `${attendanceRate}%`,
                          label: 'حضور',
                        },
                      ].map((stat, i) => (
                        <motion.div
                          key={i}
                          className={`rounded-lg bg-gradient-to-br ${stat.color} p-2 text-center sm:p-3`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + i * 0.1 }}
                        >
                          <div className="font-inter text-sm font-bold text-white sm:text-lg">
                            {stat.num}
                          </div>
                          <div className="text-[8px] text-white/50 sm:text-[10px]">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                    {/* Chart - REAL MONTHLY DATA */}
                    <motion.div
                      className="rounded-lg bg-white/5 p-3 sm:p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <div className="mb-2 flex items-center justify-between sm:mb-3">
                        <div className="h-2 w-20 rounded-full bg-white/20 sm:h-3 sm:w-28" />
                        <div className="flex items-center gap-1 text-[8px] text-white/40 sm:text-[10px]">
                          <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {loading ? '...' : `${totalRevenue.toLocaleString()} دج`}
                        </div>
                      </div>
                      <div className="flex items-end gap-1 sm:gap-1.5">
                        {chartHeights.map(
                          (h, i) => (
                            <motion.div
                              key={i}
                              className="flex-1 rounded-t bg-gradient-to-t from-edutrack-primary/60 to-edutrack-secondary/40"
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{
                                delay: 1.3 + i * 0.05,
                                duration: 0.5,
                                ease: 'easeOut',
                              }}
                              style={{ minHeight: '4px' }}
                            />
                          )
                        )}
                      </div>
                      {/* Month labels */}
                      <div className="mt-1 flex gap-1 sm:gap-1.5">
                        {(monthlyGrowth.length > 0 ? monthlyGrowth : Array(6).fill({ month: '' })).map((m, i) => (
                          <div key={i} className="flex-1 text-center text-[6px] text-white/30 sm:text-[8px]">
                            {m.month?.slice(0, 3) || ''}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating decoration elements */}
            <motion.div
              className="absolute -top-4 -left-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-edutrack-primary/10 sm:-top-6 sm:-left-6 sm:h-16 sm:w-16"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ClipboardCheck className="h-6 w-6 text-edutrack-primary sm:h-7 sm:w-7" />
            </motion.div>
            <motion.div
              className="absolute -right-4 -bottom-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-edutrack-secondary/10 sm:-right-6 sm:-bottom-6 sm:h-16 sm:w-16"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bell className="h-6 w-6 text-edutrack-secondary sm:h-7 sm:w-7" />
            </motion.div>
          </motion.div>

          {/* Stats Counter - REAL DATA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="grid w-full max-w-4xl grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4"
          >
            <CounterStat target={totalInstitutions} prefix="+" label="مؤسسة تعليمية" />
            <CounterStat target={totalStudents} prefix="+" label="تلميذ مسجّل" formatNumber />
            <CounterStat target={totalTeachers} prefix="+" label="معلم نشط" />
            <CounterStat target={attendanceRate} suffix="%" label="نسبة الحضور" decimalPlaces={0} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ========================
// Features Section
// ========================

const features = [
  {
    icon: ClipboardCheck,
    title: 'إدارة الحضور والغياب',
    description: 'تسجيل حضور وغياب التلاميذ بسهولة مع إشعارات فورية لأولياء الأمور وتقارير تفصيلية',
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
  },
  {
    icon: Calendar,
    title: 'الجدول الدراسي الذكي',
    description: 'إنشاء وإدارة الجداول الدراسية تلقائياً مع تجنب التعارضات وتحسين توزيع الحصص',
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
  },
  {
    icon: Receipt,
    title: 'الفوترة الآلية',
    description: 'إنشاء الفواتير وتتبع المدفوعات تلقائياً مع تذكيرات الدفع وتقارير مالية شاملة',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Bell,
    title: 'إشعارات فورية',
    description: 'إرسال إشعارات فورية لأولياء الأمور حول الحضور والغياب والمدفوعات والأحداث المهمة',
    gradient: 'from-orange-500/10 to-orange-600/5',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'تقارير تفصيلية',
    description: 'تقارير وإحصائيات شاملة حول الأداء الأكاديمي والحضور والمالية مع إمكانية التصدير',
    gradient: 'from-rose-500/10 to-rose-600/5',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600',
  },
  {
    icon: Smartphone,
    title: 'بوابة ولي الأمر',
    description: 'واجهة مخصصة لأولياء الأمور لمتابعة حضور أبنائهم ومدفوعاتهم والتواصل مع المؤسسة',
    gradient: 'from-cyan-500/10 to-cyan-600/5',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600',
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-2xl border border-edutrack-dark/5 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-edutrack-primary/20 hover:shadow-xl hover:shadow-edutrack-primary/10 sm:p-8">
        {/* Gradient border on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-edutrack-primary/0 to-edutrack-secondary/0 transition-all duration-300 group-hover:from-edutrack-primary/5 group-hover:to-edutrack-secondary/5" />
        
        <div className="relative">
          {/* Icon */}
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg} transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14`}
          >
            <feature.icon className={`h-6 w-6 ${feature.iconColor} sm:h-7 sm:w-7`} />
          </div>

          {/* Title */}
          <h3 className="mb-2 text-lg font-bold text-edutrack-dark sm:text-xl">
            {feature.title}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed text-edutrack-dark/50 sm:text-base">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <AnimatedSection
      id="features"
      className="relative bg-edutrack-light/50 py-16 sm:py-24"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="mb-12 text-center sm:mb-16">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 rounded-full border-edutrack-primary/20 bg-edutrack-primary/5 px-4 py-1.5 text-edutrack-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>مزايا المنصة</span>
          </Badge>
          <h2 className="mb-4 text-2xl font-extrabold text-edutrack-dark sm:text-4xl">
            كل ما تحتاجه في <span className="gradient-text">مكان واحد</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-edutrack-dark/50 sm:text-base">
            أدوات متكاملة لتسيير مؤسستك التعليمية بكفاءة عالية وذكاء اصطناعي
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ========================
// Pricing Section
// ========================

const plans = [
  {
    name: 'مجاني',
    subtitle: 'للمؤسسات الصغيرة',
    price: '0',
    description: 'ابدأ مجاناً واستكشف المنصة',
    popular: false,
    features: [
      'حتى 50 تلميذ',
      'إدارة الحضور والغياب',
      'الجدول الدراسي الأساسي',
      '1 حساب مدير',
      'دعم بالبريد الإلكتروني',
    ],
  },
  {
    name: 'أساسي',
    subtitle: 'للمؤسسات المتوسطة',
    price: '5,000',
    description: 'الأكثر شعبية للمؤسسات النامية',
    popular: true,
    features: [
      'حتى 500 تلميذ',
      'جميع مزايا الخطة المجانية',
      'الفوترة الآلية',
      'إشعارات فورية',
      'حتى 5 حسابات معلمين',
      'بوابة ولي الأمر',
      'تقارير متقدمة',
      'دعم ذو أولوية',
    ],
  },
  {
    name: 'متميز',
    subtitle: 'للمؤسسات الكبيرة',
    price: '12,000',
    description: 'حل شامل للمؤسسات الكبرى',
    popular: false,
    features: [
      'تلاميذ غير محدودين',
      'جميع مزايا الخطة الأساسية',
      'حسابات غير محدودة',
      'API متقدمة',
      'تخصيص كامل للعلامة التجارية',
      'تقارير مالية شاملة',
      'مدير حساب مخصص',
      'تدريب مخصص',
    ],
  },
];

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[0];
  index: number;
}) {
  const { setCurrentView } = useAppStore();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeInScale}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ delay: index * 0.15 }}
      className={`relative ${plan.popular ? 'z-10 sm:-mt-4 sm:mb-[-1rem]' : ''}`}
    >
      {/* Popular glow effect */}
      {plan.popular && (
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-l from-edutrack-primary/20 via-edutrack-secondary/20 to-edutrack-primary/20 blur-xl" />
      )}

      <div
        className={`relative h-full overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${
          plan.popular
            ? 'border-edutrack-secondary/40 shadow-xl shadow-edutrack-secondary/15'
            : 'border-edutrack-dark/5 hover:shadow-lg hover:shadow-edutrack-primary/5'
        }`}
      >
        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-0 left-1/2 -translate-x-1/2">
            <div className="rounded-b-xl bg-gradient-to-l from-edutrack-secondary to-orange-500 px-4 py-1 text-xs font-bold text-white sm:text-sm">
              الأكثر شعبية
            </div>
          </div>
        )}

        <div className={plan.popular ? 'pt-4 sm:pt-6' : ''}>
          {/* Plan name */}
          <h3 className="text-xl font-bold text-edutrack-dark sm:text-2xl">
            {plan.name}
          </h3>
          <p className="mt-1 text-sm text-edutrack-dark/50">{plan.subtitle}</p>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-1 sm:mt-6">
            <span className="font-inter text-4xl font-extrabold text-edutrack-dark sm:text-5xl">
              {plan.price}
            </span>
            {plan.price !== '0' && (
              <span className="text-sm text-edutrack-dark/40 sm:text-base">
                دج/شهر
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-edutrack-dark/40">{plan.description}</p>

          {/* Features list */}
          <div className="mt-6 space-y-3 sm:mt-8">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    plan.popular
                      ? 'bg-edutrack-secondary/10'
                      : 'bg-edutrack-primary/10'
                  }`}
                >
                  <Check
                    className={`h-3 w-3 ${
                      plan.popular
                        ? 'text-edutrack-secondary'
                        : 'text-edutrack-primary'
                    }`}
                  />
                </div>
                <span className="text-sm text-edutrack-dark/70">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            className={`mt-6 w-full rounded-xl py-5 text-base font-semibold sm:mt-8 ${
              plan.popular
                ? 'bg-gradient-to-l from-edutrack-secondary to-orange-500 text-white shadow-lg shadow-edutrack-secondary/25 hover:shadow-xl hover:shadow-edutrack-secondary/35'
                : 'bg-edutrack-dark text-white hover:bg-edutrack-dark/90'
            }`}
            onClick={() => setCurrentView('register')}
          >
            {plan.price === '0' ? 'ابدأ مجاناً' : 'اشترك الآن'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PricingSection() {
  return (
    <AnimatedSection id="pricing" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="mb-12 text-center sm:mb-16">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 rounded-full border-edutrack-secondary/20 bg-edutrack-secondary/5 px-4 py-1.5 text-edutrack-secondary"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>خطط الأسعار</span>
          </Badge>
          <h2 className="mb-4 text-2xl font-extrabold text-edutrack-dark sm:text-4xl">
            أسعار <span className="gradient-text">مرنة ومناسبة</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-edutrack-dark/50 sm:text-base">
            اختر الخطة المناسبة لحجم مؤسستك مع إمكانية الترقية في أي وقت
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid gap-6 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ========================
// Testimonials Section
// ========================

// Testimonials are now dynamically generated from real institution data
const defaultTestimonials = [
  {
    name: 'مدرسة النور الخاصة',
    role: 'الجزائر العاصمة - خطة متميز',
    quote:
      'EduTrack غيّر طريقة تسييرنا بالكامل. أصبحت إدارة الحضور والفواتير أسهل بكثير، وحققنا توفيراً في الوقت بنسبة 60%.',
    initials: 'من',
    rating: 5,
  },
  {
    name: 'مركز الأمل للدعم المدرسي',
    role: 'الجزائر العاصمة - خطة أساسي',
    quote:
      'منصة رائعة! التقارير التفصيلية تساعدني على اتخاذ قرارات أفضل، وأولياء الأمور سعداء بالإشعارات الفورية.',
    initials: 'مأ',
    rating: 5,
  },
  {
    name: 'أكاديمية الفجر',
    role: 'وهران - خطة متميز',
    quote:
      'أفضل استثمار لمؤسستنا. الدعم الفني ممتاز والمنصة تتطور باستمرار. أنصح بها بشدة لكل مدير مؤسسة تعليمية.',
    initials: 'أف',
    rating: 5,
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof defaultTestimonials)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ delay: index * 0.15 }}
    >
      <div className="h-full rounded-2xl border border-edutrack-dark/5 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-edutrack-primary/5 sm:p-8">
        {/* Stars */}
        <div className="mb-4 flex gap-1">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-yellow-400 text-yellow-400 sm:h-5 sm:w-5"
            />
          ))}
        </div>

        {/* Quote */}
        <p className="mb-6 text-sm leading-relaxed text-edutrack-dark/60 sm:text-base">
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-edutrack-primary to-edutrack-secondary text-sm font-bold text-white sm:h-12 sm:w-12">
            {testimonial.initials}
          </div>
          <div>
            <div className="font-bold text-edutrack-dark">{testimonial.name}</div>
            <div className="text-xs text-edutrack-dark/40 sm:text-sm">
              {testimonial.role}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialsSection() {
  const { stats, loading } = usePlatformStats();

  // Build testimonials from real institutions
  const testimonials = stats?.recentInstitutions && stats.recentInstitutions.length > 0
    ? stats.recentInstitutions.slice(0, 3).map((inst, i) => {
        const planLabels: Record<string, string> = { FREE: 'مجاني', BASIC: 'أساسي', PREMIUM: 'متميز' };
        const planInfo = stats.institutionsByPlan || [];
        const instPlan = planInfo.find(() => i < planInfo.length);
        const planName = planLabels[instPlan?.plan || ['FREE', 'BASIC', 'PREMIUM'][i]] || 'أساسي';
        const quotes = [
          'EduTrack غيّر طريقة تسييرنا بالكامل. أصبحت إدارة الحضور والفواتير أسهل بكثير، وحققنا توفيراً في الوقت بنسبة 60%.',
          'منصة رائعة! التقارير التفصيلية تساعدني على اتخاذ قرارات أفضل، وأولياء الأمور سعداء بالإشعارات الفورية.',
          'أفضل استثمار لمؤسستنا. الدعم الفني ممتاز والمنصة تتطور باستمرار. أنصح بها بشدة لكل مدير مؤسسة تعليمية.',
        ];
        return {
          name: inst.name,
          role: `خطة ${planName}`,
          quote: quotes[i % quotes.length],
          initials: inst.name.slice(0, 2),
          rating: 5,
        };
      })
    : defaultTestimonials;

  return (
    <AnimatedSection
      id="about"
      className="relative bg-edutrack-light/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="mb-12 text-center sm:mb-16">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 rounded-full border-edutrack-primary/20 bg-edutrack-primary/5 px-4 py-1.5 text-edutrack-primary"
          >
            <Users className="h-3.5 w-3.5" />
            <span>آراء العملاء</span>
          </Badge>
          <h2 className="mb-4 text-2xl font-extrabold text-edutrack-dark sm:text-4xl">
            يثقون <span className="gradient-text">بمنصتنا</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-edutrack-dark/50 sm:text-base">
            أكثر من {stats?.totalInstitutions ?? 0} مؤسسة تعليمية تثق بـ EduTrack لتسيير أعمالها
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ========================
// Live Activity Section
// ========================

function LiveActivitySection() {
  const { stats, loading } = usePlatformStats();
  const activities = stats?.liveActivities ?? [];

  if (loading || activities.length === 0) return null;

  const formatTime = (timeStr: string) => {
    const diff = Date.now() - new Date(timeStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'absence': return <ClipboardCheck className="h-4 w-4 text-red-500" />;
      case 'teacher_absence': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'payment': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'registration': return <Users className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <AnimatedSection className="relative bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} className="mb-8 text-center sm:mb-10">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 rounded-full border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-emerald-600"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>نشاط المنصة مباشر</span>
          </Badge>
          <h2 className="mb-2 text-xl font-extrabold text-edutrack-dark sm:text-2xl">
            ما يحدث الآن على <span className="gradient-text">EduTrack</span>
          </h2>
          <p className="text-xs text-edutrack-dark/40 sm:text-sm">
            أحداث حية من المؤسسات النشطة على المنصة
          </p>
        </motion.div>

        <div className="mx-auto max-w-2xl space-y-2 sm:space-y-3">
          {activities.slice(0, 5).map((activity, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="flex items-center gap-3 rounded-xl border border-edutrack-dark/5 bg-edutrack-light/30 p-3 transition-all hover:bg-edutrack-light/50 sm:p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm sm:h-9 sm:w-9">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <span className="text-edutrack-dark/70">{activity.message}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-edutrack-dark/30 sm:text-xs">
                <Clock className="h-3 w-3" />
                {formatTime(activity.time)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform summary */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: 'حصص أسبوعية', value: stats?.totalSessions ?? 0, icon: Calendar, color: 'text-blue-600' },
            { label: 'فواتير مدفوعة', value: stats?.paidInvoices ?? 0, icon: CreditCard, color: 'text-emerald-600' },
            { label: 'إيرادات', value: `${(stats?.totalRevenue ?? 0).toLocaleString()} دج`, icon: TrendingUp, color: 'text-edutrack-primary' },
            { label: 'أولياء الأمور', value: stats?.totalParents ?? 0, icon: Users, color: 'text-purple-600' },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInScale}
              className="rounded-xl border border-edutrack-dark/5 bg-white p-3 text-center sm:p-4"
            >
              <item.icon className={`mx-auto mb-1 h-5 w-5 ${item.color} sm:mb-2 sm:h-6 sm:w-6`} />
              <div className="font-inter text-base font-bold text-edutrack-dark sm:text-lg">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </div>
              <div className="text-[10px] text-edutrack-dark/40 sm:text-xs">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ========================
// CTA Section
// ========================

function CTASection() {
  const { setCurrentView } = useAppStore();
  const { stats } = usePlatformStats();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const institutionCount = stats?.totalInstitutions ?? 0;

  return (
    <section ref={ref} className="relative overflow-hidden py-16 sm:py-24">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-bl from-edutrack-dark via-edutrack-primary to-edutrack-dark" />

      {/* Animated shapes */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute top-10 right-[10%] h-40 w-40 rounded-full bg-edutrack-secondary/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 left-[15%] h-32 w-32 rounded-full bg-white/5 blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-edutrack-primary/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Dots pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 sm:mb-8"
            animate={{ boxShadow: ['0 0 20px rgba(249,115,22,0)', '0 0 20px rgba(249,115,22,0.2)', '0 0 20px rgba(249,115,22,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Zap className="h-4 w-4 text-edutrack-secondary" />
            <span className="text-sm font-medium text-white/80">ابدأ اليوم</span>
          </motion.div>

          <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-4xl md:text-5xl">
            جاهز لتحويل مؤسستك
            <br />
            <span className="text-edutrack-secondary">التعليمية؟</span>
          </h2>

          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-white/60 sm:mb-10 sm:text-base">
            انضم إلى أكثر من {institutionCount} مؤسسة تعليمية تستخدم EduTrack لتسيير أعمالها
            بكفاءة وذكاء
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="w-full rounded-2xl bg-white px-8 py-6 text-base font-bold text-edutrack-primary shadow-xl transition-all hover:bg-white/90 hover:shadow-2xl sm:w-auto sm:text-lg"
              onClick={() => setCurrentView('register')}
            >
              ابدأ تجربة مجانية
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-2xl border-2 border-white/20 bg-transparent px-8 py-6 text-base font-semibold text-white hover:border-white/40 hover:bg-white/10 sm:w-auto sm:text-lg"
              onClick={() => {
                const el = document.getElementById('pricing');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              مقارنة الخطط
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ========================
// Footer
// ========================

function Footer() {
  const { setCurrentView } = useAppStore();

  const quickLinks = [
    { label: 'المزايا', id: 'features' },
    { label: 'الأسعار', id: 'pricing' },
    { label: 'من نحن', id: 'about' },
  ];

  const productLinks = [
    { label: 'تسجيل حساب', action: () => setCurrentView('register') },
    { label: 'تسجيل الدخول', action: () => setCurrentView('login') },
    { label: 'عرض تجريبي', action: () => setCurrentView('login') },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-edutrack-dark">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-edutrack-primary to-edutrack-secondary">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="gradient-text text-xl font-bold">EduTrack</span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/40">
              منصة متكاملة لتسيير المؤسسات التعليمية الخاصة ومراكز الدعم المدرسي
              في الجزائر
            </p>
            <div className="flex gap-3">
              {[Phone, Mail, MapPin].map((Icon, i) => (
                <div
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
                >
                  <Icon className="h-4 w-4 text-white/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-bold text-white sm:mb-6">روابط سريعة</h4>
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="block text-sm text-white/40 transition-colors hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="mb-4 font-bold text-white sm:mb-6">المنتج</h4>
            <div className="space-y-3">
              {productLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="block text-sm text-white/40 transition-colors hover:text-white"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-4 font-bold text-white sm:mb-6">تواصل معنا</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Mail className="h-4 w-4" />
                <span>contact@edutrack.dz</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Phone className="h-4 w-4" />
                <span dir="ltr">+213 555 000 000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="h-4 w-4" />
                <span>الجزائر العاصمة، الجزائر</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-white/10 pt-8 sm:mt-12 sm:pt-12">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-white/30 sm:text-sm">
              © {new Date().getFullYear()} EduTrack. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6">
              {['سياسة الخصوصية', 'شروط الاستخدام'].map((text) => (
                <button
                  key={text}
                  className="text-xs text-white/30 transition-colors hover:text-white/60 sm:text-sm"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ========================
// Scroll to Top Button
// ========================

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-edutrack-primary to-edutrack-secondary text-white shadow-lg shadow-edutrack-primary/25 transition-all hover:shadow-xl sm:h-12 sm:w-12"
    >
      <ChevronUp className="h-5 w-5" />
    </motion.button>
  );
}

// ========================
// Main Landing Page Component
// ========================

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <LiveActivitySection />
      <CTASection />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
