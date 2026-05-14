'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Settings,
  Building2,
  Banknote,
  Bell,
  CreditCard,
  Save,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Phone,
  MapPin,
  Mail,
  Globe,
  Clock,
  Calendar,
  User,
  ImagePlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface PricingRow {
  id: string;
  subjectName: string;
  level: string;
  pricePerSession: number;
  subjectId: string;
}

interface InstitutionData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  wilaya: string | null;
  logo: string | null;
  directorName: string | null;
  academicYear: string | null;
  workingDays: string | null;
  sessionDuration: number;
  startTime: string | null;
  endTime: string | null;
  enableSMS: boolean;
  enableEmail: boolean;
  absenceTemplate: string | null;
  invoiceTemplate: string | null;
  reminderTemplate: string | null;
  subscriptionPlan: string;
}

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

const planConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; features: string[]; price: string }> = {
  FREE: {
    label: 'مجاني',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    price: '0',
    features: ['حتى 20 تلميذ', 'أستاذ واحد', 'تقارير أساسية'],
  },
  BASIC: {
    label: 'أساسي',
    color: 'text-edutrack-primary',
    bgColor: 'bg-edutrack-primary/5',
    borderColor: 'border-edutrack-primary/20',
    price: '2,500',
    features: ['حتى 100 تلميذ', '5 أساتذة', 'تقارير متقدمة', 'إشعارات SMS'],
  },
  PREMIUM: {
    label: 'متقدم',
    color: 'text-edutrack-secondary',
    bgColor: 'bg-edutrack-secondary/5',
    borderColor: 'border-edutrack-secondary/20',
    price: '5,000',
    features: ['تلاميذ غير محدودين', 'أساتذة غير محدودين', 'تقارير كاملة', 'إشعارات SMS + بريد إلكتروني', 'دعم أولوي'],
  },
};

const defaultTemplates = {
  absence: 'نعلمكم بأن ابنكم/ابنتكم {student_name} تغيب/تغيبت عن حصة {subject} يوم {date}.',
  invoice: 'فاتورة شهر {month}/{year} لولي أمر التلميذ/ة {student_name} بمبلغ {amount} دج.',
  reminder: 'تذكير: فاتورة التلميذ/ة {student_name} لشهر {month}/{year} لا تزال معلقة.',
};

const WILAYAS = [
  'أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار',
  'البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر',
  'الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة',
  'قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض',
  'إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي',
  'خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت',
  'غرداية','غليزان','المنيعة','عين صالح','عين قزام','تيميمون',
];

export default function SettingsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [activeTab, setActiveTab] = useState('institution');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Institution info
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instWebsite, setInstWebsite] = useState('');
  const [instCity, setInstCity] = useState('');
  const [instWilaya, setInstWilaya] = useState('');
  const [instLogo, setInstLogo] = useState<string | null>(null);
  const [instDirectorName, setInstDirectorName] = useState('');
  const [instAcademicYear, setInstAcademicYear] = useState('2024/2025');
  const [instPlan, setInstPlan] = useState('FREE');

  // Schedule settings
  const [sessionDuration, setSessionDuration] = useState(90);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس']);

  // Notifications
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [absenceTemplate, setAbsenceTemplate] = useState(defaultTemplates.absence);
  const [invoiceTemplate, setInvoiceTemplate] = useState(defaultTemplates.invoice);
  const [reminderTemplate, setReminderTemplate] = useState(defaultTemplates.reminder);

  // Pricing
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingRow | null>(null);
  const [priceSubjectId, setPriceSubjectId] = useState('');
  const [priceLevel, setPriceLevel] = useState('');
  const [priceAmount, setPriceAmount] = useState('');

  // Subjects for pricing
  const [subjects, setSubjects] = useState<{ id: string; name: string; level: string }[]>([]);

  const ALL_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?institutionId=${institutionId}`);
      if (res.ok) {
        const data: InstitutionData = await res.json();
        setInstName(data.name || '');
        setInstAddress(data.address || '');
        setInstPhone(data.phone || '');
        setInstEmail(data.email || '');
        setInstWebsite(data.website || '');
        setInstCity(data.city || '');
        setInstWilaya(data.wilaya || '');
        setInstLogo(data.logo || null);
        setInstDirectorName(data.directorName || '');
        setInstAcademicYear(data.academicYear || '2024/2025');
        setInstPlan(data.subscriptionPlan || 'FREE');
        setSessionDuration(data.sessionDuration || 90);
        setStartTime(data.startTime || '08:00');
        setEndTime(data.endTime || '16:00');
        setSmsEnabled(data.enableSMS || false);
        setEmailEnabled(data.enableEmail || false);
        setAbsenceTemplate(data.absenceTemplate || defaultTemplates.absence);
        setInvoiceTemplate(data.invoiceTemplate || defaultTemplates.invoice);
        setReminderTemplate(data.reminderTemplate || defaultTemplates.reminder);
        if (data.workingDays) {
          setSelectedDays(data.workingDays.split(','));
        }
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/pricing?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setPricingRows(data.pricing);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch(`/api/teachers/subjects?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
      }
    } catch {
      // silently ignore
    }
  }, [institutionId]);

  useEffect(() => {
    fetchSettings();
    fetchPricing();
    fetchSubjects();
  }, [fetchSettings, fetchPricing, fetchSubjects]);

  const handleSaveInstitution = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          name: instName,
          address: instAddress,
          phone: instPhone,
          email: instEmail,
          website: instWebsite,
          city: instCity,
          wilaya: instWilaya,
          directorName: instDirectorName,
          academicYear: instAcademicYear,
        }),
      });

      if (res.ok) {
        toast.success('تم حفظ معلومات المؤسسة بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          workingDays: selectedDays.join(','),
          sessionDuration,
          startTime,
          endTime,
        }),
      });

      if (res.ok) {
        toast.success('تم حفظ إعدادات الجدول بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          enableSMS: smsEnabled,
          enableEmail: emailEnabled,
          absenceTemplate,
          invoiceTemplate,
          reminderTemplate,
        }),
      });

      if (res.ok) {
        toast.success('تم حفظ إعدادات الإشعارات بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم. يُسمح بـ PNG, JPG, WebP, SVG فقط');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يتجاوز الحد المسموح (2MB)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('institutionId', institutionId);

      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setInstLogo(data.logoUrl);
        toast.success('تم رفع الشعار بنجاح');
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ أثناء رفع الشعار');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutionId, logo: null }),
      });
      if (res.ok) {
        setInstLogo(null);
        toast.success('تم حذف الشعار');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleSavePricing = async () => {
    if (!priceSubjectId || !priceLevel || !priceAmount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setSaving(true);
    try {
      const body = {
        institutionId,
        subjectId: priceSubjectId,
        level: priceLevel,
        pricePerSession: parseFloat(priceAmount),
      };

      if (editingPricing) {
        const res = await fetch(`/api/settings/pricing/${editingPricing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) toast.success('تم تعديل السعر بنجاح');
      } else {
        const res = await fetch('/api/settings/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) toast.success('تم إضافة السعر بنجاح');
      }

      setPricingDialogOpen(false);
      setEditingPricing(null);
      setPriceSubjectId('');
      setPriceLevel('');
      setPriceAmount('');
      fetchPricing();
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePricing = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/pricing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف السعر بنجاح');
        fetchPricing();
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const openAddPricingDialog = () => {
    setEditingPricing(null);
    setPriceSubjectId('');
    setPriceLevel('');
    setPriceAmount('');
    setPricingDialogOpen(true);
  };

  const openEditPricingDialog = (row: PricingRow) => {
    setEditingPricing(row);
    setPriceSubjectId(row.subjectId);
    setPriceLevel(row.level);
    setPriceAmount(row.pricePerSession.toString());
    setPricingDialogOpen(true);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0"
      dir="rtl"
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-edutrack-primary" />
            </div>
            الإعدادات
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إعدادات وتفضيلات المؤسسة</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-white shadow-sm border border-gray-100 h-12 p-1 rounded-xl inline-flex w-auto min-w-full">
              <TabsTrigger value="institution" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap">
                <Building2 className="h-4 w-4 ml-1.5" />
                المؤسسة
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap">
                <Clock className="h-4 w-4 ml-1.5" />
                الجدول
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap">
                <Bell className="h-4 w-4 ml-1.5" />
                الإشعارات
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap">
                <Banknote className="h-4 w-4 ml-1.5" />
                الأسعار
              </TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap">
                <CreditCard className="h-4 w-4 ml-1.5" />
                الاشتراك
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ─── Institution Info Tab ─────────────────────────────────────── */}
          <TabsContent value="institution">
            <AnimatePresence mode="wait">
              <motion.div
                key="institution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Logo Upload Card */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-edutrack-primary" />
                      شعار المؤسسة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div
                        className="h-28 w-28 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-edutrack-primary/40 hover:bg-edutrack-primary/5 transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {instLogo ? (
                          <>
                            <img src={instLogo} alt="شعار المؤسسة" className="h-24 w-24 object-contain rounded-lg" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImagePlus className="h-6 w-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            {uploading ? (
                              <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin mx-auto" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                                <span className="text-[10px] text-gray-500">اضغط للرفع</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs border-edutrack-primary/30 text-edutrack-primary hover:bg-edutrack-primary/5"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 ml-1" />
                            )}
                            {uploading ? 'جاري الرفع...' : 'رفع شعار'}
                          </Button>
                          {instLogo && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs border-red-200 text-red-500 hover:bg-red-50"
                              onClick={handleRemoveLogo}
                            >
                              <X className="h-3.5 w-3.5 ml-1" />
                              حذف
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG بحد أقصى 2MB</p>
                        <p className="text-[11px] text-muted-foreground">يُنصح بصورة مربعة 256×256 بكسل</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Info Card */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-edutrack-primary" />
                      معلومات المؤسسة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">اسم المؤسسة *</Label>
                        <div className="relative">
                          <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="اسم المؤسسة"
                            value={instName}
                            onChange={(e) => setInstName(e.target.value)}
                            className="pr-10 h-11"
                          />
                        </div>
                      </div>

                      {/* Director Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">اسم المدير</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="اسم مدير المؤسسة"
                            value={instDirectorName}
                            onChange={(e) => setInstDirectorName(e.target.value)}
                            className="pr-10 h-11"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">رقم الهاتف</Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="رقم الهاتف"
                            value={instPhone}
                            onChange={(e) => setInstPhone(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="email@example.com"
                            value={instEmail}
                            onChange={(e) => setInstEmail(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">العنوان</Label>
                        <div className="relative">
                          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="عنوان المؤسسة"
                            value={instAddress}
                            onChange={(e) => setInstAddress(e.target.value)}
                            className="pr-10 h-11"
                          />
                        </div>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">المدينة</Label>
                        <Input
                          placeholder="المدينة"
                          value={instCity}
                          onChange={(e) => setInstCity(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      {/* Wilaya */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">الولاية</Label>
                        <Select value={instWilaya} onValueChange={setInstWilaya}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="اختر الولاية" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {WILAYAS.map((w) => (
                              <SelectItem key={w} value={w}>{w}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Website */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">الموقع الإلكتروني</Label>
                        <div className="relative">
                          <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="www.example.com"
                            value={instWebsite}
                            onChange={(e) => setInstWebsite(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Academic Year */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">السنة الدراسية</Label>
                        <div className="relative">
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="2024/2025"
                            value={instAcademicYear}
                            onChange={(e) => setInstAcademicYear(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveInstitution}
                      disabled={saving}
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11 mt-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Save className="h-4 w-4 ml-2" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Schedule Settings Tab ────────────────────────────────────── */}
          <TabsContent value="schedule">
            <AnimatePresence mode="wait">
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Clock className="h-5 w-5 text-edutrack-primary" />
                      إعدادات الجدول الدراسي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Working Days */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">أيام العمل</Label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DAYS.map((day) => {
                          const isSelected = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                                isSelected
                                  ? 'bg-edutrack-primary text-white border-edutrack-primary shadow-md shadow-edutrack-primary/20'
                                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-edutrack-primary/30 hover:bg-edutrack-primary/5'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Time Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">وقت بداية الدوام</Label>
                        <div className="relative">
                          <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="pr-10 h-11 font-inter"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">وقت نهاية الدوام</Label>
                        <div className="relative">
                          <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="pr-10 h-11 font-inter"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">مدة الحصة (دقيقة)</Label>
                        <Select value={String(sessionDuration)} onValueChange={(v) => setSessionDuration(Number(v))}>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="45">45 دقيقة</SelectItem>
                            <SelectItem value="60">60 دقيقة</SelectItem>
                            <SelectItem value="90">90 دقيقة</SelectItem>
                            <SelectItem value="120">120 دقيقة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Preview */}
                    <div className="rounded-xl bg-edutrack-primary/5 border border-edutrack-primary/10 p-4">
                      <p className="text-sm font-medium text-edutrack-dark mb-2">معاينة الجدول</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>📅 أيام العمل: <strong className="text-edutrack-dark">{selectedDays.length}</strong> يوم</span>
                        <span>⏰ الدوام: <strong className="text-edutrack-dark font-inter">{startTime} - {endTime}</strong></span>
                        <span>📖 مدة الحصة: <strong className="text-edutrack-dark">{sessionDuration} دقيقة</strong></span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveSchedule}
                      disabled={saving}
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Save className="h-4 w-4 ml-2" />
                      )}
                      حفظ إعدادات الجدول
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Notifications Tab ────────────────────────────────────────── */}
          <TabsContent value="notifications">
            <AnimatePresence mode="wait">
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-edutrack-dark">إشعارات SMS</h3>
                            <p className="text-xs text-muted-foreground">إرسال SMS لأولياء الأمور</p>
                          </div>
                        </div>
                        <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-edutrack-dark">إشعارات البريد</h3>
                            <p className="text-xs text-muted-foreground">إرسال بريد إلكتروني</p>
                          </div>
                        </div>
                        <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Message Templates */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-edutrack-primary" />
                      قوالب الرسائل
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      استخدم {'{student_name}'}, {'{subject}'}, {'{date}'}, {'{month}'}, {'{year}'}, {'{amount}'} كمتغيرات
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">قالب رسالة الغياب</Label>
                      <textarea
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-edutrack-primary/20 focus:border-edutrack-primary"
                        value={absenceTemplate}
                        onChange={(e) => setAbsenceTemplate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">قالب رسالة الفاتورة</Label>
                      <textarea
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-edutrack-primary/20 focus:border-edutrack-primary"
                        value={invoiceTemplate}
                        onChange={(e) => setInvoiceTemplate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">قالب رسالة التذكير</Label>
                      <textarea
                        className="w-full min-h-[80px] p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-edutrack-primary/20 focus:border-edutrack-primary"
                        value={reminderTemplate}
                        onChange={(e) => setReminderTemplate(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleSaveNotifications}
                      disabled={saving}
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                      حفظ الإعدادات
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Pricing Tab ─────────────────────────────────────────────── */}
          <TabsContent value="pricing">
            <AnimatePresence mode="wait">
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-edutrack-primary" />
                        جدول الأسعار
                      </CardTitle>
                      <Button
                        onClick={openAddPricingDialog}
                        size="sm"
                        className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-9"
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        إضافة سعر
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                            <TableHead className="text-right font-semibold text-edutrack-dark">المادة</TableHead>
                            <TableHead className="text-center font-semibold text-edutrack-dark">المستوى</TableHead>
                            <TableHead className="text-right font-semibold text-edutrack-dark">سعر الحصة</TableHead>
                            <TableHead className="text-center font-semibold text-edutrack-dark">إجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pricingRows.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                  <Banknote className="h-12 w-12 text-gray-300" />
                                  <p className="text-muted-foreground">لا توجد أسعار محددة</p>
                                  <p className="text-xs text-muted-foreground">أضف أسعار الحصص للمواد المختلفة</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            pricingRows.map((row) => (
                              <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-medium text-sm">{row.subjectName}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="text-xs bg-edutrack-primary/5 text-edutrack-primary border-edutrack-primary/10">
                                    {row.level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-inter font-semibold text-sm text-edutrack-dark">
                                  {row.pricePerSession.toLocaleString('ar-DZ')} دج
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-edutrack-primary hover:bg-edutrack-primary/5" onClick={() => openEditPricingDialog(row)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDeletePricing(row.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* ─── Subscription Tab ──────────────────────────────────────────── */}
          <TabsContent value="subscription">
            <AnimatePresence mode="wait">
              <motion.div
                key="subscription"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Current Plan */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-l from-edutrack-primary to-edutrack-secondary" />
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
                          <CreditCard className="h-7 w-7 text-edutrack-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الخطة الحالية</p>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-edutrack-dark">
                              {planConfig[instPlan]?.label || instPlan}
                            </h2>
                            <Badge variant="outline" className={`${planConfig[instPlan]?.bgColor} ${planConfig[instPlan]?.color} ${planConfig[instPlan]?.borderColor} border text-xs`}>
                              نشط
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-3xl font-bold text-edutrack-primary font-inter">
                          {planConfig[instPlan]?.price}
                        </p>
                        <p className="text-xs text-muted-foreground">دج / شهرياً</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(planConfig).map(([key, plan]) => {
                    const isCurrent = key === instPlan;
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Card className={`border-0 shadow-md shadow-gray-100/80 bg-white overflow-hidden ${isCurrent ? 'ring-2 ring-edutrack-primary' : ''}`}>
                          <div className={`h-1.5 ${key === 'FREE' ? 'bg-gray-300' : key === 'BASIC' ? 'bg-edutrack-primary' : 'bg-gradient-to-l from-edutrack-primary to-edutrack-secondary'}`} />
                          <CardContent className="p-6">
                            <div className="text-center space-y-4">
                              <div>
                                <h3 className="text-lg font-bold text-edutrack-dark">{plan.label}</h3>
                                <p className="text-3xl font-bold text-edutrack-primary font-inter mt-2">{plan.price}</p>
                                <p className="text-xs text-muted-foreground">دج / شهرياً</p>
                              </div>
                              <div className="space-y-2">
                                {plan.features.map((feature) => (
                                  <div key={feature} className="flex items-center gap-2 text-sm text-right">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-edutrack-dark">{feature}</span>
                                  </div>
                                ))}
                              </div>
                              <Button
                                className={`w-full h-10 ${isCurrent ? 'bg-gray-100 text-gray-500 cursor-default' : 'bg-edutrack-primary hover:bg-edutrack-primary/90 text-white'}`}
                                disabled={isCurrent}
                                onClick={() => {
                                  toast.info(`سيتم الترقية إلى الخطة ${plan.label}`);
                                }}
                              >
                                {isCurrent ? 'الخطة الحالية' : (
                                  <>
                                    <Sparkles className="h-4 w-4 ml-2" />
                                    ترقية
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Add/Edit Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <Banknote className="h-5 w-5 text-edutrack-primary" />
              {editingPricing ? 'تعديل السعر' : 'إضافة سعر جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">المادة *</Label>
              <Select value={priceSubjectId} onValueChange={setPriceSubjectId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.level})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">المستوى *</Label>
              <Select value={priceLevel} onValueChange={setPriceLevel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="اختر المستوى" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ابتدائي">ابتدائي</SelectItem>
                  <SelectItem value="متوسط">متوسط</SelectItem>
                  <SelectItem value="ثانوي">ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">سعر الحصة (دج) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                className="h-11 font-inter"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setPricingDialogOpen(false)} className="h-10">
              إلغاء
            </Button>
            <Button
              onClick={handleSavePricing}
              disabled={saving || !priceSubjectId || !priceLevel || !priceAmount}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPricing ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
