'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  User,
  CreditCard,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Star,
  Crown,
  Zap,
} from 'lucide-react';

type PlanType = 'FREE' | 'BASIC' | 'PREMIUM';

interface FormData {
  institutionName: string;
  address: string;
  phone: string;
  directorName: string;
  email: string;
  password: string;
  confirmPassword: string;
  plan: PlanType;
  termsAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const plans: {
  type: PlanType;
  name: string;
  price: string;
  period: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}[] = [
  {
    type: 'FREE',
    name: 'مجاني',
    price: '0',
    period: 'داين',
    features: ['حتى 50 تلميذ', 'مدير واحد', 'تقارير أساسية', 'إشعارات محدودة'],
    icon: <Zap className="h-6 w-6" />,
    color: 'border-gray-200 hover:border-gray-300',
  },
  {
    type: 'BASIC',
    name: 'أساسي',
    price: '2,500',
    period: 'دج/شهر',
    features: ['حتى 200 تلميذ', '3 مدراء', 'تقارير متقدمة', 'إشعارات غير محدودة', 'دعم بالبريد'],
    icon: <Star className="h-6 w-6" />,
    color: 'border-edutrack-primary/50 hover:border-edutrack-primary',
    popular: true,
  },
  {
    type: 'PREMIUM',
    name: 'متميز',
    price: '5,000',
    period: 'دج/شهر',
    features: ['تلاميذ غير محدودين', 'مدراء غير محدودين', 'تقارير كاملة', 'إشعارات ذكية', 'دعم 24/7', 'API متكامل'],
    icon: <Crown className="h-6 w-6" />,
    color: 'border-edutrack-secondary/50 hover:border-edutrack-secondary',
  },
];

const stepConfig = [
  { number: 1, title: 'معلومات المؤسسة', icon: <Building2 className="h-5 w-5" /> },
  { number: 2, title: 'بيانات المدير', icon: <User className="h-5 w-5" /> },
  { number: 3, title: 'تأكيد واختيار الخطة', icon: <CreditCard className="h-5 w-5" /> },
];

export default function RegisterPage() {
  const { setCurrentView, setUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    institutionName: '',
    address: '',
    phone: '',
    directorName: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'FREE',
    termsAccepted: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean | PlanType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: FormErrors = {};

    if (stepNum === 1) {
      if (!formData.institutionName.trim()) newErrors.institutionName = 'اسم المؤسسة مطلوب';
      if (!formData.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    }

    if (stepNum === 2) {
      if (!formData.directorName.trim()) newErrors.directorName = 'الاسم الكامل مطلوب';
      if (!formData.email.trim()) newErrors.email = 'البريد الإلكتروني مطلوب';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'بريد إلكتروني غير صالح';
      if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
      else if (formData.password.length < 6) newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }

    if (stepNum === 3) {
      if (!formData.termsAccepted) newErrors.termsAccepted = 'يجب الموافقة على الشروط';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionName: formData.institutionName,
          address: formData.address,
          phone: formData.phone,
          directorName: formData.directorName,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء التسجيل');
        return;
      }

      setUser(data);
      setCurrentView('director-dashboard');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / 3) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goNext = () => {
    setDirection(1);
    handleNext();
  };

  const goBack = () => {
    setDirection(-1);
    handleBack();
  };

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
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary flex items-center justify-center shadow-lg shadow-edutrack-primary/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-edutrack-dark gradient-text">EduTrack</h1>
              <p className="text-xs text-muted-foreground">إنشاء حساب جديد</p>
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

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {stepConfig.map((s) => (
              <div key={s.number} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor: step >= s.number ? '#1A56DB' : '#E5E7EB',
                    color: step >= s.number ? '#FFFFFF' : '#9CA3AF',
                  }}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium"
                >
                  {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                </motion.div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step >= s.number ? 'text-edutrack-primary' : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
                {s.number < 3 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                      step > s.number ? 'bg-edutrack-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5 bg-gray-200 [&>div]:bg-edutrack-primary" />
        </div>

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

        {/* Step Content */}
        <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Institution Info */}
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
                    <div className="h-10 w-10 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-edutrack-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">معلومات المؤسسة</h3>
                      <p className="text-sm text-muted-foreground">أدخل بيانات مؤسستك التعليمية</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="institutionName" className="text-sm font-medium text-edutrack-dark">
                        اسم المؤسسة <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="institutionName"
                          placeholder="مثال: معهد النجاح التعليمي"
                          value={formData.institutionName}
                          onChange={(e) => updateField('institutionName', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.institutionName ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                        />
                      </div>
                      {errors.institutionName && (
                        <p className="text-xs text-red-500">{errors.institutionName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-edutrack-dark">
                        العنوان
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          placeholder="مثال: شارع الاستقلال، الجزائر"
                          value={formData.address}
                          onChange={(e) => updateField('address', e.target.value)}
                          className="pr-10 h-11 bg-white border-gray-200 focus:border-edutrack-primary rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPhone" className="text-sm font-medium text-edutrack-dark">
                        رقم الهاتف <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="regPhone"
                          type="tel"
                          placeholder="0555123456"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.phone ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                          dir="ltr"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-red-500">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Director Info */}
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
                    <div className="h-10 w-10 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-edutrack-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">بيانات المدير</h3>
                      <p className="text-sm text-muted-foreground">أدخل معلومات حساب المدير</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="directorName" className="text-sm font-medium text-edutrack-dark">
                        الاسم الكامل <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="directorName"
                          placeholder="مثال: أحمد بن علي"
                          value={formData.directorName}
                          onChange={(e) => updateField('directorName', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.directorName ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                        />
                      </div>
                      {errors.directorName && (
                        <p className="text-xs text-red-500">{errors.directorName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regEmail" className="text-sm font-medium text-edutrack-dark">
                        البريد الإلكتروني <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="regEmail"
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className={`pr-10 h-11 bg-white rounded-lg ${
                            errors.email ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                          dir="ltr"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword" className="text-sm font-medium text-edutrack-dark">
                        كلمة المرور <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="regPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="6 أحرف على الأقل"
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${
                            errors.password ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-primary"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-edutrack-dark">
                        تأكيد كلمة المرور <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="أعد إدخال كلمة المرور"
                          value={formData.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                          className={`pr-10 pl-10 h-11 bg-white rounded-lg ${
                            errors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-edutrack-primary'
                          }`}
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-primary"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation & Plan */}
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
                    <div className="h-10 w-10 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-edutrack-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-edutrack-dark">تأكيد واختيار الخطة</h3>
                      <p className="text-sm text-muted-foreground">راجع بياناتك واختر الخطة المناسبة</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-edutrack-light rounded-xl p-4 mb-6 border border-gray-100">
                    <h4 className="text-sm font-semibold text-edutrack-dark mb-3">ملخص البيانات</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">المؤسسة:</span>
                        <p className="font-medium text-edutrack-dark">{formData.institutionName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف:</span>
                        <p className="font-medium text-edutrack-dark" dir="ltr">{formData.phone || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">المدير:</span>
                        <p className="font-medium text-edutrack-dark">{formData.directorName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">البريد:</span>
                        <p className="font-medium text-edutrack-dark" dir="ltr">{formData.email || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div className="mb-6">
                    <Label className="text-sm font-semibold text-edutrack-dark mb-3 block">اختر الخطة</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {plans.map((plan) => (
                        <motion.button
                          key={plan.type}
                          type="button"
                          onClick={() => updateField('plan', plan.type)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative p-4 rounded-xl border-2 text-right transition-all duration-300 ${
                            formData.plan === plan.type
                              ? plan.type === 'PREMIUM'
                                ? 'border-edutrack-secondary bg-edutrack-secondary/5 shadow-md'
                                : 'border-edutrack-primary bg-edutrack-primary/5 shadow-md'
                              : `bg-white ${plan.color}`
                          }`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-edutrack-primary text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                              الأكثر شعبية
                            </div>
                          )}
                          <div
                            className={`mb-2 ${
                              formData.plan === plan.type
                                ? plan.type === 'PREMIUM'
                                  ? 'text-edutrack-secondary'
                                  : 'text-edutrack-primary'
                                : 'text-gray-400'
                            }`}
                          >
                            {plan.icon}
                          </div>
                          <h4 className="font-bold text-edutrack-dark text-sm">{plan.name}</h4>
                          <div className="mt-1 mb-3">
                            <span className="text-xl font-bold text-edutrack-dark">{plan.price}</span>
                            <span className="text-xs text-muted-foreground mr-1">{plan.period}</span>
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="h-3 w-3 text-edutrack-success flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          {formData.plan === plan.type && (
                            <motion.div
                              layoutId="planCheck"
                              className="absolute top-3 left-3 h-5 w-5 rounded-full bg-edutrack-primary flex items-center justify-center"
                            >
                              <Check className="h-3 w-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateField('termsAccepted', checked === true)}
                      className="border-gray-300 data-[state=checked]:bg-edutrack-primary data-[state=checked]:border-edutrack-primary mt-0.5"
                    />
                    <div>
                      <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        أوافق على{' '}
                        <span className="text-edutrack-primary font-medium hover:underline">شروط الاستخدام</span>
                        {' '}و{' '}
                        <span className="text-edutrack-primary font-medium hover:underline">سياسة الخصوصية</span>
                      </Label>
                      {errors.termsAccepted && (
                        <p className="text-xs text-red-500 mt-1">{errors.termsAccepted}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
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

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="gap-2 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/25"
                >
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="gap-2 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white shadow-lg shadow-edutrack-primary/25 min-w-[140px]"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      إنشاء الحساب
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
              className="text-edutrack-primary font-semibold hover:underline"
            >
              تسجيل الدخول
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
