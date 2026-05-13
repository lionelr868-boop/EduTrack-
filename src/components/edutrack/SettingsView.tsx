'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface PricingRow {
  id: string;
  subjectName: string;
  level: string;
  pricePerSession: number;
  subjectId: string;
}

interface InstitutionSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
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

export default function SettingsView() {
  const user = useAppStore((s) => s.user);
  const institutionId = user?.institutionId || '';

  const [activeTab, setActiveTab] = useState('institution');
  const [saving, setSaving] = useState(false);

  // Institution info
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instLogo, setInstLogo] = useState<string | null>(null);
  const [instPlan, setInstPlan] = useState('FREE');

  // Pricing
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([]);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingRow | null>(null);
  const [priceSubjectId, setPriceSubjectId] = useState('');
  const [priceLevel, setPriceLevel] = useState('');
  const [priceAmount, setPriceAmount] = useState('');

  // Subjects for pricing
  const [subjects, setSubjects] = useState<{ id: string; name: string; level: string }[]>([]);

  // Notifications
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [absenceTemplate, setAbsenceTemplate] = useState(defaultTemplates.absence);
  const [invoiceTemplate, setInvoiceTemplate] = useState(defaultTemplates.invoice);
  const [reminderTemplate, setReminderTemplate] = useState(defaultTemplates.reminder);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?institutionId=${institutionId}`);
      if (res.ok) {
        const data = await res.json();
        setInstName(data.name || '');
        setInstAddress(data.address || '');
        setInstPhone(data.phone || '');
        setInstLogo(data.logo || null);
        setInstPlan(data.subscriptionPlan || 'FREE');
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

  const handleSavePricing = async () => {
    if (!priceSubjectId || !priceLevel || !priceAmount) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setSaving(true);
    try {
      const subject = subjects.find((s) => s.id === priceSubjectId);
      const body = {
        institutionId,
        subjectId: priceSubjectId,
        level: priceLevel,
        pricePerSession: parseFloat(priceAmount),
      };

      if (editingPricing) {
        // Update pricing
        const res = await fetch(`/api/settings/pricing/${editingPricing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('تم تعديل السعر بنجاح');
        }
      } else {
        // Create pricing
        const res = await fetch('/api/settings/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success('تم إضافة السعر بنجاح');
        }
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

  const handleSaveNotifications = () => {
    toast.success('تم حفظ إعدادات الإشعارات بنجاح');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0"
      dir="rtl"
    >
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
          <TabsList className="bg-white shadow-sm border border-gray-100 h-12 p-1 rounded-xl">
            <TabsTrigger value="institution" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <Building2 className="h-4 w-4 ml-1.5" />
              معلومات المؤسسة
            </TabsTrigger>
            <TabsTrigger value="pricing" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <Banknote className="h-4 w-4 ml-1.5" />
              الأسعار
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <Bell className="h-4 w-4 ml-1.5" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 ml-1.5" />
              الاشتراك
            </TabsTrigger>
          </TabsList>

          {/* ─── Institution Info Tab ─────────────────────────────────────── */}
          <TabsContent value="institution">
            <AnimatePresence mode="wait">
              <motion.div
                key="institution"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-edutrack-primary" />
                      معلومات المؤسسة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">شعار المؤسسة</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-edutrack-primary/30 hover:bg-edutrack-primary/5 transition-colors cursor-pointer">
                          {instLogo ? (
                            <img src={instLogo} alt="شعار" className="h-16 w-16 object-contain rounded" />
                          ) : (
                            <div className="text-center">
                              <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                              <span className="text-[10px] text-muted-foreground">رفع شعار</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => toast.info('ميزة رفع الشعار قيد التطوير')}
                          >
                            <Upload className="h-3.5 w-3.5 ml-1" />
                            رفع صورة
                          </Button>
                          <p className="text-[10px] text-muted-foreground">PNG, JPG بحد أقصى 2MB</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">اسم المؤسسة</Label>
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

                    {/* Address */}
                    <div className="space-y-2">
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
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-edutrack-primary hover:bg-edutrack-primary/5"
                                      onClick={() => openEditPricingDialog(row)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                      onClick={() => handleDeletePricing(row.id)}
                                    >
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
                {/* SMS Toggle */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-edutrack-secondary/10 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-edutrack-secondary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-edutrack-dark">إشعارات SMS</h3>
                          <p className="text-sm text-muted-foreground">إرسال إشعارات SMS لأولياء الأمور عند الغياب</p>
                        </div>
                      </div>
                      <Switch
                        checked={smsEnabled}
                        onCheckedChange={setSmsEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

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
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11"
                    >
                      <Save className="h-4 w-4 ml-2" />
                      حفظ الإعدادات
                    </Button>
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
            <Button
              variant="outline"
              onClick={() => setPricingDialogOpen(false)}
              className="h-10"
            >
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
