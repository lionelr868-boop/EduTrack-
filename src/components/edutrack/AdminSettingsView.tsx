'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Globe,
  Shield,
  KeyRound,
  AlertTriangle,
  Trash2,
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Wrench,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  Server,
  Database,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function AdminSettingsView() {
  const user = useAppStore((s) => s.user);

  // Platform Configuration
  const [siteName, setSiteName] = useState('EduTrack');
  const [siteDescription, setSiteDescription] = useState('منصة تسيير المؤسسات التعليمية');
  const [contactEmail, setContactEmail] = useState('admin@edutrack.dz');
  const [contactPhone, setContactPhone] = useState('+213 000 000 000');
  const [contactAddress, setContactAddress] = useState('الجزائر');
  const [savingPlatform, setSavingPlatform] = useState(false);

  // System Settings
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [savingSystem, setSavingSystem] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleSavePlatform = async () => {
    setSavingPlatform(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          type: 'platform',
          siteName,
          siteDescription,
          contactEmail,
          contactPhone,
          contactAddress,
        }),
      });

      if (res.ok) {
        toast.success('تم حفظ إعدادات المنصة بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleSaveSystem = async () => {
    setSavingSystem(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          type: 'system',
          maintenanceMode,
          registrationEnabled,
        }),
      });

      if (res.ok) {
        toast.success('تم حفظ إعدادات النظام بنجاح');
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSavingSystem(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (!user?.id) {
      toast.error('خطأ في المصادقة');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('تم تغيير كلمة المرور بنجاح');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetDatabase = () => {
    // Visual only - no real action
    toast.success('تم إعادة تعيين قاعدة البيانات (محاكاة فقط)');
    setResetConfirmText('');
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
            إعدادات النظام
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إعدادات وتفضيلات المنصة الشاملة</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="platform" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-white shadow-sm border border-gray-100 h-12 p-1 rounded-xl inline-flex w-auto min-w-full">
              <TabsTrigger
                value="platform"
                className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap"
              >
                <Globe className="h-4 w-4 ml-1.5" />
                المنصة
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap"
              >
                <Server className="h-4 w-4 ml-1.5" />
                النظام
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-lg text-sm px-4 data-[state=active]:bg-edutrack-primary data-[state=active]:text-white whitespace-nowrap"
              >
                <KeyRound className="h-4 w-4 ml-1.5" />
                الأمان
              </TabsTrigger>
              <TabsTrigger
                value="danger"
                className="rounded-lg text-sm px-4 data-[state=active]:bg-red-500 data-[state=active]:text-white whitespace-nowrap"
              >
                <AlertTriangle className="h-4 w-4 ml-1.5" />
                منطقة الخطر
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Platform Configuration Tab */}
          <TabsContent value="platform">
            <AnimatePresence mode="wait">
              <motion.div
                key="platform"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Globe className="h-5 w-5 text-edutrack-primary" />
                      إعدادات المنصة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Site Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">اسم المنصة</Label>
                        <div className="relative">
                          <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="اسم المنصة"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            className="pr-10 h-11"
                          />
                        </div>
                      </div>

                      {/* Contact Email */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">البريد الإلكتروني للتواصل</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="admin@edutrack.dz"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Site Description */}
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-medium">وصف المنصة</Label>
                        <Textarea
                          placeholder="وصف مختصر للمنصة"
                          value={siteDescription}
                          onChange={(e) => setSiteDescription(e.target.value)}
                          className="min-h-[80px] resize-y"
                        />
                      </div>

                      {/* Contact Phone */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">هاتف التواصل</Label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+213 000 000 000"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="pr-10 h-11"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Contact Address */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">العنوان</Label>
                        <div className="relative">
                          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="عنوان المنصة"
                            value={contactAddress}
                            onChange={(e) => setContactAddress(e.target.value)}
                            className="pr-10 h-11"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSavePlatform}
                      disabled={savingPlatform}
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11 mt-2"
                    >
                      {savingPlatform ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <Save className="h-4 w-4 ml-2" />
                      )}
                      حفظ إعدادات المنصة
                    </Button>
                  </CardContent>
                </Card>

                {/* System Info Card */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-edutrack-primary" />
                      معلومات النظام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                        <Database className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-[10px] text-blue-600 font-medium">قاعدة البيانات</p>
                        <p className="text-xs font-bold text-blue-900">SQLite</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center">
                        <Server className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-[10px] text-emerald-600 font-medium">الخادم</p>
                        <p className="text-xs font-bold text-emerald-900">Next.js 16</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                        <Shield className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-[10px] text-amber-600 font-medium">الأمان</p>
                        <p className="text-xs font-bold text-amber-900">مُفعّل</p>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-center">
                        <Globe className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-[10px] text-purple-600 font-medium">الإصدار</p>
                        <p className="text-xs font-bold text-purple-900">v1.0.0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system">
            <AnimatePresence mode="wait">
              <motion.div
                key="system"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Maintenance Mode */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          maintenanceMode
                            ? 'bg-red-50'
                            : 'bg-gray-50'
                        }`}>
                          <Wrench className={`h-6 w-6 ${
                            maintenanceMode ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-edutrack-dark">وضع الصيانة</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            عند التفعيل، لن يتمكن المستخدمون من الوصول للمنصة
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={maintenanceMode}
                        onCheckedChange={setMaintenanceMode}
                      />
                    </div>
                    {maintenanceMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-xs text-red-700 font-medium">
                            المنصة في وضع الصيانة - المستخدمون العاديون لن يتمكنوا من الدخول
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* Registration Enabled */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          registrationEnabled
                            ? 'bg-emerald-50'
                            : 'bg-gray-50'
                        }`}>
                          <UserPlus className={`h-6 w-6 ${
                            registrationEnabled ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-edutrack-dark">التسجيل مفعّل</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            السماح بإنشاء حسابات جديدة في المنصة
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={registrationEnabled}
                        onCheckedChange={setRegistrationEnabled}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Other System Toggles */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Settings className="h-5 w-5 text-edutrack-primary" />
                      إعدادات إضافية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50">
                      <div>
                        <p className="text-sm font-medium text-edutrack-dark">إشعارات البريد الإلكتروني</p>
                        <p className="text-xs text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                        قريباً
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50">
                      <div>
                        <p className="text-sm font-medium text-edutrack-dark">النسخ الاحتياطي التلقائي</p>
                        <p className="text-xs text-muted-foreground">نسخ احتياطي يومي لقاعدة البيانات</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                        قريباً
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSaveSystem}
                  disabled={savingSystem}
                  className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11"
                >
                  {savingSystem ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  حفظ إعدادات النظام
                </Button>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Security / Password Tab */}
          <TabsContent value="security">
            <AnimatePresence mode="wait">
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-edutrack-primary" />
                      تغيير كلمة المرور
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">كلمة المرور الحالية</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="كلمة المرور الحالية"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10 pl-10 h-11"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">كلمة المرور الجديدة</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10 pl-10 h-11"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                newPassword.length >= i * 3
                                  ? newPassword.length >= 12
                                    ? 'bg-emerald-500'
                                    : newPassword.length >= 8
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">تأكيد كلمة المرور الجديدة</Label>
                      <div className="relative">
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="أعد إدخال كلمة المرور الجديدة"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10 pl-10 h-11"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && newPassword && (
                        <div className="flex items-center gap-1 mt-1">
                          {newPassword === confirmPassword ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-[11px] text-emerald-600">متطابقة</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-red-500">غير متطابقة</span>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11"
                    >
                      {changingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <KeyRound className="h-4 w-4 ml-2" />
                      )}
                      تغيير كلمة المرور
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Sessions (Visual) */}
                <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                      <Shield className="h-5 w-5 text-edutrack-primary" />
                      الجلسات النشطة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <p className="text-sm font-medium text-emerald-900">الجلسة الحالية</p>
                          <p className="text-xs text-emerald-600">
                            {user?.email} • نشط الآن
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <AnimatePresence mode="wait">
              <motion.div
                key="danger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2 border-red-200 shadow-md shadow-red-100/50 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      منطقة الخطر
                    </CardTitle>
                    <p className="text-xs text-red-600/70 mt-1">
                      الإجراءات في هذه القسم غير قابلة للتراجع. يرجى الحذر.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reset Database */}
                    <div className="p-5 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Database className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-red-900">إعادة تعيين قاعدة البيانات</h3>
                            <p className="text-xs text-red-600/70 mt-0.5">
                              حذف جميع البيانات وإعادة قاعدة البيانات إلى الحالة الأولية. هذا الإجراء لا يمكن التراجع عنه.
                            </p>
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 whitespace-nowrap flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4 ml-1.5" />
                              إعادة تعيين
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-right flex items-center gap-2 justify-end">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                تأكيد إعادة التعيين
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-right">
                                هذا الإجراء سيحذف جميع البيانات بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-3 py-2">
                              <Label className="text-sm font-medium text-red-700">
                                اكتب &quot;إعادة تعيين&quot; للتأكيد
                              </Label>
                              <Input
                                placeholder='اكتب "إعادة تعيين"'
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value)}
                                className="h-11 border-red-200 focus:border-red-500 focus:ring-red-500/20"
                              />
                            </div>
                            <AlertDialogFooter className="gap-2 sm:gap-0">
                              <AlertDialogCancel className="h-10">إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleResetDatabase}
                                disabled={resetConfirmText !== 'إعادة تعيين'}
                                className="h-10 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                إعادة تعيين قاعدة البيانات
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Additional warnings */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-amber-900">تنبيه مهم</h4>
                          <ul className="text-xs text-amber-700 mt-1 space-y-1">
                            <li>• تأكد من وجود نسخة احتياطية قبل أي إجراء خطير</li>
                            <li>• إعادة تعيين قاعدة البيانات ستحذف جميع المؤسسات والمستخدمين والبيانات</li>
                            <li>• لن يتم تنفيذ الإجراء إلا بعد كتابة نص التأكيد</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
