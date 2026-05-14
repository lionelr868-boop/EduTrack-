'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings,
  User,
  Lock,
  Phone,
  Save,
  Eye,
  EyeOff,
  Building2,
  Shield,
  Loader2,
  Mail,
  CheckCircle2,
  GraduationCap,
  UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
interface ChildInfo {
  id: string;
  name: string;
}

interface ParentProfile {
  id: string;
  phone: string | null;
}

interface InstitutionInfo {
  id: string;
  name: string;
  logo: string | null;
}

interface SettingsData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  parent: ParentProfile;
  institution: InstitutionInfo | null;
  children: ChildInfo[];
}

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ─── Main Component ────────────────────────────────────────
export default function ParentSettingsView() {
  const user = useAppStore((s) => s.user);

  // ─── Data State ──────────────────────────────────────────
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Profile Form State ──────────────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ─── Password Form State ─────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // ─── Fetch Settings Data ─────────────────────────────────
  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/parent/settings?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data: SettingsData = await res.json();
      setSettingsData(data);

      // Populate form fields
      setName(data.user.name);
      setPhone(data.parent.phone || '');
    } catch (err) {
      console.error('Error fetching parent settings:', err);
      toast.error('فشل في جلب إعدادات الحساب');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Handle Save Profile ─────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast.error('خطأ في المصادقة');
      return;
    }
    if (!name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/parent/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('تم حفظ التغييرات بنجاح');
        setSettingsData((prev) =>
          prev
            ? {
                ...prev,
                user: { ...prev.user, name: data.user.name },
                parent: { ...prev.parent, ...data.parent },
              }
            : prev
        );
      } else {
        toast.error(data.error || 'حدث خطأ أثناء حفظ التغييرات');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Handle Change Password ──────────────────────────────
  const handleChangePassword = async () => {
    if (!user?.id) {
      toast.error('خطأ في المصادقة');
      return;
    }
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

    setChangingPassword(true);
    try {
      const res = await fetch('/api/parent/settings', {
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
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        toast.error(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setChangingPassword(false);
    }
  };

  // ─── Get Initials ────────────────────────────────────────
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return parts[0]?.substring(0, 2) || 'أ';
  };

  // ─── Loading Skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 animate-pulse" />
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const institution = settingsData?.institution;
  const children = settingsData?.children || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-edutrack-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-edutrack-dark">
              إعدادات الحساب
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              إدارة معلوماتك الشخصية وإعدادات الأمان
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Profile Info Card ──────────────────────────────── */}
        <motion.div variants={itemVariants} className="lg:row-span-2">
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-edutrack-primary" />
                </div>
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4 pb-2">
                <Avatar className="h-20 w-20 border-2 border-edutrack-primary/20 shadow-md">
                  <AvatarFallback className="bg-edutrack-primary text-white text-2xl font-bold">
                    {getInitials(name || user?.name || 'أ')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold text-edutrack-dark">
                    {settingsData?.user.name || user?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {settingsData?.user.email || user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className="text-[11px] px-2 py-0.5 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
                    >
                      ولي أمر
                    </Badge>
                    {children.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 border-edutrack-secondary/20 text-edutrack-secondary bg-edutrack-secondary/5"
                      >
                        <UsersRound className="h-3 w-3 ml-1" />
                        {children.length} أبناء
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Name Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  الاسم الكامل <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="الاسم الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 h-11"
                  />
                </div>
              </div>

              {/* Email Field (read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={settingsData?.user.email || ''}
                    readOnly
                    className="pr-10 pl-10 h-11 bg-gray-50 text-muted-foreground cursor-not-allowed"
                    dir="ltr"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  البريد الإلكتروني لا يمكن تغييره
                </p>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="رقم الهاتف"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10 h-11"
                    dir="ltr"
                  />
                </div>
              </div>

              <Separator />

              {/* Read-only: Children List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  الأبناء
                </Label>
                <div className="flex flex-wrap gap-2">
                  {children.length > 0 ? (
                    children.map((child) => (
                      <Badge
                        key={child.id}
                        variant="outline"
                        className="text-sm px-3 py-1.5 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5"
                      >
                        <GraduationCap className="h-3.5 w-3.5 ml-1.5" />
                        {child.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">لا يوجد أبناء مسجلين</span>
                  )}
                </div>
              </div>

              {/* Read-only: Institution */}
              {institution && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    المؤسسة
                  </Label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="h-9 w-9 rounded-lg bg-edutrack-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-edutrack-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-edutrack-dark truncate">
                        {institution.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="w-full bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-11 font-semibold"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Password Change Card ───────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-amber-600" />
                </div>
                تغيير كلمة السر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  كلمة المرور الحالية <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور الحالية"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10 pl-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  كلمة المرور الجديدة <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور الجديدة"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 pl-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Password length indicator */}
                {newPassword && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          newPassword.length < 6
                            ? 'bg-red-400 w-1/3'
                            : newPassword.length < 8
                              ? 'bg-amber-400 w-2/3'
                              : 'bg-emerald-400 w-full'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        newPassword.length < 6
                          ? 'text-red-500'
                          : newPassword.length < 8
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                      }`}
                    >
                      {newPassword.length < 6
                        ? 'ضعيفة'
                        : newPassword.length < 8
                          ? 'متوسطة'
                          : 'قوية'}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  تأكيد كلمة المرور الجديدة{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 pl-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-edutrack-dark transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Password match indicator */}
                {confirmPassword && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-1.5 mt-1"
                    >
                      {newPassword === confirmPassword ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-[11px] text-emerald-600 font-medium">
                            كلمات المرور متطابقة
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          <span className="text-[11px] text-red-500 font-medium">
                            كلمات المرور غير متطابقة
                          </span>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              {/* Password Requirements Hint */}
              <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-3.5">
                <p className="text-xs font-medium text-amber-700 mb-1.5">
                  متطلبات كلمة المرور:
                </p>
                <ul className="space-y-1">
                  <li
                    className={`flex items-center gap-2 text-xs ${
                      newPassword.length >= 6
                        ? 'text-emerald-600'
                        : 'text-amber-600/70'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        newPassword.length >= 6
                          ? 'bg-emerald-500'
                          : 'bg-amber-400/60'
                      }`}
                    />
                    6 أحرف على الأقل
                  </li>
                  <li
                    className={`flex items-center gap-2 text-xs ${
                      newPassword === confirmPassword && confirmPassword.length > 0
                        ? 'text-emerald-600'
                        : 'text-amber-600/70'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        newPassword === confirmPassword && confirmPassword.length > 0
                          ? 'bg-emerald-500'
                          : 'bg-amber-400/60'
                      }`}
                    />
                    تطابق كلمة المرور
                  </li>
                </ul>
              </div>

              {/* Change Password Button */}
              <Button
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 font-semibold"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جارٍ التغيير...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 ml-2" />
                    تغيير كلمة السر
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Account Info Card ──────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-edutrack-dark/5 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-edutrack-dark/60" />
                </div>
                معلومات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account Type */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-edutrack-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">نوع الحساب</p>
                    <p className="text-sm font-semibold text-edutrack-dark">
                      ولي أمر
                    </p>
                  </div>
                </div>
                <Badge className="bg-edutrack-primary/10 text-edutrack-primary border-0 hover:bg-edutrack-primary/15 text-xs">
                  <Shield className="h-3 w-3 ml-1" />
                  ولي أمر
                </Badge>
              </div>

              {/* Institution Name */}
              {institution && (
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-edutrack-secondary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-edutrack-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المؤسسة</p>
                      <p className="text-sm font-semibold text-edutrack-dark">
                        {institution.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Number of Children */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <UsersRound className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">عدد الأبناء</p>
                    <p className="text-sm font-semibold text-edutrack-dark">
                      {children.length}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 border-emerald-200 text-emerald-700 bg-emerald-50"
                >
                  {children.length} أبناء
                </Badge>
              </div>

              {/* Children Names */}
              <div className="flex items-start justify-between p-3.5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أسماء الأبناء</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {children.length > 0 ? (
                        children.map((child) => (
                          <Badge
                            key={child.id}
                            variant="outline"
                            className="text-[11px] px-2 py-0.5 border-sky-200 text-sky-700 bg-sky-50"
                          >
                            {child.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">لا يوجد أبناء</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
