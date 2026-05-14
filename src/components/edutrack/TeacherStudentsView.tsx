'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  GraduationCap,
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

// ─── Demo Data ──────────────────────────────────────────────
interface StudentData {
  id: string;
  name: string;
  level: string;
  attendanceRate: number;
  totalSessions: number;
  absentCount: number;
  attendanceHistory: { date: string; subject: string; status: 'present' | 'absent' | 'late' }[];
}

const demoStudents: StudentData[] = [
  {
    id: '1', name: 'أمين حسين', level: '3 متوسط', attendanceRate: 72, totalSessions: 25, absentCount: 7,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'الرياضيات', status: 'absent' },
      { date: '2025-01-11', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-10', subject: 'الفيزياء', status: 'present' },
      { date: '2025-01-09', subject: 'الرياضيات', status: 'late' },
      { date: '2025-01-08', subject: 'الفيزياء', status: 'absent' },
    ],
  },
  {
    id: '2', name: 'سارة بلقاسم', level: '3 متوسط', attendanceRate: 85, totalSessions: 25, absentCount: 4,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'الفيزياء', status: 'absent' },
      { date: '2025-01-11', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-10', subject: 'الفيزياء', status: 'present' },
      { date: '2025-01-09', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-08', subject: 'الفيزياء', status: 'present' },
    ],
  },
  {
    id: '3', name: 'ياسين مراد', level: '2 ثانوي', attendanceRate: 60, totalSessions: 20, absentCount: 8,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'الرياضيات', status: 'absent' },
      { date: '2025-01-11', subject: 'الرياضيات', status: 'absent' },
      { date: '2025-01-10', subject: 'العلوم', status: 'present' },
      { date: '2025-01-09', subject: 'الرياضيات', status: 'absent' },
      { date: '2025-01-08', subject: 'العلوم', status: 'late' },
    ],
  },
  {
    id: '4', name: 'زينب شريف', level: '1 ثانوي', attendanceRate: 95, totalSessions: 20, absentCount: 1,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'العلوم', status: 'present' },
      { date: '2025-01-11', subject: 'العلوم', status: 'present' },
      { date: '2025-01-10', subject: 'العلوم', status: 'present' },
      { date: '2025-01-09', subject: 'العلوم', status: 'absent' },
      { date: '2025-01-08', subject: 'العلوم', status: 'present' },
    ],
  },
  {
    id: '5', name: 'محمد العربي', level: '3 متوسط', attendanceRate: 78, totalSessions: 25, absentCount: 6,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-11', subject: 'الفيزياء', status: 'absent' },
      { date: '2025-01-10', subject: 'الرياضيات', status: 'late' },
      { date: '2025-01-09', subject: 'الفيزياء', status: 'present' },
      { date: '2025-01-08', subject: 'الرياضيات', status: 'absent' },
    ],
  },
  {
    id: '6', name: 'نور الهدى بن عمر', level: '2 ثانوي', attendanceRate: 92, totalSessions: 20, absentCount: 2,
    attendanceHistory: [
      { date: '2025-01-12', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-11', subject: 'الرياضيات', status: 'present' },
      { date: '2025-01-10', subject: 'العلوم', status: 'present' },
      { date: '2025-01-09', subject: 'الرياضيات', status: 'absent' },
      { date: '2025-01-08', subject: 'العلوم', status: 'present' },
    ],
  },
];

// ─── Animation Variants ─────────────────────────────────────
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

// ─── Attendance Status Icons ────────────────────────────────
const attendanceStatusConfig = {
  present: { label: 'حاضر', color: 'text-emerald-600', icon: <CheckCircle2 className="h-4 w-4" /> },
  absent: { label: 'غائب', color: 'text-red-600', icon: <XCircle className="h-4 w-4" /> },
  late: { label: 'متأخر', color: 'text-amber-600', icon: <Clock className="h-4 w-4" /> },
};

// ─── Main Component ─────────────────────────────────────────
export default function TeacherStudentsView() {
  const user = useAppStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return demoStudents;
    return demoStudents.filter((s) =>
      s.name.includes(searchQuery.trim())
    );
  }, [searchQuery]);

  const openStudentDetail = (student: StudentData) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-600';
    if (rate >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 85) return '[&>div]:bg-emerald-500';
    if (rate >= 75) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
            </div>
            تلاميذي
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">إدارة ومتابعة تلاميذك</p>
        </div>
        <Badge variant="outline" className="w-fit text-sm py-1.5 px-3 border-edutrack-primary/20 text-edutrack-primary bg-edutrack-primary/5">
          {demoStudents.length} تلميذ
        </Badge>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن تلميذ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9 h-10 bg-white border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg text-sm"
          />
        </div>
      </motion.div>

      {/* Student List */}
      <motion.div variants={itemVariants}>
        <div className="space-y-3">
          <AnimatePresence>
            {filteredStudents.map((student, index) => {
              const isWarning = student.attendanceRate < 80;
              const isCritical = student.attendanceRate < 70;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                >
                  <Card
                    className={`border-0 shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer ${
                      isCritical ? 'ring-1 ring-red-200' : isWarning ? 'ring-1 ring-amber-200' : ''
                    }`}
                    onClick={() => openStudentDetail(student)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <Avatar className={`h-11 w-11 border-2 ${
                          isCritical ? 'border-red-300' : isWarning ? 'border-amber-300' : 'border-edutrack-primary/20'
                        }`}>
                          <AvatarFallback className={`text-sm font-bold ${
                            isCritical ? 'bg-red-50 text-red-600' : isWarning ? 'bg-amber-50 text-amber-600' : 'bg-edutrack-primary/10 text-edutrack-primary'
                          }`}>
                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-edutrack-dark truncate">{student.name}</h3>
                            {isWarning && (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px] gap-0.5 px-1.5 py-0 flex-shrink-0">
                                <AlertTriangle className="h-3 w-3" />
                                غياب كثير
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{student.level}</p>
                        </div>

                        {/* Attendance */}
                        <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-lg font-bold font-inter ${getAttendanceColor(student.attendanceRate)}`}>
                              {student.attendanceRate}%
                            </span>
                          </div>
                          <Progress value={student.attendanceRate} className={`h-1.5 w-full ${getProgressColor(student.attendanceRate)}`} />
                          <span className="text-[10px] text-muted-foreground">
                            {student.absentCount} غياب من {student.totalSessions}
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredStudents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <GraduationCap className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground">لم يتم العثور على نتائج</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-edutrack-dark">
              <GraduationCap className="h-5 w-5 text-edutrack-primary" />
              تفاصيل التلميذ
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              {/* Student Info Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar className="h-14 w-14 border-2 border-edutrack-primary/20">
                  <AvatarFallback className="bg-edutrack-primary/10 text-edutrack-primary font-bold text-lg">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-edutrack-dark text-lg">{selectedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.level}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">نسبة الحضور</p>
                  <p className={`font-bold text-lg font-inter ${getAttendanceColor(selectedStudent.attendanceRate)}`}>
                    {selectedStudent.attendanceRate}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">إجمالي الحصص</p>
                  <p className="font-bold text-lg font-inter text-edutrack-dark">{selectedStudent.totalSessions}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">الغيابات</p>
                  <p className="font-bold text-lg font-inter text-red-600">{selectedStudent.absentCount}</p>
                </div>
              </div>

              <Separator />

              {/* Attendance History */}
              <div>
                <h4 className="font-semibold text-edutrack-dark mb-3 text-sm">سجل الحضور الأخير</h4>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {selectedStudent.attendanceHistory.map((record, idx) => {
                      const statusCfg = attendanceStatusConfig[record.status];
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={statusCfg.color}>{statusCfg.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-edutrack-dark">{record.subject}</p>
                              <p className="text-xs text-muted-foreground font-inter">{record.date}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : record.status === 'absent' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-xs`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
