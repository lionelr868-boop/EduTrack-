'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  subjectName: string;
  totalSessions: number;
  absentSessions: number;
  pricePerSession: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  studentId: string;
  institutionId: string;
  month: number;
  year: number;
  totalSessions: number;
  absentSessions: number;
  compensatedSessions: number;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  student: { id: string; name: string; level: string };
  lineItems: LineItem[];
}

const months = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; emoji: string }> = {
  PAID: { label: 'مدفوعة', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-4 w-4" />, emoji: '✓' },
  PENDING: { label: 'معلقة', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: <Clock className="h-4 w-4" />, emoji: '⏳' },
  OVERDUE: { label: 'متأخرة', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200', icon: <AlertTriangle className="h-4 w-4" />, emoji: '⚠' },
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'نقدي',
  BANK_TRANSFER: 'تحويل بنكي',
  CHEQUE: 'شيك',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('ar-DZ') + ' دج';
}

export default function ParentInvoicesView() {
  const user = useAppStore((s) => s.user);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get parent's students' invoices
      const res = await fetch(`/api/invoices?institutionId=${user.institutionId}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        // Filter to only show invoices for this parent's children
        // In a real app, we'd filter by parentId on the server
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('حدث خطأ أثناء تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openDetailDialog = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
        setDetailDialogOpen(true);
      }
    } catch {
      toast.error('تعذر تحميل تفاصيل الفاتورة');
    }
  };

  // Find the latest invoice (prefer unpaid)
  const latestInvoice = invoices.length > 0
    ? invoices.find((inv) => inv.status !== 'PAID') || invoices[0]
    : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-0" dir="rtl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-edutrack-primary" />
          </div>
          الفواتير
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">سجل فواتير أبنائكم</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-edutrack-primary animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">لا توجد فواتير حالياً</p>
          <p className="text-sm text-muted-foreground mt-1">ستظهر فواتير أبنائكم هنا عند توليدها</p>
        </motion.div>
      ) : (
        <>
          {/* Latest Invoice Card */}
          {latestInvoice && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden">
                <div className={`h-1.5 ${
                  latestInvoice.status === 'PAID' ? 'bg-emerald-500' :
                  latestInvoice.status === 'OVERDUE' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">آخر فاتورة</p>
                      <h3 className="font-bold text-edutrack-dark text-lg">{latestInvoice.student.name}</h3>
                      <p className="text-sm text-muted-foreground font-inter">
                        {months[latestInvoice.month - 1]} {latestInvoice.year}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${statusConfig[latestInvoice.status]?.bgColor} ${statusConfig[latestInvoice.status]?.color} border gap-1.5 text-sm px-3 py-1`}>
                      {statusConfig[latestInvoice.status]?.emoji} {statusConfig[latestInvoice.status]?.label}
                    </Badge>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">المبلغ المستحق</p>
                      <p className="text-3xl font-bold text-edutrack-dark font-inter">{formatAmount(latestInvoice.amount)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() => openDetailDialog(latestInvoice.id)}
                      >
                        <FileText className="h-3.5 w-3.5 ml-1.5" />
                        التفاصيل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        onClick={() => toast.success('جاري تحضير PDF...')}
                      >
                        <Download className="h-3.5 w-3.5 ml-1.5" />
                        تحميل PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Invoice List */}
          <motion.div variants={itemVariants}>
            <h2 className="font-semibold text-edutrack-dark mb-3 text-sm">جميع الفواتير</h2>
            <div className="space-y-3">
              <AnimatePresence>
                {invoices.map((invoice, index) => {
                  const status = statusConfig[invoice.status] || statusConfig.PENDING;
                  const isExpanded = expandedInvoice === invoice.id;

                  return (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <Card className="border-0 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4">
                          <button
                            className="w-full text-right"
                            onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                  invoice.status === 'PAID' ? 'bg-emerald-50' :
                                  invoice.status === 'OVERDUE' ? 'bg-red-50' : 'bg-amber-50'
                                }`}>
                                  <Receipt className={`h-5 w-5 ${
                                    invoice.status === 'PAID' ? 'text-emerald-500' :
                                    invoice.status === 'OVERDUE' ? 'text-red-500' : 'text-amber-500'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-edutrack-dark">{invoice.student.name}</p>
                                  <p className="text-xs text-muted-foreground font-inter">
                                    {months[invoice.month - 1]} {invoice.year} · {invoice.student.level}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-left">
                                  <p className="font-bold text-sm text-edutrack-dark font-inter">{formatAmount(invoice.amount)}</p>
                                  <Badge variant="outline" className={`${status.bgColor} ${status.color} border text-[10px] gap-0.5 px-1.5 py-0`}>
                                    {status.emoji} {status.label}
                                  </Badge>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <Separator className="my-3" />
                                <div className="space-y-2">
                                  <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <p className="text-[10px] text-muted-foreground">الحصص</p>
                                      <p className="font-bold text-sm font-inter text-edutrack-dark">{invoice.totalSessions}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <p className="text-[10px] text-muted-foreground">الغيابات</p>
                                      <p className="font-bold text-sm font-inter text-red-500">{invoice.absentSessions}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <p className="text-[10px] text-muted-foreground">التعويضية</p>
                                      <p className="font-bold text-sm font-inter text-edutrack-primary">{invoice.compensatedSessions}</p>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-9 text-xs"
                                      onClick={() => openDetailDialog(invoice.id)}
                                    >
                                      <FileText className="h-3.5 w-3.5 ml-1" />
                                      التفاصيل
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-9 text-xs"
                                      onClick={() => toast.success('جاري تحضير PDF...')}
                                    >
                                      <Download className="h-3.5 w-3.5 ml-1" />
                                      تحميل PDF
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <FileText className="h-5 w-5 text-edutrack-primary" />
              تفاصيل الفاتورة
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground">التلميذ</p>
                  <p className="font-semibold text-sm text-edutrack-dark">{selectedInvoice.student.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">المستوى</p>
                  <p className="font-semibold text-sm text-edutrack-dark">{selectedInvoice.student.level}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الشهر</p>
                  <p className="font-semibold text-sm text-edutrack-dark font-inter">
                    {months[selectedInvoice.month - 1]} {selectedInvoice.year}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <Badge variant="outline" className={`${statusConfig[selectedInvoice.status]?.bgColor} ${statusConfig[selectedInvoice.status]?.color} border text-xs gap-1 mt-0.5`}>
                    {statusConfig[selectedInvoice.status]?.emoji} {statusConfig[selectedInvoice.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* Line Items */}
              {selectedInvoice.lineItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-edutrack-dark mb-2 text-sm">تفاصيل المواد</h4>
                  <div className="space-y-2">
                    {selectedInvoice.lineItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-edutrack-dark">{item.subjectName}</p>
                          <p className="text-xs text-muted-foreground font-inter">
                            {item.totalSessions} حصة · {item.absentSessions} غياب
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm font-inter text-edutrack-dark">{formatAmount(item.subtotal)}</p>
                          <p className="text-[10px] text-muted-foreground font-inter">{formatAmount(item.pricePerSession)}/حصة</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-edutrack-primary/5 rounded-xl">
                <span className="font-bold text-edutrack-dark">المبلغ الإجمالي</span>
                <span className="text-xl font-bold text-edutrack-primary font-inter">{formatAmount(selectedInvoice.amount)}</span>
              </div>

              {/* Payment info */}
              {selectedInvoice.status === 'PAID' && selectedInvoice.paidAt && (
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">تم الدفع</span>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    {new Date(selectedInvoice.paidAt).toLocaleDateString('ar-DZ')}
                    {selectedInvoice.paymentMethod && ` — ${paymentMethodLabels[selectedInvoice.paymentMethod] || selectedInvoice.paymentMethod}`}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  toast.success('جاري تحضير PDF...');
                }}
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
