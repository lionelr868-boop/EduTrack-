'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Building2,
  BookOpen,
  Check,
  ArrowLeft,
  ArrowRight,
  Search,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  X,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────
interface Institution {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  wilaya: string | null;
  logo: string | null;
}

interface Subject {
  id: string;
  name: string;
  level: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  institutionId: string;
  institutionName: string;
  level: string;
  subjectId: string;
  subjectName: string;
  specialization: string;
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const TOTAL_STEPS = 4;

const levelOptions = [
  {
    value: 'ابتدائي',
    label: 'ابتدائي',
    description: 'التعليم الابتدائي',
    icon: '📚',
    borderColor: 'border-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    checkBg: 'bg-amber-500',
  },
  {
    value: 'متوسط',
    label: 'متوسط',
    description: 'التعليم المتوسط',
    icon: '📖',
    borderColor: 'border-orange-400',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    checkBg: 'bg-orange-500',
  },
  {
    value: 'ثانوي',
    label: 'ثانوي',
    description: 'التعليم الثانوي',
    icon: '🎓',
    borderColor: 'border-red-400',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    checkBg: 'bg-red-500',
  },
];

const stepConfig = [
  { number: 1, title: 'المعلومات الشخصية', icon: <User className="h-5 w-5" /> },
  { number: 2, title: 'اختيار المؤسسة', icon: <Building2 className="h-5 w-5" /> },
  { number: 3, title: 'الطور والمادة', icon: <BookOpen className="h-5 w-5" /> },
  { number: 4, title: 'التأكيد', icon: <Check className="h-5 w-5" /> },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
};

export default function TeacherRegisterPage() {
  const { setCurrentView, setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [direction, setDirection] = useState(0);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    institutionId: '',
    institutionName: '',
    level: '',
    subjectId: '',
    subjectName: '',
    specialization: '',
    termsAccepted: false,
  });

  // Institution search state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // ─── Fetch Institutions ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchInstitutions() {
      setLoadingInstitutions(true);
      try {
        const res = await fetch(`/api/institutions?search=${encodeURIComponent(institutionSearch)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setInstitutions(data.institutions);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoadingInstitutions(false);
      }
    }
    const debounce = setTimeout(fetchInstitutions, 300);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [institutionSearch]);

  // ─── Close dropdown on outside click ───────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowInstitutionDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Fetch Subjects when institution selected ──────────
  useEffect(() => {
    if (!formData.institutionId) {
      setSubjects([]);
      return;
    }
    let cancelled = false;
    async function fetchSubjects() {
      setLoadingSubjects(true);
      try {
        const res = await fetch(`/api/teachers/subjects?institutionId=${formData.institutionId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }
    fetchSubjects();
    return () => {
      cancelled = true;
    };
  }, [formData.institutionId]);

  // ─── Filter subjects by selected level ─────────────────
  const filteredSubjects = formData.level
    ? subjects.filter((s) => s.level === formData.level)
    : [];

  // ─── Update form field ─────────────────────────────────
  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ─── Validate Steps ────────────────────────────────────
  const validateStep = (stepNum: number): boolean => {
    const newErrors: FormErrors = {};

    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = 'الاسم الكامل مطلوب';
      if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = 'بريد إلكتروني غير صالح';
      if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
      else if (formData.password.length < 6)
        newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    if (stepNum === 2) {
      if (!formData.institutionId) newErrors.institutionId = 'يجب اختيار المؤسسة';
    }

    if (stepNum === 3) {
      if (!formData.level) newErrors.level = 'يجب اختيار الطور التعليمي';
      if (!formData.subjectId) newErrors.subjectId = 'يجب اختيار المادة';
    }

    if (stepNum === 4) {
      if (!formData.termsAccepted) newErrors.termsAccepted = 'يجب الموافقة على الشروط';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setDirection(1);
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (targetStep: number) => {
    setDirection(targetStep > step ? 1 : -1);
    setStep(targetStep);
  };

  // ─── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          institutionId: formData.institutionId,
          level: formData.level,
          subjectId: formData.subjectId,
          phone: formData.phone || undefined,
          specialization: formData.specialization || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء التسجيل');
        return;
      }

      setUser(data.user);
      setRegistrationSuccess(true);
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;

  // ─── Success Screen ────────────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-edutrack-light" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/30"
          >
            <Check className="h-12 w-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-edutrack-dark mb-3">تم التسجيل بنجاح!</h2>
          <p className="text-muted-foreground mb-2">
            مرحباً بك <span className="font-semibold text-edutrack-dark">{formData.name}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            تم إنشاء حسابك كأستاذ في منصة EduTrack. يمكنك الآن تسجيل الدخول.
          </p>
          <Button
            onClick={() => setCurrentView('login')}
            className="w-full h-12 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 text-base font-semibold"
          >
            <GraduationCap className="h-5 w-5 ml-2" />
            تسجيل الدخول
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-edutrack-light" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-edutrack-dark gradient-text">EduTrack</h1>
              <p className="text-xs text-muted-foreground">تسجيل أستاذ جديد</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('login')}
            className="text-sm text-orange-600 hover:underline flex items-center gap-1"
          >
            تسجيل الدخول
            <ArrowLeft className="h-3 w-3" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {stepConfig.map((s, idx) => (
              <div key={s.number} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor: step >= s.number ? '#f97316' : '#E5E7EB',
                    color: step >= s.number ? '#FFFFFF' : '#9CA3AF',
                  }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium"
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </motion.div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step >= s.number ? 'text-orange-600' : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
                {idx < stepConfig.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                      step > s.number ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5 bg-gray-200 [&>div]:bg-orange-500" />
        </div>

        {/* Error */}
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

        {/* Step Content */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ═══ Step 1: Personal Info ═══ */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">المعلومات الشخصية</h3>
                      <p className="text-sm text-muted-foreground">أدخل بياناتك الشخصية</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">
                        الاسم الكامل <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="مثال: محمد بن أحمد"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.name ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'
                          }`}
                        />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">
                        البريد الإلكتروني <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.email ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'
                          }`}
                          dir="ltr"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">
                        كلمة المرور <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="6 أحرف على الأقل"
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${
                            errors.password ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'
                          }`}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">
                        تأكيد كلمة المرور <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="أعد إدخال كلمة المرور"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${
                            errors.confirmPassword
                              ? 'border-red-400'
                              : 'border-gray-200 focus:border-orange-500'
                          }`}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-orange-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="0555123456"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className="pr-10 h-11 bg-white border-gray-200 focus:border-orange-500 rounded-lg"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 2: Select Institution ═══ */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">اختيار المؤسسة</h3>
                      <p className="text-sm text-muted-foreground">ابحث عن المؤسسة التي تعمل فيها</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Searchable Institution Dropdown */}
                    <div className="space-y-2" ref={dropdownRef}>
                      <Label className="text-sm font-medium text-edutrack-dark">
                        المؤسسة التعليمية <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث عن المؤسسة..."
                          value={formData.institutionId ? formData.institutionName : institutionSearch}
                          onChange={(e) => {
                            setInstitutionSearch(e.target.value);
                            updateField('institutionId', '');
                            updateField('institutionName', '');
                            updateField('level', '');
                            updateField('subjectId', '');
                            updateField('subjectName', '');
                            setShowInstitutionDropdown(true);
                          }}
                          onFocus={() => {
                            if (!formData.institutionId) setShowInstitutionDropdown(true);
                          }}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${
                            errors.institutionId ? 'border-red-400' : 'border-gray-200 focus:border-orange-500'
                          }`}
                        />
                        {formData.institutionId ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateField('institutionId', '');
                              updateField('institutionName', '');
                              updateField('level', '');
                              updateField('subjectId', '');
                              updateField('subjectName', '');
                              setInstitutionSearch('');
                              setSubjects([]);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        )}

                        {/* Dropdown */}
                        {showInstitutionDropdown && !formData.institutionId && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-12 right-0 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                          >
                            {loadingInstitutions ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-orange-500" />
                                جاري البحث...
                              </div>
                            ) : institutions.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                {institutionSearch ? 'لا توجد نتائج' : 'ابحث عن المؤسسة بالاسم'}
                              </div>
                            ) : (
                              institutions.map((inst) => (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onClick={() => {
                                    updateField('institutionId', inst.id);
                                    updateField('institutionName', inst.name);
                                    updateField('level', '');
                                    updateField('subjectId', '');
                                    updateField('subjectName', '');
                                    setInstitutionSearch('');
                                    setShowInstitutionDropdown(false);
                                  }}
                                  className="w-full text-right px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                      <Building2 className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-edutrack-dark truncate">
                                        {inst.name}
                                      </p>
                                      {(inst.city || inst.address) && (
                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {inst.city || inst.address}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </div>
                      {errors.institutionId && (
                        <p className="text-xs text-red-500">{errors.institutionId}</p>
                      )}
                    </div>

                    {/* Selected Institution Preview */}
                    {formData.institutionId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-orange-50 border border-orange-200 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-edutrack-dark">{formData.institutionName}</p>
                            <p className="text-xs text-orange-600">تم اختيار المؤسسة ✓</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Info */}
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        ابحث عن المؤسسة التعليمية التي تعمل فيها. يمكنك الكتابة بالاسم أو المدينة
                        للبحث. إذا لم تجد المؤسسة، فقد لا تكون مسجلة في المنصة بعد.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 3: Select Level & Subject ═══ */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">الطور والمادة</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر الطور التعليمي والمادة التي تدرّسها
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Level Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-edutrack-dark">
                        الطور التعليمي <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {levelOptions.map((lvl) => (
                          <motion.button
                            key={lvl.value}
                            type="button"
                            onClick={() => {
                              updateField('level', lvl.value);
                              updateField('subjectId', '');
                              updateField('subjectName', '');
                            }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                              formData.level === lvl.value
                                ? `${lvl.borderColor} ${lvl.bgColor} shadow-md`
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-2">{lvl.icon}</div>
                            <h4
                              className={`font-bold text-sm ${
                                formData.level === lvl.value ? lvl.textColor : 'text-edutrack-dark'
                              }`}
                            >
                              {lvl.label}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{lvl.description}</p>
                            {formData.level === lvl.value && (
                              <motion.div
                                layoutId="levelCheck"
                                className={`absolute top-2 left-2 h-5 w-5 rounded-full ${lvl.checkBg} flex items-center justify-center`}
                              >
                                <Check className="h-3 w-3 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </div>
                      {errors.level && <p className="text-xs text-red-500">{errors.level}</p>}
                    </div>

                    {/* Subject Selection */}
                    {formData.level && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-semibold text-edutrack-dark">
                          المادة الدراسية <span className="text-red-500">*</span>
                        </Label>

                        {loadingSubjects ? (
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-orange-500" />
                            <p className="text-sm text-muted-foreground">جاري تحميل المواد...</p>
                          </div>
                        ) : filteredSubjects.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              لا توجد مواد متاحة لهذا الطور في المؤسسة
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
                            {filteredSubjects.map((subject) => {
                              const isSelected = formData.subjectId === subject.id;
                              return (
                                <motion.button
                                  key={subject.id}
                                  type="button"
                                  onClick={() => {
                                    updateField('subjectId', subject.id);
                                    updateField('subjectName', subject.name);
                                  }}
                                  whileHover={{ y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`relative p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                                    isSelected
                                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <BookOpen
                                    className={`h-5 w-5 mx-auto mb-1.5 ${
                                      isSelected ? 'text-orange-500' : 'text-gray-400'
                                    }`}
                                  />
                                  <p
                                    className={`text-xs font-semibold leading-tight ${
                                      isSelected ? 'text-orange-700' : 'text-edutrack-dark'
                                    }`}
                                  >
                                    {subject.name}
                                  </p>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute top-1.5 left-1.5 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center"
                                    >
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                        {errors.subjectId && <p className="text-xs text-red-500">{errors.subjectId}</p>}
                      </motion.div>
                    )}

                    {/* Specialization (optional) */}
                    {formData.subjectId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="space-y-2"
                      >
                        <Label className="text-sm font-medium text-edutrack-dark">التخصص (اختياري)</Label>
                        <div className="relative">
                          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="مثال: رياضيات متقدمة"
                            value={formData.specialization}
                            onChange={(e) => updateField('specialization', e.target.value)}
                            className="pr-10 h-11 bg-white border-gray-200 focus:border-orange-500 rounded-lg"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          يمكنك إضافة تخصصك الدقيق إن وجد
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 4: Confirmation ═══ */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">تأكيد التسجيل</h3>
                      <p className="text-sm text-muted-foreground">راجع بياناتك قبل التسجيل</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100 space-y-4">
                    {/* Personal Info Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                          <User className="h-4 w-4 text-orange-500" />
                          المعلومات الشخصية
                        </h4>
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          تعديل
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">الاسم:</span>
                          <p className="font-medium text-edutrack-dark">{formData.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">البريد:</span>
                          <p className="font-medium text-edutrack-dark" dir="ltr">
                            {formData.email}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الهاتف:</span>
                          <p className="font-medium text-edutrack-dark" dir="ltr">
                            {formData.phone || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Institution Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-orange-500" />
                          المؤسسة
                        </h4>
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          تعديل
                        </button>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">المؤسسة:</span>
                        <p className="font-medium text-edutrack-dark">{formData.institutionName}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Level & Subject Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-edutrack-dark flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-500" />
                          الطور والمادة
                        </h4>
                        <button
                          type="button"
                          onClick={() => goToStep(3)}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          تعديل
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="px-3 py-1.5 border-orange-300 text-orange-700 bg-orange-50 text-sm"
                        >
                          <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                          {formData.level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="px-3 py-1.5 border-orange-300 text-orange-700 bg-orange-50 text-sm"
                        >
                          <BookOpen className="h-3.5 w-3.5 ml-1.5" />
                          {formData.subjectName}
                        </Badge>
                        {formData.specialization && (
                          <Badge
                            variant="outline"
                            className="px-3 py-1.5 border-amber-300 text-amber-700 bg-amber-50 text-sm"
                          >
                            <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                            {formData.specialization}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="teacherTerms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateField('termsAccepted', checked === true)}
                      className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 mt-0.5"
                    />
                    <div>
                      <Label htmlFor="teacherTerms" className="text-sm text-muted-foreground cursor-pointer">
                        أوافق على{' '}
                        <span className="text-orange-600 font-medium hover:underline">شروط الاستخدام</span>{' '}
                        و{' '}
                        <span className="text-orange-600 font-medium hover:underline">
                          سياسة الخصوصية
                        </span>
                      </Label>
                      {errors.termsAccepted && (
                        <p className="text-xs text-red-500 mt-1">{errors.termsAccepted}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="gap-2 border-gray-200 hover:bg-gray-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </Button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="gap-2 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="gap-2 bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 min-w-[160px]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      تسجيل الأستاذ
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back to login */}
        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            لديك حساب بالفعل؟{' '}
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="text-orange-600 font-semibold hover:underline"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
