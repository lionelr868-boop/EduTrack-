'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  BarChart3,
  Bell,
  Loader2,
  ArrowLeft,
  Zap,
  X,
  ClipboardCheck,
  Calendar,
  TrendingUp,
} from 'lucide-react';

type RoleType = 'DIRECTOR' | 'TEACHER' | 'PARENT';

const demoCredentials: Record<RoleType, { email: string; password: string }> = {
  DIRECTOR: { email: 'director1@edutrack.dz', password: 'demo123' },
  TEACHER: { email: 'teacher1@edutrack.dz', password: 'demo123' },
  PARENT: { email: 'parent1@edutrack.dz', password: 'demo123' },
};

const roleConfig: Record<RoleType, { label: string; icon: React.ReactNode; color: string }> = {
  DIRECTOR: { label: 'مدير', icon: <Shield className="h-4 w-4" />, color: 'bg-edutrack-primary' },
  TEACHER: { label: 'أستاذ', icon: <BookOpen className="h-4 w-4" />, color: 'bg-edutrack-secondary' },
  PARENT: { label: 'ولي أمر', icon: <Users className="h-4 w-4" />, color: 'bg-emerald-500' },
};

// ========================
// Platform Stats Banner (Real Data)
// ========================

interface PlatformStats {
  totalInstitutions: number;
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  totalParents: number;
  attendanceRate: number;
  totalRevenue: number;
}

function PlatformStatsBanner() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/platform/stats');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail - stats are decorative
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const statItems = [
    { icon: <ClipboardCheck className="h-4 w-4" />, value: stats?.totalInstitutions ?? 0, label: 'مؤسسة تعليمية' },
    { icon: <Users className="h-4 w-4" />, value: stats?.totalStudents ?? 0, label: 'تلميذ مسجّل' },
    { icon: <BookOpen className="h-4 w-4" />, value: stats?.totalTeachers ?? 0, label: 'أستاذ نشط' },
    { icon: <TrendingUp className="h-4 w-4" />, value: stats?.attendanceRate ?? 0, label: '% حضور', suffix: '%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="mt-10 w-full max-w-md"
    >
      <div className="grid grid-cols-4 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
            className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center"
          >
            <div className="text-edutrack-secondary mb-1 flex justify-center">{item.icon}</div>
            <div className="text-white font-bold text-sm font-inter">
              {item.value.toLocaleString()}{item.suffix || ''}
            </div>
            <div className="text-white/40 text-[10px] mt-0.5">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const { setCurrentView, setUser, demoMode, setDemoMode } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('DIRECTOR');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill demo credentials when role changes in demo mode
  useEffect(() => {
    if (demoMode) {
      const creds = demoCredentials[selectedRole];
      setEmail(creds.email);
      setPassword(creds.password);
    }
  }, [selectedRole, demoMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء تسجيل الدخول');
        return;
      }

      setUser(data);
      const roleViewMap: Record<string, string> = {
        DIRECTOR: 'director-dashboard',
        TEACHER: 'teacher-dashboard',
        PARENT: 'parent-dashboard',
      };
      setCurrentView(roleViewMap[data.role] as 'director-dashboard' | 'teacher-dashboard' | 'parent-dashboard');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);

    const creds = demoCredentials[selectedRole];

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء الدخول التجريبي');
        return;
      }

      setUser(data);
      const roleViewMap: Record<string, string> = {
        DIRECTOR: 'director-dashboard',
        TEACHER: 'teacher-dashboard',
        PARENT: 'parent-dashboard',
      };
      setCurrentView(roleViewMap[data.role] as 'director-dashboard' | 'teacher-dashboard' | 'parent-dashboard');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
  };

  const features = [
    { icon: <GraduationCap className="h-8 w-8" />, title: 'تسيير التلاميذ', desc: 'إدارة شاملة لبيانات التلاميذ والفصول' },
    { icon: <BookOpen className="h-8 w-8" />, title: 'الجدول الدراسي', desc: 'تنظيم الحصص والجداول الزمنية بسهولة' },
    { icon: <BarChart3 className="h-8 w-8" />, title: 'تقارير مفصلة', desc: 'إحصائيات وتقارير دقيقة حول المؤسسة' },
    { icon: <Bell className="h-8 w-8" />, title: 'إشعارات فورية', desc: 'تنبيهات تلقائية لأولياء الأمور' },
  ];

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-edutrack-light"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-12 w-12 rounded-xl bg-edutrack-primary flex items-center justify-center shadow-lg shadow-edutrack-primary/30">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-edutrack-dark gradient-text">EduTrack</h1>
              <p className="text-xs text-muted-foreground">منصة تسيير المؤسسات التعليمية</p>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-edutrack-dark">تسجيل الدخول</h2>
            <p className="text-muted-foreground mt-1">أدخل بياناتك للوصول إلى حسابك</p>
          </motion.div>

          {/* Demo Mode Banner */}
          <AnimatePresence>
            {demoMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="bg-edutrack-secondary/10 border border-edutrack-secondary/30 text-edutrack-secondary px-4 py-3 rounded-lg text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 flex-shrink-0" />
                    <span>وضع تجريبي — اختر الدور ثم اضغط &quot;دخول تجريبي&quot;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDemoMode(false)}
                    className="text-edutrack-secondary/60 hover:text-edutrack-secondary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <Label className="text-sm font-medium text-edutrack-dark mb-2 block">الدخول بصفتك</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(roleConfig) as [RoleType, typeof roleConfig[RoleType]][]).map(([role, config]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-300 ${
                    selectedRole === role
                      ? 'border-edutrack-primary bg-edutrack-primary/5 shadow-md shadow-edutrack-primary/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-white ${
                      selectedRole === role ? config.color : 'bg-gray-300'
                    } transition-colors duration-300`}
                  >
                    {config.icon}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      selectedRole === role ? 'text-edutrack-primary' : 'text-gray-500'
                    }`}
                  >
                    {config.label}
                  </span>
                  {selectedRole === role && (
                    <motion.div
                      layoutId="roleIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-edutrack-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleLogin}
          >
            <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-edutrack-dark">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10 h-11 bg-white border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-edutrack-dark">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10 h-11 bg-white border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-gray-300 data-[state=checked]:bg-edutrack-primary data-[state=checked]:border-edutrack-primary"
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      تذكرني
                    </Label>
                  </div>
                  <button type="button" className="text-sm text-edutrack-primary hover:underline">
                    نسيت كلمة المرور؟
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white font-medium rounded-lg shadow-lg shadow-edutrack-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-edutrack-primary/30"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>

                {/* Demo Login Button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={demoLoading}
                  onClick={handleDemoLogin}
                  className={`w-full h-11 font-medium rounded-lg transition-all duration-300 ${
                    demoMode
                      ? 'border-2 border-edutrack-secondary bg-edutrack-secondary/10 text-edutrack-secondary hover:bg-edutrack-secondary/20 hover:border-edutrack-secondary shadow-md shadow-edutrack-secondary/10'
                      : 'border-2 border-dashed border-edutrack-secondary/50 text-edutrack-secondary hover:bg-edutrack-secondary/5 hover:border-edutrack-secondary'
                  }`}
                >
                  {demoLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 ml-2" />
                      دخول تجريبي كـ{roleConfig[selectedRole].label}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-muted-foreground text-sm">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => setCurrentView('register')}
                  className="text-edutrack-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  سجّل الآن
                  <ArrowLeft className="h-3 w-3" />
                </button>
              </p>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>

      {/* Left Side - Decorative Illustration */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1A56DB 0%, #0F172A 60%, #F97316 150%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5 backdrop-blur-sm"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-32 left-16 w-48 h-48 rounded-full bg-white/5 backdrop-blur-sm"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-edutrack-secondary/10 backdrop-blur-sm"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">EduTrack</h2>
            <p className="text-white/70 text-lg">منصة متكاملة لتسيير المؤسسات التعليمية</p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 cursor-default"
              >
                <div className="text-edutrack-secondary mb-2">{feature.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Real Platform Stats */}
          <PlatformStatsBanner />
        </div>
      </motion.div>
    </div>
  );
}
