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
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  Search,
  ChevronDown,
  Users,
  X,
  MapPin,
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

interface Section {
  id: string;
  name: string;
  year: { id: string; name: string; level: string };
  students: { id: string; name: string }[];
  studentCount: number;
}

interface SelectedChild {
  sectionId: string;
  studentId: string;
  studentName: string;
  sectionName: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  childrenCount: number;
  institutionId: string;
  institutionName: string;
  children: SelectedChild[];
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const TOTAL_STEPS = 4;

const stepConfig = [
  { number: 1, title: 'المعلومات الشخصية', icon: <User className="h-5 w-5" /> },
  { number: 2, title: 'اختيار المؤسسة', icon: <Building2 className="h-5 w-5" /> },
  { number: 3, title: 'اختيار الأبناء', icon: <Users className="h-5 w-5" /> },
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

export default function ParentRegisterPage() {
  const { setCurrentView, setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [direction, setDirection] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    childrenCount: 1,
    institutionId: '',
    institutionName: '',
    children: [],
    termsAccepted: false,
  });

  // Institution search state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sections state
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

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
    return () => { cancelled = true; clearTimeout(debounce); };
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

  // ─── Fetch Sections when institution selected ──────────
  useEffect(() => {
    if (!formData.institutionId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    async function fetchSections() {
      setLoadingSections(true);
      try {
        const res = await fetch(`/api/sections?institutionId=${formData.institutionId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setSections(data.sections || []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoadingSections(false);
      }
    }
    fetchSections();
    return () => { cancelled = true; };
  }, [formData.institutionId]);

  // ─── Update form field ─────────────────────────────────
  const updateField = (field: keyof FormData, value: string | number | boolean | SelectedChild[]) => {
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
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'بريد إلكتروني غير صالح';
      if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
      else if (formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
      if (formData.childrenCount < 1) newErrors.childrenCount = 'يجب اختيار ابن واحد على الأقل';
    }

    if (stepNum === 2) {
      if (!formData.institutionId) newErrors.institutionId = 'يجب اختيار المؤسسة';
    }

    if (stepNum === 3) {
      if (formData.children.length === 0) newErrors.children = 'يجب اختيار ابن واحد على الأقل';
      if (formData.children.length !== formData.childrenCount) {
        newErrors.children = `يجب اختيار ${formData.childrenCount} أبناء، تم اختيار ${formData.children.length} فقط`;
      }
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

  // ─── Toggle student selection ──────────────────────────
  const toggleStudent = (sectionId: string, sectionName: string, studentId: string, studentName: string) => {
    setFormData((prev) => {
      const exists = prev.children.find((c) => c.studentId === studentId);
      if (exists) {
        return { ...prev, children: prev.children.filter((c) => c.studentId !== studentId) };
      }
      if (prev.children.length >= prev.childrenCount) {
        return prev; // can't add more
      }
      return {
        ...prev,
        children: [...prev.children, { sectionId, studentId, studentName, sectionName }],
      };
    });
    if (errors.children) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.children;
        return next;
      });
    }
  };

  const removeChild = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((c) => c.studentId !== studentId),
    }));
  };

  // ─── Submit ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          institutionId: formData.institutionId,
          children: formData.children.map((c) => ({ studentId: c.studentId })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء التسجيل');
        return;
      }

      setUser(data);
      setCurrentView('parent-dashboard');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / TOTAL_STEPS) * 100;

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
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-edutrack-dark gradient-text">EduTrack</h1>
              <p className="text-xs text-muted-foreground">تسجيل ولي أمر</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('login')}
            className="text-sm text-edutrack-primary hover:underline flex items-center gap-1"
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
                    backgroundColor: step >= s.number ? '#10b981' : '#E5E7EB',
                    color: step >= s.number ? '#FFFFFF' : '#9CA3AF',
                  }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium"
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </motion.div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.number ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s.title}
                </span>
                {idx < stepConfig.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-1 rounded-full transition-colors duration-300 ${step > s.number ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5 bg-gray-200 [&>div]:bg-emerald-500" />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>

              {/* ═══ Step 1: Personal Info ═══ */}
              {step === 1 && (
                <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">المعلومات الشخصية</h3>
                      <p className="text-sm text-muted-foreground">أدخل بياناتك الشخصية</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">الاسم الكامل <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="مثال: أحمد بن علي" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className={`pr-10 h-11 bg-white rounded-lg ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`} />
                      </div>
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">البريد الإلكتروني <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="email" placeholder="example@email.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className={`pr-10 h-11 bg-white rounded-lg ${errors.email ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`} dir="ltr" />
                      </div>
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">كلمة المرور <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showPassword ? 'text' : 'password'} placeholder="6 أحرف على الأقل" value={formData.password} onChange={(e) => updateField('password', e.target.value)} className={`pr-10 pl-10 h-11 bg-white rounded-lg ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`} dir="ltr" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-primary">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="أعد إدخال كلمة المرور" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} className={`pr-10 pl-10 h-11 bg-white rounded-lg ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`} dir="ltr" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-primary">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" placeholder="0555123456" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="pr-10 h-11 bg-white border-gray-200 focus:border-emerald-500 rounded-lg" dir="ltr" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-edutrack-dark">عدد الأبناء <span className="text-red-500">*</span></Label>
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={() => updateField('childrenCount', Math.max(1, formData.childrenCount - 1))} disabled={formData.childrenCount <= 1}>
                          -
                        </Button>
                        <span className="text-2xl font-bold text-edutrack-dark min-w-[2rem] text-center">{formData.childrenCount}</span>
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={() => updateField('childrenCount', Math.min(10, formData.childrenCount + 1))} disabled={formData.childrenCount >= 10}>
                          +
                        </Button>
                        <span className="text-sm text-muted-foreground mr-2">ابن/أبناء</span>
                      </div>
                      {errors.childrenCount && <p className="text-xs text-red-500">{errors.childrenCount}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 2: Select Institution ═══ */}
              {step === 2 && (
                <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">اختيار المؤسسة</h3>
                      <p className="text-sm text-muted-foreground">ابحث عن المؤسسة التي ينتمي إليها ابنك</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Searchable Institution Dropdown */}
                    <div className="space-y-2" ref={dropdownRef}>
                      <Label className="text-sm font-medium text-edutrack-dark">المؤسسة التعليمية <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="ابحث عن المؤسسة..."
                          value={formData.institutionId ? formData.institutionName : institutionSearch}
                          onChange={(e) => {
                            setInstitutionSearch(e.target.value);
                            updateField('institutionId', '');
                            updateField('institutionName', '');
                            setShowInstitutionDropdown(true);
                          }}
                          onFocus={() => {
                            if (!formData.institutionId) setShowInstitutionDropdown(true);
                          }}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${errors.institutionId ? 'border-red-400' : 'border-gray-200 focus:border-emerald-500'}`}
                        />
                        {formData.institutionId ? (
                          <button type="button" onClick={() => { updateField('institutionId', ''); updateField('institutionName', ''); setInstitutionSearch(''); setSections([]); setFormData((prev) => ({ ...prev, children: [] })); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors">
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
                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-500" />
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
                                    setInstitutionSearch('');
                                    setShowInstitutionDropdown(false);
                                    setFormData((prev) => ({ ...prev, children: [] }));
                                  }}
                                  className="w-full text-right px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                      <Building2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-edutrack-dark truncate">{inst.name}</p>
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
                      {errors.institutionId && <p className="text-xs text-red-500">{errors.institutionId}</p>}
                    </div>

                    {/* Selected Institution Preview */}
                    {formData.institutionId && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-edutrack-dark">{formData.institutionName}</p>
                            <p className="text-xs text-emerald-600">تم اختيار المؤسسة ✓</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Info */}
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        ابحث عن المؤسسة التعليمية التي يدرس فيها ابنك. يمكنك الكتابة بالاسم أو المدينة للبحث. إذا لم تجد المؤسسة، فقد لا تكون مسجلة في المنصة بعد.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Step 3: Select Children ═══ */}
              {step === 3 && (
                <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">اختيار الأبناء</h3>
                      <p className="text-sm text-muted-foreground">
                        اختر {formData.childrenCount} أبناء من الأقسام المتاحة
                      </p>
                    </div>
                  </div>

                  {/* Selected children badges */}
                  {formData.children.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {formData.children.map((child) => (
                        <Badge key={child.studentId} variant="outline" className="px-3 py-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 text-sm">
                          <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                          {child.studentName}
                          <span className="text-emerald-500 text-xs mr-1">({child.sectionName})</span>
                          <button type="button" onClick={() => removeChild(child.studentId)} className="mr-1.5 text-emerald-400 hover:text-red-500 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Badge variant="outline" className="px-3 py-1.5 border-gray-200 text-muted-foreground bg-gray-50 text-sm">
                        {formData.children.length}/{formData.childrenCount} مختار
                      </Badge>
                    </div>
                  )}

                  {errors.children && <p className="text-xs text-red-500 mb-4">{errors.children}</p>}

                  {/* Sections with students */}
                  {loadingSections ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-500" />
                      <p className="text-sm text-muted-foreground">جاري تحميل الأقسام...</p>
                    </div>
                  ) : sections.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">لا توجد أقسام في هذه المؤسسة</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {sections.map((section) => {
                        const isExpanded = expandedSections[section.id];
                        const selectedInSection = formData.children.filter((c) => c.sectionId === section.id);

                        return (
                          <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedSections((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                                  <GraduationCap className="h-4 w-4 text-edutrack-primary" />
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-edutrack-dark">{section.name}</p>
                                  <p className="text-xs text-muted-foreground">{section.year.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedInSection.length > 0 && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                    {selectedInSection.length} مختار
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs border-gray-200 text-muted-foreground">
                                  {section.students.length} تلميذ
                                </Badge>
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-1.5">
                                    {section.students.length === 0 ? (
                                      <p className="text-center text-sm text-muted-foreground py-3">لا يوجد تلاميذ في هذا القسم</p>
                                    ) : (
                                      section.students.map((student) => {
                                        const isSelected = formData.children.some((c) => c.studentId === student.id);
                                        const canSelect = formData.children.length < formData.childrenCount;

                                        return (
                                          <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleStudent(section.id, `${section.name} - ${section.year.name}`, student.id, student.name)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                              isSelected
                                                ? 'bg-emerald-100 border-2 border-emerald-400'
                                                : canSelect
                                                  ? 'bg-white border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                                                  : 'bg-white border-2 border-gray-200 opacity-50 cursor-not-allowed'
                                            }`}
                                            disabled={!isSelected && !canSelect}
                                          >
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                              isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                              {isSelected ? <Check className="h-4 w-4" /> : student.name.charAt(0)}
                                            </div>
                                            <span className={`text-sm font-medium ${isSelected ? 'text-emerald-700' : 'text-edutrack-dark'}`}>
                                              {student.name}
                                            </span>
                                            {isSelected && (
                                              <Check className="h-4 w-4 text-emerald-500 mr-auto" />
                                            )}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ═══ Step 4: Confirmation ═══ */}
              {step === 4 && (
                <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">تأكيد التسجيل</h3>
                      <p className="text-sm text-muted-foreground">راجع بياناتك قبل التسجيل</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الاسم:</span>
                        <p className="font-medium text-edutrack-dark">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">البريد:</span>
                        <p className="font-medium text-edutrack-dark" dir="ltr">{formData.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف:</span>
                        <p className="font-medium text-edutrack-dark" dir="ltr">{formData.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المؤسسة:</span>
                        <p className="font-medium text-edutrack-dark">{formData.institutionName}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <span className="text-sm text-muted-foreground">الأبناء ({formData.children.length}):</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.children.map((child) => (
                          <Badge key={child.studentId} variant="outline" className="px-3 py-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 text-sm">
                            <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                            {child.studentName}
                            <span className="text-emerald-500 text-xs mr-1">({child.sectionName})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="parentTerms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateField('termsAccepted', checked === true)}
                      className="border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 mt-0.5"
                    />
                    <div>
                      <Label htmlFor="parentTerms" className="text-sm text-muted-foreground cursor-pointer">
                        أوافق على <span className="text-emerald-600 font-medium hover:underline">شروط الاستخدام</span> و{' '}
                        <span className="text-emerald-600 font-medium hover:underline">سياسة الخصوصية</span>
                      </Label>
                      {errors.termsAccepted && <p className="text-xs text-red-500 mt-1">{errors.termsAccepted}</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={goBack} className="gap-2 border-gray-200 hover:bg-gray-50">
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </Button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <Button type="button" onClick={goNext} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" disabled={loading} onClick={handleSubmit} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 min-w-[160px]">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-4 w-4" />إنشاء الحساب</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <button type="button" onClick={() => setCurrentView('register')} className="text-edutrack-primary font-medium hover:underline flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            تسجيل كمدير مؤسسة
          </button>
          <span className="text-gray-300">|</span>
          <button type="button" onClick={() => setCurrentView('login')} className="text-muted-foreground hover:text-edutrack-primary">
            لديك حساب؟ سجّل الدخول
          </button>
        </div>
      </motion.div>
    </div>
  );
}
