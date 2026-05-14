// Demo data for EduTrack - used when database is empty

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  'رياضيات': { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-50' },
  'فيزياء': { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-300', light: 'bg-purple-50' },
  'فرنسية': { bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-300', light: 'bg-pink-50' },
  'إنجليزية': { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-300', light: 'bg-teal-50' },
  'عربية': { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-300', light: 'bg-amber-50' },
  'علوم': { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-300', light: 'bg-emerald-50' },
  'تاريخ': { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-300', light: 'bg-rose-50' },
  'فلسفة': { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-300', light: 'bg-indigo-50' },
};

export function getSubjectColor(subjectName: string) {
  return SUBJECT_COLORS[subjectName] || { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-300', light: 'bg-gray-50' };
}

export interface DemoSubject {
  id: string;
  name: string;
  level: string;
}

export interface DemoTeacher {
  id: string;
  name: string;
  subjects: string[];
}

export interface DemoSession {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  institutionId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: string;
  level: string;
  repeatType: string;
  cancelReason?: string;
}

export interface DemoStudent {
  id: string;
  name: string;
  level: string;
}

export interface DemoAbsence {
  id: string;
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  sessionId: string;
  subjectName: string;
  reason?: string;
  absenceType: string;
  notificationSent: boolean;
  createdAt: string;
  sessionDay: number;
  sessionTime: string;
}

export interface DemoAttendance {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  note?: string;
}

export const DEMO_SUBJECTS: DemoSubject[] = [
  { id: 'sub1', name: 'رياضيات', level: '3 ثانوي' },
  { id: 'sub2', name: 'فيزياء', level: '3 ثانوي' },
  { id: 'sub3', name: 'فرنسية', level: '3 ثانوي' },
  { id: 'sub4', name: 'إنجليزية', level: '3 ثانوي' },
  { id: 'sub5', name: 'عربية', level: '3 ثانوي' },
  { id: 'sub6', name: 'علوم', level: '3 ثانوي' },
  { id: 'sub7', name: 'رياضيات', level: '2 ثانوي' },
  { id: 'sub8', name: 'فيزياء', level: '2 ثانوي' },
  { id: 'sub9', name: 'فرنسية', level: '2 ثانوي' },
  { id: 'sub10', name: 'إنجليزية', level: '4 متوسط' },
  { id: 'sub11', name: 'عربية', level: '4 متوسط' },
  { id: 'sub12', name: 'رياضيات', level: '4 متوسط' },
];

export const DEMO_TEACHERS: DemoTeacher[] = [
  { id: 'tch1', name: 'أحمد بن علي', subjects: ['sub1', 'sub7', 'sub12'] },
  { id: 'tch2', name: 'فاطمة الزهراء كريم', subjects: ['sub2', 'sub8'] },
  { id: 'tch3', name: 'محمد بوزيد', subjects: ['sub3', 'sub9'] },
  { id: 'tch4', name: 'نادية مراد', subjects: ['sub4', 'sub10'] },
  { id: 'tch5', name: 'كريم حداد', subjects: ['sub5', 'sub11'] },
  { id: 'tch6', name: 'سارة بلقاسم', subjects: ['sub6'] },
];

export const DEMO_LEVELS = ['3 ثانوي', '2 ثانوي', '4 متوسط', '3 متوسط', '1 ثانوي'];

export const DEMO_SESSIONS: DemoSession[] = [
  // Sunday (0)
  { id: 's1', subjectId: 'sub1', subjectName: 'رياضيات', teacherId: 'tch1', teacherName: 'أحمد بن علي', institutionId: 'inst1', dayOfWeek: 0, startTime: '08:00', endTime: '09:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's2', subjectId: 'sub3', subjectName: 'فرنسية', teacherId: 'tch3', teacherName: 'محمد بوزيد', institutionId: 'inst1', dayOfWeek: 0, startTime: '09:30', endTime: '11:00', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's3', subjectId: 'sub6', subjectName: 'علوم', teacherId: 'tch6', teacherName: 'سارة بلقاسم', institutionId: 'inst1', dayOfWeek: 0, startTime: '11:00', endTime: '12:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's4', subjectId: 'sub7', subjectName: 'رياضيات', teacherId: 'tch1', teacherName: 'أحمد بن علي', institutionId: 'inst1', dayOfWeek: 0, startTime: '14:00', endTime: '15:30', status: 'SCHEDULED', level: '2 ثانوي', repeatType: 'WEEKLY' },

  // Monday (1)
  { id: 's5', subjectId: 'sub2', subjectName: 'فيزياء', teacherId: 'tch2', teacherName: 'فاطمة الزهراء كريم', institutionId: 'inst1', dayOfWeek: 1, startTime: '08:00', endTime: '09:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's6', subjectId: 'sub4', subjectName: 'إنجليزية', teacherId: 'tch4', teacherName: 'نادية مراد', institutionId: 'inst1', dayOfWeek: 1, startTime: '09:30', endTime: '11:00', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's7', subjectId: 'sub5', subjectName: 'عربية', teacherId: 'tch5', teacherName: 'كريم حداد', institutionId: 'inst1', dayOfWeek: 1, startTime: '11:00', endTime: '12:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's8', subjectId: 'sub8', subjectName: 'فيزياء', teacherId: 'tch2', teacherName: 'فاطمة الزهراء كريم', institutionId: 'inst1', dayOfWeek: 1, startTime: '14:00', endTime: '15:30', status: 'SCHEDULED', level: '2 ثانوي', repeatType: 'WEEKLY' },

  // Tuesday (2)
  { id: 's9', subjectId: 'sub5', subjectName: 'عربية', teacherId: 'tch5', teacherName: 'كريم حداد', institutionId: 'inst1', dayOfWeek: 2, startTime: '08:00', endTime: '09:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's10', subjectId: 'sub1', subjectName: 'رياضيات', teacherId: 'tch1', teacherName: 'أحمد بن علي', institutionId: 'inst1', dayOfWeek: 2, startTime: '09:30', endTime: '11:00', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's11', subjectId: 'sub3', subjectName: 'فرنسية', teacherId: 'tch3', teacherName: 'محمد بوزيد', institutionId: 'inst1', dayOfWeek: 2, startTime: '14:00', endTime: '15:30', status: 'SCHEDULED', level: '2 ثانوي', repeatType: 'WEEKLY' },
  { id: 's12', subjectId: 'sub12', subjectName: 'رياضيات', teacherId: 'tch1', teacherName: 'أحمد بن علي', institutionId: 'inst1', dayOfWeek: 2, startTime: '15:30', endTime: '17:00', status: 'SCHEDULED', level: '4 متوسط', repeatType: 'WEEKLY' },

  // Wednesday (3)
  { id: 's13', subjectId: 'sub4', subjectName: 'إنجليزية', teacherId: 'tch4', teacherName: 'نادية مراد', institutionId: 'inst1', dayOfWeek: 3, startTime: '08:00', endTime: '09:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's14', subjectId: 'sub6', subjectName: 'علوم', teacherId: 'tch6', teacherName: 'سارة بلقاسم', institutionId: 'inst1', dayOfWeek: 3, startTime: '09:30', endTime: '11:00', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's15', subjectId: 'sub2', subjectName: 'فيزياء', teacherId: 'tch2', teacherName: 'فاطمة الزهراء كريم', institutionId: 'inst1', dayOfWeek: 3, startTime: '11:00', endTime: '12:30', status: 'CANCELLED', level: '3 ثانوي', repeatType: 'WEEKLY', cancelReason: 'إجازة مرضية للأستاذ' },
  { id: 's16', subjectId: 'sub10', subjectName: 'إنجليزية', teacherId: 'tch4', teacherName: 'نادية مراد', institutionId: 'inst1', dayOfWeek: 3, startTime: '14:00', endTime: '15:30', status: 'SCHEDULED', level: '4 متوسط', repeatType: 'WEEKLY' },

  // Thursday (4)
  { id: 's17', subjectId: 'sub1', subjectName: 'رياضيات', teacherId: 'tch1', teacherName: 'أحمد بن علي', institutionId: 'inst1', dayOfWeek: 4, startTime: '08:00', endTime: '09:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's18', subjectId: 'sub5', subjectName: 'عربية', teacherId: 'tch5', teacherName: 'كريم حداد', institutionId: 'inst1', dayOfWeek: 4, startTime: '09:30', endTime: '11:00', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's19', subjectId: 'sub2', subjectName: 'فيزياء', teacherId: 'tch2', teacherName: 'فاطمة الزهراء كريم', institutionId: 'inst1', dayOfWeek: 4, startTime: '14:00', endTime: '15:30', status: 'SCHEDULED', level: '3 ثانوي', repeatType: 'WEEKLY' },
  { id: 's20', subjectId: 'sub11', subjectName: 'عربية', teacherId: 'tch5', teacherName: 'كريم حداد', institutionId: 'inst1', dayOfWeek: 4, startTime: '15:30', endTime: '17:00', status: 'SCHEDULED', level: '4 متوسط', repeatType: 'WEEKLY' },
];

export const DEMO_STUDENTS: DemoStudent[] = [
  // 3 ثانوي
  { id: 'stu1', name: 'ياسين حمادي', level: '3 ثانوي' },
  { id: 'stu2', name: 'مريم بلقاسم', level: '3 ثانوي' },
  { id: 'stu3', name: 'عمر بوزيد', level: '3 ثانوي' },
  { id: 'stu4', name: 'أمينة حداد', level: '3 ثانوي' },
  { id: 'stu5', name: 'يوسف مراد', level: '3 ثانوي' },
  { id: 'stu6', name: 'حسناء بن علي', level: '3 ثانوي' },
  { id: 'stu7', name: 'خالد ناصري', level: '3 ثانوي' },
  { id: 'stu8', name: 'سلمى جلول', level: '3 ثانوي' },
  { id: 'stu9', name: 'إسلام طاهري', level: '3 ثانوي' },
  { id: 'stu10', name: 'نسرين عباس', level: '3 ثانوي' },
  // 2 ثانوي
  { id: 'stu11', name: 'أيمن شريف', level: '2 ثانوي' },
  { id: 'stu12', name: 'ليلى بوعلام', level: '2 ثانوي' },
  { id: 'stu13', name: 'رائد مقراني', level: '2 ثانوي' },
  { id: 'stu14', name: 'هدى بن ناصر', level: '2 ثانوي' },
  { id: 'stu15', name: 'فارس حمداني', level: '2 ثانوي' },
  // 4 متوسط
  { id: 'stu16', name: 'ريم زروقي', level: '4 متوسط' },
  { id: 'stu17', name: 'عادل بوعزة', level: '4 متوسط' },
  { id: 'stu18', name: 'إيناس خليفي', level: '4 متوسط' },
  { id: 'stu19', name: 'مهدي صالحي', level: '4 متوسط' },
  { id: 'stu20', name: 'لينا عيسي', level: '4 متوسط' },
];

export const DEMO_ABSENCES: DemoAbsence[] = [
  { id: 'abs1', studentId: 'stu1', studentName: 'ياسين حمادي', sessionId: 's1', subjectName: 'رياضيات', reason: 'مرض', absenceType: 'STUDENT', notificationSent: true, createdAt: '2026-05-11T08:00:00Z', sessionDay: 0, sessionTime: '08:00' },
  { id: 'abs2', studentId: 'stu5', studentName: 'يوسف مراد', sessionId: 's2', subjectName: 'فرنسية', reason: 'ظرف عائلي', absenceType: 'STUDENT', notificationSent: true, createdAt: '2026-05-11T09:30:00Z', sessionDay: 0, sessionTime: '09:30' },
  { id: 'abs3', studentId: 'stu8', studentName: 'سلمى جلول', sessionId: 's5', subjectName: 'فيزياء', reason: '', absenceType: 'STUDENT', notificationSent: false, createdAt: '2026-05-12T08:00:00Z', sessionDay: 1, sessionTime: '08:00' },
  { id: 'abs4', teacherId: 'tch2', teacherName: 'فاطمة الزهراء كريم', sessionId: 's15', subjectName: 'فيزياء', reason: 'إجازة مرضية', absenceType: 'TEACHER', notificationSent: true, createdAt: '2026-05-13T11:00:00Z', sessionDay: 3, sessionTime: '11:00' },
  { id: 'abs5', studentId: 'stu3', studentName: 'عمر بوزيد', sessionId: 's9', subjectName: 'عربية', reason: 'تأخر', absenceType: 'STUDENT', notificationSent: true, createdAt: '2026-05-13T08:00:00Z', sessionDay: 2, sessionTime: '08:00' },
  { id: 'abs6', studentId: 'stu10', studentName: 'نسرين عباس', sessionId: 's13', subjectName: 'إنجليزية', reason: 'مرض', absenceType: 'STUDENT', notificationSent: false, createdAt: '2026-05-14T08:00:00Z', sessionDay: 3, sessionTime: '08:00' },
  { id: 'abs7', studentId: 'stu6', studentName: 'حسناء بن علي', sessionId: 's17', subjectName: 'رياضيات', reason: '', absenceType: 'STUDENT', notificationSent: true, createdAt: '2026-05-10T08:00:00Z', sessionDay: 4, sessionTime: '08:00' },
  { id: 'abs8', teacherId: 'tch5', teacherName: 'كريم حداد', sessionId: 's7', subjectName: 'عربية', reason: 'ظرف طارئ', absenceType: 'TEACHER', notificationSent: true, createdAt: '2026-05-12T11:00:00Z', sessionDay: 1, sessionTime: '11:00' },
];

export const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const TIME_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
export const HOUR_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
