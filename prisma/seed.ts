import { db } from '../src/lib/db';
import { hash } from 'crypto';

// Simple hash function for passwords (since bcrypt may not be available in seed)
function simpleHash(str: string): string {
  // For demo purposes only - in production use bcrypt
  return `hashed_${str}`;
}

async function main() {
  console.log('🌱 Seeding EduTrack database...');

  // Clean existing data
  await db.pricing.deleteMany();
  await db.notification.deleteMany();
  await db.report.deleteMany();
  await db.invoice.deleteMany();
  await db.attendance.deleteMany();
  await db.absence.deleteMany();
  await db.teacherSubject.deleteMany();
  await db.session.deleteMany();
  await db.student.deleteMany();
  await db.parent.deleteMany();
  await db.teacher.deleteMany();
  await db.subject.deleteMany();
  await db.user.deleteMany();
  await db.institution.deleteMany();

  // Create Institution
  const institution = await db.institution.create({
    data: {
      id: 'inst_1',
      name: 'معهد النجاح التعليمي',
      address: 'شارع الاستقلال، الجزائر العاصمة',
      phone: '0555123456',
      logo: null,
      subscriptionPlan: 'PREMIUM',
    },
  });

  // Create Director
  const director = await db.user.create({
    data: {
      id: 'user_director',
      name: 'أحمد بن علي',
      email: 'director@edutrack.dz',
      password: simpleHash('password123'),
      role: 'DIRECTOR',
      institutionId: institution.id,
    },
  });

  // Create Subjects
  const subjects = await Promise.all([
    db.subject.create({ data: { id: 'sub_math', name: 'الرياضيات', level: 'ثانوي', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_physics', name: 'الفيزياء', level: 'ثانوي', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_french', name: 'الفرنسية', level: 'ثانوي', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_english', name: 'الإنجليزية', level: 'ثانوي', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_arabic', name: 'اللغة العربية', level: 'ثانوي', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_math_m', name: 'الرياضيات', level: 'متوسط', institutionId: institution.id } }),
    db.subject.create({ data: { id: 'sub_physics_m', name: 'العلوم', level: 'متوسط', institutionId: institution.id } }),
  ]);

  // Create Teachers
  const teachers = [];
  const teacherData = [
    { id: 'teacher_1', name: 'محمد العربي', email: 'teacher1@edutrack.dz', subjectIds: ['sub_math', 'sub_math_m'] },
    { id: 'teacher_2', name: 'فاطمة الزهراء', email: 'teacher2@edutrack.dz', subjectIds: ['sub_physics', 'sub_physics_m'] },
    { id: 'teacher_3', name: 'كريم بوزيد', email: 'teacher3@edutrack.dz', subjectIds: ['sub_french', 'sub_english'] },
  ];

  for (const td of teacherData) {
    const user = await db.user.create({
      data: {
        id: `user_${td.id}`,
        name: td.name,
        email: td.email,
        password: simpleHash('password123'),
        role: 'TEACHER',
        institutionId: institution.id,
      },
    });

    const teacher = await db.teacher.create({
      data: {
        id: td.id,
        userId: user.id,
        institutionId: institution.id,
      },
    });

    // Link teacher to subjects
    for (const subjectId of td.subjectIds) {
      await db.teacherSubject.create({
        data: { teacherId: teacher.id, subjectId },
      });
    }

    teachers.push(teacher);
  }

  // Create Parents
  const parents = [];
  const parentNames = [
    { id: 'parent_1', name: 'عبد الله حسين', email: 'parent1@edutrack.dz', phone: '0555111222' },
    { id: 'parent_2', name: 'نادية مراد', email: 'parent2@edutrack.dz', phone: '0555333444' },
    { id: 'parent_3', name: 'سعيد بلقاسم', email: 'parent3@edutrack.dz', phone: '0555555666' },
    { id: 'parent_4', name: 'خديجة عمران', email: 'parent4@edutrack.dz', phone: '0555777888' },
    { id: 'parent_5', name: 'يوسف حمداني', email: 'parent5@edutrack.dz', phone: '0555999000' },
  ];

  for (const pd of parentNames) {
    const user = await db.user.create({
      data: {
        id: `user_${pd.id}`,
        name: pd.name,
        email: pd.email,
        password: simpleHash('password123'),
        role: 'PARENT',
        institutionId: institution.id,
      },
    });

    const parent = await db.parent.create({
      data: {
        id: pd.id,
        userId: user.id,
        phone: pd.phone,
      },
    });

    parents.push(parent);
  }

  // Create Students
  const studentNames = [
    { name: 'أمين حسين', level: 'ثانوي', parentId: 'parent_1' },
    { name: 'سارة حسين', level: 'متوسط', parentId: 'parent_1' },
    { name: 'ياسين مراد', level: 'ثانوي', parentId: 'parent_2' },
    { name: 'ليلى مراد', level: 'ثانوي', parentId: 'parent_2' },
    { name: 'أيمن بلقاسم', level: 'متوسط', parentId: 'parent_3' },
    { name: 'هدى بلقاسم', level: 'ثانوي', parentId: 'parent_3' },
    { name: 'عمر عمران', level: 'ثانوي', parentId: 'parent_4' },
    { name: 'ريم عمران', level: 'متوسط', parentId: 'parent_4' },
    { name: 'فهد حمداني', level: 'ثانوي', parentId: 'parent_5' },
    { name: 'نور حمداني', level: 'ثانوي', parentId: 'parent_5' },
    { name: 'زينب شريف', level: 'ثانوي', parentId: null },
    { name: 'بلال شريف', level: 'متوسط', parentId: null },
    { name: 'مريم عادل', level: 'ثانوي', parentId: null },
    { name: 'إبراهيم عادل', level: 'ثانوي', parentId: null },
    { name: 'دانة كمال', level: 'متوسط', parentId: null },
    { name: 'عبد الرحمن كمال', level: 'ثانوي', parentId: null },
    { name: 'حنان فارس', level: 'ثانوي', parentId: null },
    { name: 'سمير فارس', level: 'متوسط', parentId: null },
    { name: 'لمياء جلال', level: 'ثانوي', parentId: null },
    { name: 'طه جلال', level: 'ثانوي', parentId: null },
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const sn = studentNames[i];
    const student = await db.student.create({
      data: {
        name: sn.name,
        level: sn.level,
        parentId: sn.parentId,
        institutionId: institution.id,
      },
    });
    students.push(student);
  }

  // Create Sessions (Weekly schedule)
  const sessionTemplates = [
    { dayOfWeek: 0, startTime: '08:00', endTime: '09:30', subjectId: 'sub_math', teacherId: 'teacher_1', level: 'ثانوي' },
    { dayOfWeek: 0, startTime: '10:00', endTime: '11:30', subjectId: 'sub_physics', teacherId: 'teacher_2', level: 'ثانوي' },
    { dayOfWeek: 0, startTime: '14:00', endTime: '15:30', subjectId: 'sub_french', teacherId: 'teacher_3', level: 'ثانوي' },
    { dayOfWeek: 1, startTime: '08:00', endTime: '09:30', subjectId: 'sub_arabic', teacherId: 'teacher_1', level: 'ثانوي' },
    { dayOfWeek: 1, startTime: '10:00', endTime: '11:30', subjectId: 'sub_english', teacherId: 'teacher_3', level: 'ثانوي' },
    { dayOfWeek: 1, startTime: '14:00', endTime: '15:30', subjectId: 'sub_math', teacherId: 'teacher_1', level: 'متوسط' },
    { dayOfWeek: 2, startTime: '08:00', endTime: '09:30', subjectId: 'sub_physics', teacherId: 'teacher_2', level: 'ثانوي' },
    { dayOfWeek: 2, startTime: '10:00', endTime: '11:30', subjectId: 'sub_math', teacherId: 'teacher_1', level: 'ثانوي' },
    { dayOfWeek: 2, startTime: '14:00', endTime: '15:30', subjectId: 'sub_french', teacherId: 'teacher_3', level: 'متوسط' },
    { dayOfWeek: 3, startTime: '08:00', endTime: '09:30', subjectId: 'sub_english', teacherId: 'teacher_3', level: 'ثانوي' },
    { dayOfWeek: 3, startTime: '10:00', endTime: '11:30', subjectId: 'sub_arabic', teacherId: 'teacher_1', level: 'متوسط' },
    { dayOfWeek: 3, startTime: '14:00', endTime: '15:30', subjectId: 'sub_physics_m', teacherId: 'teacher_2', level: 'متوسط' },
    { dayOfWeek: 4, startTime: '08:00', endTime: '09:30', subjectId: 'sub_math', teacherId: 'teacher_1', level: 'ثانوي' },
    { dayOfWeek: 4, startTime: '10:00', endTime: '11:30', subjectId: 'sub_physics', teacherId: 'teacher_2', level: 'متوسط' },
    { dayOfWeek: 4, startTime: '14:00', endTime: '15:30', subjectId: 'sub_french', teacherId: 'teacher_3', level: 'ثانوي' },
  ];

  const sessions = [];
  for (const tmpl of sessionTemplates) {
    const session = await db.session.create({
      data: {
        ...tmpl,
        status: 'SCHEDULED',
        institutionId: institution.id,
      },
    });
    sessions.push(session);
  }

  // Create Invoices for last month
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  for (const student of students) {
    const totalSessions = Math.floor(Math.random() * 8) + 8; // 8-15 sessions
    const absentSessions = Math.floor(Math.random() * 3); // 0-2 absences
    const compensatedSessions = Math.floor(Math.random() * 2); // 0-1 compensated
    const pricePerSession = student.level === 'ثانوي' ? 800 : 600;
    const amount = (totalSessions - absentSessions + compensatedSessions) * pricePerSession;

    await db.invoice.create({
      data: {
        studentId: student.id,
        institutionId: institution.id,
        month: lastMonth,
        year: lastMonthYear,
        totalSessions,
        absentSessions,
        compensatedSessions,
        amount,
        status: Math.random() > 0.3 ? 'PAID' : (Math.random() > 0.5 ? 'PENDING' : 'OVERDUE'),
        paidAt: Math.random() > 0.3 ? new Date(lastMonthYear, lastMonth - 1, Math.floor(Math.random() * 28) + 1) : null,
        paymentMethod: Math.random() > 0.3 ? 'CASH' : null,
      },
    });
  }

  // Create some absences
  const absenceReasons = ['غياب غير مبرر', 'مرض', 'ظرف عائلي', 'تأخر'];
  for (let i = 0; i < 8; i++) {
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    await db.absence.create({
      data: {
        studentId: randomStudent.id,
        sessionId: randomSession.id,
        reason: absenceReasons[Math.floor(Math.random() * absenceReasons.length)],
        absenceType: 'STUDENT',
        notificationSent: Math.random() > 0.3,
      },
    });
  }

  // Teacher absences
  await db.absence.create({
    data: {
      teacherId: 'teacher_2',
      sessionId: sessions[1].id,
      reason: 'مرض',
      absenceType: 'TEACHER',
      notificationSent: true,
    },
  });

  // Create Notifications
  const notificationsData = [
    { userId: 'user_director', message: '3 تلاميذ غابوا اليوم ولم يُبلَّغ أولياؤهم', type: 'ABSENCE' },
    { userId: 'user_director', message: '5 فواتير متأخرة هذا الشهر', type: 'INVOICE' },
    { userId: 'user_director', message: 'تم تسجيل حضور حصة الرياضيات بنجاح', type: 'GENERAL' },
    { userId: 'user_parent_1', message: 'تم تسجيل غياب ابنكم أمين عن حصة الفيزياء', type: 'ABSENCE' },
    { userId: 'user_parent_2', message: 'فاتورة شهر يناير معلقة الدفع', type: 'INVOICE' },
    { userId: 'user_teacher_1', message: 'لم يتم تسجيل حضور حصة 08:00 بعد', type: 'GENERAL' },
    { userId: 'user_parent_3', message: 'حصة العلوم ملغاة يوم الأحد القادم', type: 'CANCELLATION' },
  ];

  for (const n of notificationsData) {
    await db.notification.create({ data: n });
  }

  // Create Pricing
  const pricingData = [
    { subjectId: 'sub_math', level: 'ثانوي', pricePerSession: 800, institutionId: institution.id },
    { subjectId: 'sub_physics', level: 'ثانوي', pricePerSession: 800, institutionId: institution.id },
    { subjectId: 'sub_french', level: 'ثانوي', pricePerSession: 700, institutionId: institution.id },
    { subjectId: 'sub_english', level: 'ثانوي', pricePerSession: 700, institutionId: institution.id },
    { subjectId: 'sub_arabic', level: 'ثانوي', pricePerSession: 600, institutionId: institution.id },
    { subjectId: 'sub_math_m', level: 'متوسط', pricePerSession: 600, institutionId: institution.id },
    { subjectId: 'sub_physics_m', level: 'متوسط', pricePerSession: 600, institutionId: institution.id },
  ];

  for (const p of pricingData) {
    await db.pricing.create({ data: p });
  }

  // Create Reports
  await db.report.create({
    data: {
      institutionId: institution.id,
      type: 'MONTHLY',
      data: JSON.stringify({
        totalSessions: 120,
        completedSessions: 105,
        cancelledSessions: 8,
        compensatedSessions: 7,
        studentAttendanceRate: 89,
        teacherAttendanceRate: 95,
        revenue: 1560000,
        paidInvoices: 14,
        pendingInvoices: 4,
        overdueInvoices: 2,
      }),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Institution: ${institution.name}`);
  console.log(`👨‍💼 Director: ${director.name} (${director.email})`);
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`👨‍👩‍👧 Parents: ${parents.length}`);
  console.log(`🎓 Students: ${students.length}`);
  console.log(`📚 Subjects: ${subjects.length}`);
  console.log(`📅 Sessions: ${sessions.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
