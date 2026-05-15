'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertCircle,
  CalendarDays,
  Send,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Animation Variants ─────────────────────────────────────
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

// ─── Demo Previous Requests ─────────────────────────────────
interface AbsenceRequest {
  id: string;
  date: string;
  reason: string;
  canCompensate: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const demoPreviousRequests: AbsenceRequest[] = [
  { id: '1', date: '2025-01-08', reason: 'ظرف عائلي طارئ', canCompensate: true, status: 'approved', createdAt: '2025-01-07' },
  { id: '2', date: '2025-01-02', reason: 'مراجعة طبية', canCompensate: false, status: 'pending', createdAt: '2025-01-01' },
];

const requestStatusConfig = {
  pending: { label: 'قيد المراجعة', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: <Clock className="h-3.5 w-3.5" /> },
  approved: { label: 'مقبول', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  rejected: { label: 'مرفوض', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

// ─── Main Component ─────────────────────────────────────────
export default function TeacherAbsenceRequest() {
  const user = useAppStore((s) => s.user);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [canCompensate, setCanCompensate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [previousRequests] = useState<AbsenceRequest[]>(demoPreviousRequests);

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error('يرجى اختيار تاريخ الغياب');
      return;
    }
    if (!reason.trim()) {
      toast.error('يرجى كتابة سبب الغياب');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/teacher/absence-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherUserId: user?.id,
          date: selectedDate.toISOString(),
          reason: reason.trim(),
          canCompensate,
          institutionId: user?.institutionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('تم إرسال طلب الغياب بنجاح');
        setSelectedDate(undefined);
        setReason('');
        setCanCompensate(false);
      } else {
        toast.error(data.error || 'فشل في إرسال الطلب');
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-edutrack-primary" />
          </div>
          إبلاغ غياب
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">أبلغ عن غيابك ليتم إعلام الإدارة</p>
      </motion.div>

      {/* Form */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-6 space-y-6">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-edutrack-dark">تاريخ الغياب</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full h-11 justify-start text-right font-normal ${
                      !selectedDate && 'text-muted-foreground'
                    }`}
                  >
                    <CalendarDays className="h-4 w-4 ml-2" />
                    {selectedDate
                      ? selectedDate.toLocaleDateString('ar-DZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'اختر تاريخ الغياب'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    disabled={(date) => date > new Date() || date < new Date('2024-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-edutrack-dark">سبب الغياب</Label>
              <Textarea
                placeholder="اكتب سبب الغياب هنا..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] resize-none bg-white border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 text-sm"
              />
            </div>

            {/* Can Compensate Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-edutrack-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-edutrack-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-edutrack-dark">هل يمكن تعويضها؟</p>
                  <p className="text-xs text-muted-foreground">تحديد إمكانية جدولة حصة تعويضية</p>
                </div>
              </div>
              <Switch
                checked={canCompensate}
                onCheckedChange={setCanCompensate}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDate || !reason.trim()}
              className="w-full h-11 bg-edutrack-primary hover:bg-edutrack-primary/90 text-white font-semibold text-sm gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال طلب الغياب
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Previous Requests */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-edutrack-dark flex items-center gap-2">
              <Clock className="h-5 w-5 text-edutrack-primary" />
              طلباتي السابقة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {previousRequests.map((req, index) => {
                const statusCfg = requestStatusConfig[req.status];
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      req.status === 'approved' ? 'bg-emerald-100' : req.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {statusCfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-edutrack-dark">{req.reason}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-inter">{req.date}</span>
                        {req.canCompensate && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5">
                            قابلة للتعويض
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`${statusCfg.bgColor} ${statusCfg.color} border text-xs gap-1 px-2 py-0.5`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
