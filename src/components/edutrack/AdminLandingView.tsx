'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Globe,
  Pencil,
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  Loader2,
  Layout,
  Star,
  DollarSign,
  MessageSquare,
  BarChart3,
  Home,
  ChevronLeft,
  Plus,
  Sparkles,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface LandingSection {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  enabled: boolean;
  order: number;
  updatedAt: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Home className="h-5 w-5" />,
  features: <Star className="h-5 w-5" />,
  pricing: <DollarSign className="h-5 w-5" />,
  testimonials: <MessageSquare className="h-5 w-5" />,
  stats: <BarChart3 className="h-5 w-5" />,
  footer: <Layout className="h-5 w-5" />,
};

const SECTION_LABELS: Record<string, string> = {
  hero: 'القسم الرئيسي',
  features: 'المميزات',
  pricing: 'الأسعار',
  testimonials: 'آراء العملاء',
  stats: 'الإحصائيات',
  footer: 'التذييل',
};

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hero: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  features: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  pricing: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  testimonials: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  stats: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  footer: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const ALL_SECTIONS = ['hero', 'features', 'pricing', 'testimonials', 'stats', 'footer'];

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

export default function AdminLandingView() {
  const user = useAppStore((s) => s.user);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landing', {
        headers: { 'x-user-role': user?.role || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleToggleEnabled = async (section: LandingSection) => {
    try {
      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          id: section.id,
          enabled: !section.enabled,
        }),
      });

      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, enabled: !s.enabled } : s))
        );
        toast.success(section.enabled ? 'تم تعطيل القسم' : 'تم تفعيل القسم');
      } else {
        toast.error('حدث خطأ أثناء التحديث');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    const temp = newSections[index].order;
    newSections[index].order = newSections[index - 1].order;
    newSections[index - 1].order = temp;

    const sorted = newSections.sort((a, b) => a.order - b.order);
    setSections(sorted);

    try {
      await Promise.all([
        fetch('/api/admin/landing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || '',
          },
          body: JSON.stringify({ id: sorted[index].id, order: sorted[index].order }),
        }),
        fetch('/api/admin/landing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || '',
          },
          body: JSON.stringify({ id: sorted[index - 1].id, order: sorted[index - 1].order }),
        }),
      ]);
      toast.success('تم إعادة ترتيب الأقسام');
    } catch {
      toast.error('حدث خطأ أثناء إعادة الترتيب');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    const temp = newSections[index].order;
    newSections[index].order = newSections[index + 1].order;
    newSections[index + 1].order = temp;

    const sorted = newSections.sort((a, b) => a.order - b.order);
    setSections(sorted);

    try {
      await Promise.all([
        fetch('/api/admin/landing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || '',
          },
          body: JSON.stringify({ id: sorted[index].id, order: sorted[index].order }),
        }),
        fetch('/api/admin/landing', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': user?.role || '',
          },
          body: JSON.stringify({ id: sorted[index + 1].id, order: sorted[index + 1].order }),
        }),
      ]);
      toast.success('تم إعادة ترتيب الأقسام');
    } catch {
      toast.error('حدث خطأ أثناء إعادة الترتيب');
    }
  };

  const openEditDialog = (section: LandingSection) => {
    setEditingSection(section);
    setEditTitle(section.title || '');
    setEditSubtitle(section.subtitle || '');
    setEditContent(section.content || '');
    setEditDialogOpen(true);
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          id: editingSection.id,
          title: editTitle,
          subtitle: editSubtitle,
          content: editContent,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSections((prev) =>
          prev.map((s) => (s.id === editingSection.id ? { ...s, ...updated } : s))
        );
        toast.success('تم تحديث القسم بنجاح');
        setEditDialogOpen(false);
      } else {
        toast.error('حدث خطأ أثناء التحديث');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMissingSection = async (sectionKey: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || '',
        },
        body: JSON.stringify({
          section: sectionKey,
          title: SECTION_LABELS[sectionKey] || sectionKey,
          subtitle: '',
          content: '',
          enabled: true,
          order: sections.length + 1,
        }),
      });

      if (res.ok) {
        toast.success('تم إنشاء القسم بنجاح');
        fetchSections();
      } else {
        toast.error('حدث خطأ أثناء الإنشاء');
      }
    } catch {
      toast.error('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const existingSectionKeys = sections.map((s) => s.section);
  const missingSections = ALL_SECTIONS.filter((s) => !existingSectionKeys.includes(s));

  // Preview rendering
  const renderPreviewSection = (section: LandingSection) => {
    if (!section.enabled) return null;
    const colors = SECTION_COLORS[section.section] || SECTION_COLORS.footer;

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl border-2 border-dashed ${colors.border} ${colors.bg} p-6 text-center`}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className={colors.text}>{SECTION_ICONS[section.section]}</span>
          <h3 className={`text-lg font-bold ${colors.text}`}>
            {section.title || SECTION_LABELS[section.section] || section.section}
          </h3>
        </div>
        {section.subtitle && (
          <p className="text-sm text-muted-foreground mb-2">{section.subtitle}</p>
        )}
        {section.content && (
          <div className="mt-2 p-3 bg-white/60 rounded-lg">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        )}
        <Badge variant="outline" className={`mt-3 ${colors.text} ${colors.border}`}>
          {SECTION_LABELS[section.section] || section.section}
        </Badge>
      </motion.div>
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
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة صفحة الهبوط
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">التحكم في محتوى ومظهر الصفحة الرئيسية العامة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="h-9 border-edutrack-primary/30 text-edutrack-primary hover:bg-edutrack-primary/5"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 ml-1.5" />
                إخفاء المعاينة
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 ml-1.5" />
                معاينة
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSections}
            className="h-9 border-gray-200 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4 ml-1.5" />
            تحديث
          </Button>
        </div>
      </motion.div>

      {/* Preview Mode */}
      <AnimatePresence>
        {previewMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg shadow-gray-100/80 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-l from-edutrack-primary/5 to-edutrack-secondary/5 border-b border-gray-100 pb-4">
                <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-edutrack-secondary" />
                  معاينة الصفحة الرئيسية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {sections.filter((s) => s.enabled).length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد أقسام مفعلة لعرضها</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {sections
                      .filter((s) => s.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map(renderPreviewSection)}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missing Sections */}
      {missingSections.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <Card className="border-0 shadow-md shadow-amber-100/80 bg-gradient-to-bl from-amber-50/50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-bold text-amber-800">أقسام غير مُنشأة</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingSections.map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateMissingSection(key)}
                    disabled={saving}
                    className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Plus className="h-3 w-3 ml-1" />
                    {SECTION_LABELS[key] || key}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sections List */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
              <Layout className="h-5 w-5 text-edutrack-primary" />
              أقسام الصفحة الرئيسية
              <Badge variant="secondary" className="mr-2 text-xs">
                {sections.length} قسم
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-16">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">لا توجد أقسام بعد</p>
                <p className="text-xs text-muted-foreground">أنشئ الأقسام أعلاه للبدء</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                <AnimatePresence>
                  {sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => {
                      const colors = SECTION_COLORS[section.section] || SECTION_COLORS.footer;
                      return (
                        <motion.div
                          key={section.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors group ${
                            !section.enabled ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Drag Handle */}
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="h-3 w-3 text-gray-400" />
                            </button>
                            <GripVertical className="h-3 w-3 text-gray-300" />
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === sections.length - 1}
                              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </div>

                          {/* Section Icon */}
                          <div
                            className={`h-10 w-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}
                          >
                            <span className={colors.text}>
                              {SECTION_ICONS[section.section] || <Layout className="h-5 w-5" />}
                            </span>
                          </div>

                          {/* Section Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-edutrack-dark truncate">
                                {section.title || SECTION_LABELS[section.section] || section.section}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-5 ${colors.text} ${colors.border}`}
                              >
                                {SECTION_LABELS[section.section] || section.section}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {section.subtitle || 'بدون عنوان فرعي'}
                            </p>
                          </div>

                          {/* Toggle & Edit */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`toggle-${section.id}`}
                                className="text-xs text-muted-foreground"
                              >
                                {section.enabled ? 'مفعّل' : 'معطّل'}
                              </Label>
                              <Switch
                                id={`toggle-${section.id}`}
                                checked={section.enabled}
                                onCheckedChange={() => handleToggleEnabled(section)}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(section)}
                              className="h-8 w-8 hover:bg-edutrack-primary/10 text-muted-foreground hover:text-edutrack-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              {editingSection && (
                <>
                  <span className={SECTION_COLORS[editingSection.section]?.text || ''}>
                    {SECTION_ICONS[editingSection.section] || <Layout className="h-5 w-5" />}
                  </span>
                  تعديل: {SECTION_LABELS[editingSection.section] || editingSection.section}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">العنوان</Label>
              <Input
                placeholder="عنوان القسم"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">العنوان الفرعي</Label>
              <Input
                placeholder="عنوان فرعي أو وصف مختصر"
                value={editSubtitle}
                onChange={(e) => setEditSubtitle(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">المحتوى</Label>
              <Textarea
                placeholder="محتوى القسم (يمكن أن يكون JSON أو نص عادي)"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] resize-y"
              />
              <p className="text-[10px] text-muted-foreground">
                يمكن إدخال نص عادي أو JSON للمحتوى المنظم
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="h-10"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSection}
              disabled={saving}
              className="bg-edutrack-primary hover:bg-edutrack-primary/90 text-white h-10"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
