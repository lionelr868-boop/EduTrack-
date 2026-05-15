import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 بدء ملء قاعدة البيانات ببيانات تجريبية واقعية...');

  // Clean existing data
  await db.studentActivity.deleteMany();
  await db.invoiceLineItem.deleteMany();
  await db.invoice.deleteMany();
  await db.attendance.deleteMany();
  await db.absence.deleteMany();
  await db.notification.deleteMany();
  await db.report.deleteMany();
  await db.pricing.deleteMany();
  await db.payment.deleteMany();
  await db.landingContent.deleteMany();
  await db.session.deleteMany();
  await db.student.deleteMany();
  await db.section.deleteMany();
  await db.year.deleteMany();
  await db.teacher.deleteMany();
  await db.parent.deleteMany();
  await db.user.deleteMany();
  await db.subject.deleteMany();
  await db.institution.deleteMany();

  // ========================
  // 1. Create Institutions
  // ========================
  const institutions = await Promise.all([
    db.institution.create({
      data: {
        name: 'مدرسة النور الخاصة',
        address: 'شارع ديدوش مراد، الجزائر العاصمة',
        phone: '0555123456',
        subscriptionPlan: 'PREMIUM',
      },
    }),
    db.institution.create({
      data: {
        name: 'مركز الأمل للدعم المدرسي',
        address: 'حي باب الوادي، الجزائر العاصمة',
        phone: '0555789012',
        subscriptionPlan: 'BASIC',
      },
    }),
    db.institution.create({
      data: {
        name: 'أكاديمية الفجر',
        address: 'شارع الاستقلال، وهران',
        phone: '0555345678',
        subscriptionPlan: 'PREMIUM',
      },
    }),
    db.institution.create({
      data: {
        name: 'معهد الحكمة',
        address: 'شارع العربي بن مهيدي، قسنطينة',
        phone: '0555456789',
        subscriptionPlan: 'BASIC',
      },
    }),
  ]);

  console.log(`✅ تم إنشاء ${institutions.length} مؤسسة تعليمية`);

  // ========================
  // 2. Create Subjects per institution
  // ========================
  const subjectDefs = [
    { name: 'الرياضيات', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'الفيزياء', levels: ['متوسط', 'ثانوي'] },
    { name: 'العلوم الطبيعية', levels: ['متوسط', 'ثانوي'] },
    { name: 'اللغة العربية', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'اللغة الفرنسية', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'اللغة الإنجليزية', levels: ['متوسط', 'ثانوي'] },
    { name: 'الفلسفة', levels: ['ثانوي'] },
    { name: 'التاريخ والجغرافيا', levels: ['متوسط', 'ثانوي'] },
    { name: 'التربية الإسلامية', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'علوم الطبيعة والحياة', levels: ['متوسط', 'ثانوي'] },
  ];

  const allSubjects: Array<{ id: string; name: string; level: string; institutionId: string }> = [];
  for (const institution of institutions) {
    for (const subjDef of subjectDefs) {
      for (const level of subjDef.levels) {
        const subject = await db.subject.create({
          data: {
            name: subjDef.name,
            level,
            institutionId: institution.id,
          },
        });
        allSubjects.push(subject);

        await db.pricing.create({
          data: {
            subjectId: subject.id,
            level,
            pricePerSession: level === 'ابتدائي' ? 300 : level === 'متوسط' ? 400 : 500,
            institutionId: institution.id,
          },
        });
      }
    }
  }

  console.log(`✅ تم إنشاء ${allSubjects.length} مادة دراسية`);

  // ========================
  // 3. Create Years per institution
  // ========================
  const yearDefinitions = [
    // ابتدائي
    { name: 'السنة الأولى ابتدائي', level: 'ابتدائي', order: 1 },
    { name: 'السنة الثانية ابتدائي', level: 'ابتدائي', order: 2 },
    { name: 'السنة الثالثة ابتدائي', level: 'ابتدائي', order: 3 },
    { name: 'السنة الرابعة ابتدائي', level: 'ابتدائي', order: 4 },
    { name: 'السنة الخامسة ابتدائي', level: 'ابتدائي', order: 5 },
    // متوسط
    { name: 'السنة الأولى متوسط', level: 'متوسط', order: 1 },
    { name: 'السنة الثانية متوسط', level: 'متوسط', order: 2 },
    { name: 'السنة الثالثة متوسط', level: 'متوسط', order: 3 },
    { name: 'السنة الرابعة متوسط', level: 'متوسط', order: 4 },
    // ثانوي
    { name: 'السنة الأولى ثانوي', level: 'ثانوي', order: 1 },
    { name: 'السنة الثانية ثانوي', level: 'ثانوي', order: 2 },
    { name: 'السنة الثالثة ثانوي', level: 'ثانوي', order: 3 },
  ];

  const allYears: Array<{ id: string; name: string; level: string; order: number; institutionId: string }> = [];
  for (const institution of institutions) {
    for (const yearDef of yearDefinitions) {
      const year = await db.year.create({
        data: {
          name: yearDef.name,
          level: yearDef.level,
          order: yearDef.order,
          institutionId: institution.id,
        },
      });
      allYears.push(year);
    }
  }

  console.log(`✅ تم إنشاء ${allYears.length} سنة دراسية`);

  // ========================
  // 4. Create Directors
  // ========================
  const directorNames = ['أسماء بن عمر', 'كريم بوزيد', 'فاطمة زهراء مراد', 'عبد الرحمن حداد'];
  const directors = [];
  for (let i = 0; i < institutions.length; i++) {
    const user = await db.user.create({
      data: {
        name: directorNames[i],
        email: `director${i + 1}@edutrack.dz`,
        password: 'hashed_demo123',
        role: 'DIRECTOR',
        institutionId: institutions[i].id,
      },
    });
    directors.push(user);
  }

  console.log(`✅ تم إنشاء ${directors.length} مدير مؤسسة`);

  // ========================
  // 4b. Create System Admin
  // ========================
  const adminUser = await db.user.create({
    data: {
      name: 'مدير النظام',
      email: 'admin@edutrack.dz',
      password: 'hashed_demo123',
      role: 'ADMIN',
      institutionId: institutions[0].id, // Workaround: all users need an institutionId
    },
  });

  console.log(`✅ تم إنشاء مستخدم مدير النظام: ${adminUser.email}`);

  // ========================
  // 5. Create Teachers (one subject, one level each)
  // ========================
  const teacherData = [
    // Institution 1 teachers
    { name: 'أحمد منصوري', subject: 'الرياضيات', level: 'متوسط' },
    { name: 'نادية بلحاج', subject: 'الفيزياء', level: 'ثانوي' },
    { name: 'ياسين خلفي', subject: 'اللغة العربية', level: 'ابتدائي' },
    { name: 'سمية غازي', subject: 'اللغة الفرنسية', level: 'متوسط' },
    { name: 'عمر بن ناصر', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { name: 'حنان زروقي', subject: 'التربية الإسلامية', level: 'متوسط' },
    { name: 'كمال بوطالب', subject: 'التاريخ والجغرافيا', level: 'ثانوي' },
    { name: 'مريم بلقاسمي', subject: 'اللغة الإنجليزية', level: 'متوسط' },
    // Institution 2 teachers
    { name: 'فتحي بوعكاز', subject: 'الرياضيات', level: 'ثانوي' },
    { name: 'إيمان حمداني', subject: 'الفيزياء', level: 'متوسط' },
    { name: 'نبيل شريف', subject: 'اللغة العربية', level: 'متوسط' },
    { name: 'رابحة مهداوي', subject: 'علوم الطبيعة والحياة', level: 'ثانوي' },
    { name: 'طارق بن عمر', subject: 'الفلسفة', level: 'ثانوي' },
    { name: 'زهرة بوعزيز', subject: 'اللغة الفرنسية', level: 'ابتدائي' },
    { name: 'عدنان لحمر', subject: 'التربية الإسلامية', level: 'ابتدائي' },
    { name: 'سلمى بوزيدية', subject: 'اللغة الإنجليزية', level: 'ثانوي' },
    // Institution 3 teachers
    { name: 'محمد بوجمعة', subject: 'الرياضيات', level: 'ابتدائي' },
    { name: 'آمال حبشي', subject: 'اللغة العربية', level: 'ثانوي' },
    { name: 'رضا مقراني', subject: 'الفيزياء', level: 'متوسط' },
    { name: 'ليندة عيسوي', subject: 'التاريخ والجغرافيا', level: 'متوسط' },
    { name: 'جمال بلعربي', subject: 'العلوم الطبيعية', level: 'متوسط' },
    { name: 'حنيفة زيتوني', subject: 'اللغة الفرنسية', level: 'ثانوي' },
    // Institution 4 teachers
    { name: 'كريم بن داود', subject: 'الرياضيات', level: 'متوسط' },
    { name: 'سمير بوزيت', subject: 'اللغة العربية', level: 'ابتدائي' },
    { name: 'أمينة خليفي', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { name: 'بلال مراد', subject: 'التربية الإسلامية', level: 'ثانوي' },
  ];

  const teachers: Array<{ id: string; userId: string; institutionId: string; level: string; subjectId: string }> = [];
  let teacherIdx = 0;

  for (let i = 0; i < institutions.length; i++) {
    const instTeachers = teacherData.filter((_, idx) => {
      // Assign teachers to institutions (8, 8, 6, 4)
      if (i === 0) return idx < 8;
      if (i === 1) return idx >= 8 && idx < 16;
      if (i === 2) return idx >= 16 && idx < 22;
      return idx >= 22;
    });

    for (const td of instTeachers) {
      const subject = allSubjects.find(
        (s) => s.institutionId === institutions[i].id && s.name === td.subject && s.level === td.level
      );
      if (!subject) continue;

      const user = await db.user.create({
        data: {
          name: td.name,
          email: `teacher${teacherIdx + 1}@edutrack.dz`,
          password: 'hashed_demo123',
          role: 'TEACHER',
          institutionId: institutions[i].id,
        },
      });

      const teacher = await db.teacher.create({
        data: {
          userId: user.id,
          institutionId: institutions[i].id,
          level: td.level,
          subjectId: subject.id,
          phone: `0555${String(teacherIdx + 200000).slice(-6)}`,
        },
      });

      teachers.push(teacher);
      teacherIdx++;
    }
  }

  console.log(`✅ تم إنشاء ${teachers.length} أستاذ (كل أستاذ مادة واحدة في طور واحد)`);

  // ========================
  // 6. Create Sections per year
  // ========================
  const sectionNames = ['قسم أ', 'قسم ب', 'قسم ج'];
  const allSections: Array<{ id: string; name: string; yearId: string; institutionId: string; supervisorId: string | null }> = [];

  for (const institution of institutions) {
    const instYears = allYears.filter((y) => y.institutionId === institution.id);
    const instTeachers = teachers.filter((t) => t.institutionId === institution.id);

    for (const year of instYears) {
      // 1-2 sections per year
      const numSections = year.order <= 2 ? 2 : 1;
      for (let s = 0; s < numSections; s++) {
        // Assign a teacher from the same level as supervisor
        const levelTeacher = instTeachers.find((t) => t.level === year.level);
        const supervisorId = levelTeacher?.id || null;

        const section = await db.section.create({
          data: {
            name: sectionNames[s],
            yearId: year.id,
            institutionId: institution.id,
            capacity: 25 + Math.floor(Math.random() * 10),
            supervisorId,
          },
        });
        allSections.push(section);
      }
    }
  }

  console.log(`✅ تم إنشاء ${allSections.length} قسم دراسي`);

  // ========================
  // 7. Create Parents and Students (assigned to sections)
  // ========================
  const parentNames = [
    'خالد بوعكاز', 'محمد العربي', 'سعيد مرابط', 'عبد الله بن حمزة',
    'إبراهيم خليفي', 'مصطفى بلحاج', 'عبد الكريم زروال', 'رابح حداد',
    'لطيف بوعزيز', 'ناصر بلقاسم', 'محمد شريف', 'أحمد فرحات',
    'يوسف خلفي', 'علي غازي', 'حسن بن ناصر', 'عمر زروقي',
    'فتحي بوطالب', 'مختار بلقاسمي', 'رشيد بوعكاز', 'سالم مهداوي',
    'عبد المجيد بوزيد', 'محمد أمين حداد', 'كريم مرابط', 'عمر شريف',
    'ياسين بن عمر', 'سيد أحمد خليفي', 'نبيل غازي', 'مصعب بوعزيز',
    'إسلام بلقاسمي', 'أيمن مهداوي',
  ];

  const studentNamesList = [
    'أمينة خالد', 'يوسف محمد', 'فاطمة سعيد', 'أحمد عبد الله',
    'مريم إبراهيم', 'ياسين مصطفى', 'سارة عبد الكريم', 'عمر رابح',
    'نادية لطيف', 'كريم ناصر', 'هدى محمد', 'علي أحمد',
    'لينا يوسف', 'محمد علي', 'أسماء حسن', 'بلال عمر',
    'زهرة فتحي', 'أيوب مختار', 'إنعام رشيد', 'سلمى سالم',
    'رياض خالد', 'حنان محمد العربي', 'توفيق سعيد', 'إيمان عبد الله',
    'نبيل إبراهيم', 'سلمى مصطفى', 'أحمد عبد الكريم', 'ياسمين رابح',
    'عبد الرحمن لطيف', 'مريم ناصر', 'محمد أمين محمد', 'فاطمة الزهراء أحمد',
    'خالد علي', 'نور يوسف', 'صفية حسن', 'مروان عمر',
    'آية فتحي', 'يوسف مختار', 'دانة رشيد', 'عبد المالك سالم',
    'ريم خالد', 'أسماء سعيد مرابط', 'عدنان عبد الله', 'لمياء إبراهيم',
    'أحمد رضا مصطفى', 'سارة عبد الكريم', 'عمار رابح', 'بنيسة لطيف',
    'وليد خالد', 'حنين محمد العربي', 'باسم سعيد', 'دارين عبد الله',
    'عبد الرحمن إبراهيم', 'أمال مصطفى', 'محمد أمين عبد الكريم',
    'سلمى رابح', 'أيمن لطيف', 'إسراء ناصر', 'أسماء محمد',
  ];

  const parents: Array<{ id: string; userId: string }> = [];
  const students: Array<{ id: string; name: string; level: string; institutionId: string; sectionId: string | null; parentId: string | null }> = [];
  let parentIdx = 0;
  let studentNameIdx = 0;

  for (const institution of institutions) {
    const instSections = allSections.filter((s) => s.institutionId === institution.id);

    // Distribute students across sections
    for (const section of instSections) {
      const year = allYears.find((y) => y.id === section.yearId);
      if (!year) continue;

      const studentsPerSection = 4 + Math.floor(Math.random() * 6); // 4-9 students per section

      for (let s = 0; s < studentsPerSection && studentNameIdx < studentNamesList.length; s++) {
        // Create parent (1 parent per student for simplicity, some share)
        let parentId: string | null = null;
        if (parentIdx < parentNames.length) {
          const parentUser = await db.user.create({
            data: {
              name: parentNames[parentIdx],
              email: `parent${parentIdx + 1}@edutrack.dz`,
              password: 'hashed_demo123',
              role: 'PARENT',
              institutionId: institution.id,
            },
          });
          const parent = await db.parent.create({
            data: {
              userId: parentUser.id,
              phone: `0555${String(parentIdx + 300000).slice(-6)}`,
            },
          });
          parents.push(parent);
          parentId = parent.id;
          parentIdx++;
        }

        const student = await db.student.create({
          data: {
            name: studentNamesList[studentNameIdx],
            level: year.level,
            parentId,
            institutionId: institution.id,
            sectionId: section.id,
            enrollmentDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          },
        });
        students.push(student);
        studentNameIdx++;
      }
    }
  }

  console.log(`✅ تم إنشاء ${parents.length} ولي أمر و ${students.length} تلميذ`);

  // ========================
  // 8. Create Sessions (linked to sections for timetable)
  // ========================
  const daysOfWeek = [0, 1, 2, 3, 4]; // Sunday to Thursday
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
  ];

  const sessions: Array<{ id: string; subjectId: string; teacherId: string; institutionId: string; sectionId: string | null; dayOfWeek: number; startTime: string; endTime: string; level: string }> = [];

  for (const institution of institutions) {
    const instTeachers = teachers.filter((t) => t.institutionId === institution.id);
    const instSections = allSections.filter((s) => s.institutionId === institution.id);

    for (const section of instSections) {
      const year = allYears.find((y) => y.id === section.yearId);
      if (!year) continue;

      // Get teachers for this level
      const levelTeachers = instTeachers.filter((t) => t.level === year.level);

      // Each section gets sessions for each subject available at its level
      // Typically 3-5 sessions per week per section
      const sectionSubjects = [...new Map(levelTeachers.map(t => {
        const subj = allSubjects.find(s => s.id === t.subjectId);
        return subj ? [subj.name, subj] : null;
      }).filter(Boolean)).values()] as Array<{ id: string; name: string; level: string; institutionId: string }>;

      // Schedule 4-6 sessions per section per week
      const sessionsPerSection = Math.min(6, Math.max(4, sectionSubjects.length));
      let slotIdx = 0;

      for (let s = 0; s < sessionsPerSection && s < levelTeachers.length; s++) {
        const teacher = levelTeachers[s % levelTeachers.length];
        const subject = allSubjects.find((sub) => sub.id === teacher.subjectId);
        if (!subject) continue;

        // Avoid time conflicts - different slot per session
        const day = daysOfWeek[slotIdx % daysOfWeek.length];
        const time = timeSlots[Math.floor(slotIdx / daysOfWeek.length) % timeSlots.length];
        slotIdx++;

        const session = await db.session.create({
          data: {
            subjectId: subject.id,
            teacherId: teacher.id,
            institutionId: institution.id,
            sectionId: section.id,
            dayOfWeek: day,
            startTime: time.start,
            endTime: time.end,
            level: year.level,
            repeatType: 'WEEKLY',
            status: 'SCHEDULED',
          },
        });
        sessions.push(session);
      }
    }
  }

  console.log(`✅ تم إنشاء ${sessions.length} حصة أسبوعية`);

  // ========================
  // 9. Create Attendances & Absences (past 7 days)
  // ========================
  let attendanceCount = 0;
  let absenceCount = 0;
  const today = new Date();

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - dayOffset);
    const dayOfWeek = sessionDate.getDay();

    const daySessions = sessions.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const session of daySessions) {
      if (!session.sectionId) continue;

      const sectionStudents = students.filter(
        (st) => st.sectionId === session.sectionId
      );

      for (const student of sectionStudents) {
        const rand = Math.random();
        if (rand < 0.85) {
          await db.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status: 'PRESENT',
            },
          });
          attendanceCount++;
        } else if (rand < 0.95) {
          await db.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status: 'ABSENT',
            },
          });
          await db.absence.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              absenceType: 'STUDENT',
              reason: Math.random() > 0.5 ? 'مرضي' : undefined,
              notificationSent: Math.random() > 0.3,
            },
          });
          absenceCount++;
        } else {
          await db.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status: 'LATE',
            },
          });
          attendanceCount++;
        }
      }
    }
  }

  // Teacher absences
  for (let i = 0; i < 3; i++) {
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    if (!randomSession) continue;
    await db.absence.create({
      data: {
        teacherId: randomSession.teacherId,
        sessionId: randomSession.id,
        absenceType: 'TEACHER',
        reason: 'ظرف عائلي',
        notificationSent: true,
      },
    });
    absenceCount++;
  }

  console.log(`✅ تم إنشاء ${attendanceCount} سجل حضور و ${absenceCount} سجل غياب`);

  // ========================
  // 10. Create Student Activities
  // ========================
  const activityTypes = ['HOMEWORK', 'EXAM', 'QUIZ', 'PARTICIPATION', 'BEHAVIOR', 'NOTE'];
  const activityTitles: Record<string, string[]> = {
    HOMEWORK: ['واجب منزلي - تمارين', 'واجب منزلي - بحث', 'بحث فردي', 'تمارين تطبيقية'],
    EXAM: ['امتحان الفصل الأول', 'امتحان الفصل الثاني', 'اختبار شهري', 'فرض محروس'],
    QUIZ: ['اختبار قصير', 'مسابقة سريعة', 'اختبار معلومات'],
    PARTICIPATION: ['مشاركة في القسم', 'عرض شفوي', 'مناقشة جماعية'],
    BEHAVIOR: ['سلوك ممتاز', 'انضباط في الحصة', 'تشجيع الزملاء'],
    NOTE: ['ملاحظة إيجابية', 'يتحسن تدريجياً', 'يحتاج مزيد من الجهد', 'مستوى جيد'],
  };

  let activityCount = 0;
  for (const session of sessions.slice(0, Math.min(sessions.length, 60))) {
    if (!session.sectionId) continue;
    const sectionStudents = students.filter((st) => st.sectionId === session.sectionId);
    if (sectionStudents.length === 0) continue;

    // Add 1-3 activities per session
    const numActivities = 1 + Math.floor(Math.random() * 3);
    for (let a = 0; a < numActivities; a++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const titles = activityTitles[type];
      const title = titles[Math.floor(Math.random() * titles.length)];
      // Apply to a random subset of students
      const numStudents = Math.min(sectionStudents.length, 2 + Math.floor(Math.random() * 4));
      const selectedStudents = sectionStudents.sort(() => Math.random() - 0.5).slice(0, numStudents);

      for (const student of selectedStudents) {
        const maxGrade = type === 'EXAM' ? 20 : type === 'QUIZ' ? 10 : type === 'HOMEWORK' ? 20 : null;
        const grade = maxGrade ? Math.round((maxGrade * (0.4 + Math.random() * 0.55)) * 2) / 2 : null;

        await db.studentActivity.create({
          data: {
            studentId: student.id,
            teacherId: session.teacherId,
            sessionId: session.id,
            sectionId: session.sectionId,
            type,
            title: `${title} - ${allSubjects.find(s => s.id === session.subjectId)?.name || ''}`,
            grade,
            maxGrade,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
        activityCount++;
      }
    }
  }

  console.log(`✅ تم إنشاء ${activityCount} نشاط طالب`);

  // ========================
  // 11. Create Invoices
  // ========================
  let invoiceCount = 0;
  let totalRevenue = 0;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (const student of students) {
    const pricePerSession = student.level === 'ابتدائي' ? 300 : student.level === 'متوسط' ? 400 : 500;

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const invoiceMonth = currentMonth - monthOffset;
      const invoiceYear = invoiceMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = ((invoiceMonth % 12) + 12) % 12;

      const totalSessions = 4 + Math.floor(Math.random() * 5);
      const absentSessions = Math.floor(Math.random() * Math.min(3, totalSessions));
      const compensatedSessions = Math.floor(Math.random() * Math.min(absentSessions, 2));
      const amount = (totalSessions - absentSessions + compensatedSessions) * pricePerSession;

      let status: 'PAID' | 'PENDING' | 'OVERDUE';
      if (monthOffset === 0) {
        status = Math.random() > 0.4 ? 'PAID' : 'PENDING';
      } else if (monthOffset === 1) {
        status = Math.random() > 0.2 ? 'PAID' : 'OVERDUE';
      } else {
        status = Math.random() > 0.1 ? 'PAID' : 'OVERDUE';
      }

      const paidAt = status === 'PAID'
        ? new Date(invoiceYear, adjustedMonth, 15 + Math.floor(Math.random() * 15))
        : null;

      const invoice = await db.invoice.create({
        data: {
          studentId: student.id,
          institutionId: student.institutionId,
          month: adjustedMonth + 1,
          year: invoiceYear,
          totalSessions,
          absentSessions,
          compensatedSessions,
          amount,
          status,
          paidAt,
          paymentMethod: status === 'PAID' ? (Math.random() > 0.5 ? 'CASH' : 'CCP') : null,
        },
      });

      // Create line items
      const studentSubject = allSubjects.find(
        (s) => s.institutionId === student.institutionId && s.level === student.level
      );
      if (studentSubject) {
        await db.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            subjectName: studentSubject.name,
            totalSessions,
            absentSessions,
            pricePerSession,
            subtotal: amount,
          },
        });
      }

      if (status === 'PAID') {
        totalRevenue += amount;
      }
      invoiceCount++;
    }
  }

  console.log(`✅ تم إنشاء ${invoiceCount} فاتورة (إجمالي الإيرادات: ${totalRevenue.toLocaleString()} دج)`);

  // ========================
  // 12. Create Notifications (real and meaningful)
  // ========================
  let notificationCount = 0;

  // Notifications for directors
  for (const director of directors) {
    const directorNotifs = [
      { title: 'غياب تلميذ', message: 'تم تسجيل غياب أمين حسين عن حصة الرياضيات اليوم', type: 'ABSENCE', link: 'director-absences' },
      { title: 'فاتورة مدفوعة', message: 'تم دفع فاتورة ياسين مراد بمبلغ 4,800 دج', type: 'INVOICE', link: 'director-billing' },
      { title: 'طلب غياب أستاذ', message: 'الأستاذ أحمد منصوري طلب إذن غياب ليوم الخميس', type: 'GENERAL', link: 'director-teachers' },
      { title: 'حصة تعويضية', message: 'تم جدولة حصة تعويضية للفيزياء يوم الخميس الساعة 10:00', type: 'CANCELLATION', link: 'director-schedule' },
      { title: 'تلميذ جديد', message: 'تم تسجيل زينب شريف في قسم 3 متوسط أ', type: 'SYSTEM', link: 'director-students' },
      { title: 'فواتير متأخرة', message: 'تذكير: 5 فواتير متأخرة هذا الشهر تحتاج متابعة', type: 'INVOICE', link: 'director-billing' },
      { title: 'تقرير شهري', message: 'تقرير الشهر الماضي جاهز للتحميل والمراجعة', type: 'SYSTEM', link: 'director-reports' },
      { title: 'نشاط جديد', message: 'الأستاذ كمال بوطالب أضاف نشاط امتحان لقسم 3 ثانوي', type: 'ACTIVITY', link: 'director-students' },
    ];

    for (const notif of directorNotifs) {
      await db.notification.create({
        data: {
          userId: director.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
          read: Math.random() > 0.4,
        },
      });
      notificationCount++;
    }
  }

  // Notifications for teachers
  for (const teacher of teachers.slice(0, 8)) {
    const teacherUser = await db.user.findUnique({ where: { id: teacher.userId } });
    if (!teacherUser) continue;

    const teacherNotifs = [
      { title: 'حصة قادمة', message: 'لديك حصة الرياضيات اليوم في الساعة 10:00 لقسم 2 متوسط أ', type: 'GENERAL' },
      { title: 'غياب تلميذ', message: 'التلميذ سارة بلقاسم غاب عن حصتك اليوم', type: 'ABSENCE' },
      { title: 'حصة ملغاة', message: 'حصة يوم الخميس تم إلغاؤها بسبب عطلة رسمية', type: 'CANCELLATION' },
    ];

    for (const notif of teacherNotifs) {
      await db.notification.create({
        data: {
          userId: teacherUser.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: Math.random() > 0.5,
        },
      });
      notificationCount++;
    }
  }

  // Notifications for parents
  for (const parent of parents.slice(0, 10)) {
    const parentUser = await db.user.findUnique({ where: { id: parent.userId } });
    if (!parentUser) continue;

    const parentNotifs = [
      { title: 'غياب ابنك', message: 'تم تسجيل غياب ابنك عن حصة الرياضيات اليوم', type: 'ABSENCE' },
      { title: 'فاتورة جديدة', message: 'فاتورة جديدة تم إنشاؤها لشهر الحالي', type: 'INVOICE' },
      { title: 'نشاط دراسي', message: 'حصل ابنك على 16/20 في اختبار الفيزياء', type: 'ACTIVITY' },
    ];

    for (const notif of parentNotifs) {
      await db.notification.create({
        data: {
          userId: parentUser.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: Math.random() > 0.3,
        },
      });
      notificationCount++;
    }
  }

  console.log(`✅ تم إنشاء ${notificationCount} إشعار`);

  // ========================
  // 13. Create Reports
  // ========================
  let reportCount = 0;
  for (const institution of institutions) {
    for (let m = 0; m < 3; m++) {
      const reportMonth = currentMonth - m;
      const reportYear = reportMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = ((reportMonth % 12) + 12) % 12;

      const instStudents = students.filter((s) => s.institutionId === institution.id);
      const instTeachers = teachers.filter((t) => t.institutionId === institution.id);
      const instInvoices = await db.invoice.count({
        where: {
          institutionId: institution.id,
          month: adjustedMonth + 1,
          year: reportYear,
        },
      });

      await db.report.create({
        data: {
          institutionId: institution.id,
          type: 'MONTHLY',
          data: JSON.stringify({
            month: adjustedMonth + 1,
            year: reportYear,
            totalStudents: instStudents.length,
            totalTeachers: instTeachers.length,
            totalInvoices: instInvoices,
            summary: `تقرير شهري لشهر ${adjustedMonth + 1}/${reportYear}`,
          }),
        },
      });
      reportCount++;
    }
  }

  console.log(`✅ تم إنشاء ${reportCount} تقرير`);

  // ========================
  // 14. Create Payments
  // ========================
  const paymentsData = [
    {
      institutionId: institutions[0].id,
      amount: 15000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2025-001',
      notes: 'اشتراك سنوي برومزي',
      paidAt: new Date(2025, 0, 15),
      dueDate: new Date(2025, 0, 1),
    },
    {
      institutionId: institutions[1].id,
      amount: 5000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'PENDING',
      paymentMethod: 'BARIDIMOB',
      transactionRef: 'BAR-2025-002',
      notes: 'اشتراك نصفي أساسي - بانتظار التأكيد',
      paidAt: null,
      dueDate: new Date(2025, 2, 1),
    },
    {
      institutionId: institutions[2].id,
      amount: 15000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'BANK-2025-003',
      notes: 'تحويل بنكي - اشتراك سنوي برومزي',
      paidAt: new Date(2025, 1, 10),
      dueDate: new Date(2025, 1, 1),
    },
    {
      institutionId: institutions[3].id,
      amount: 5000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'FAILED',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2025-004',
      notes: 'فشل عملية الدفع - رصيد غير كافٍ',
      paidAt: null,
      dueDate: new Date(2025, 3, 1),
    },
    {
      institutionId: institutions[0].id,
      amount: 8000,
      plan: 'PREMIUM',
      periodMonths: 6,
      status: 'PENDING',
      paymentMethod: null,
      transactionRef: null,
      notes: 'تجديد اشتراك برومزي - لم يتم الدفع بعد',
      paidAt: null,
      dueDate: new Date(2025, 5, 1),
    },
    {
      institutionId: institutions[2].id,
      amount: 3000,
      plan: 'BASIC',
      periodMonths: 3,
      status: 'FAILED',
      paymentMethod: 'CASH',
      transactionRef: null,
      notes: 'دفع نقدي غير مكتمل',
      paidAt: null,
      dueDate: new Date(2025, 4, 1),
    },
  ];

  for (const paymentData of paymentsData) {
    await db.payment.create({ data: paymentData });
  }

  console.log(`✅ تم إنشاء ${paymentsData.length} سجل دفع`);

  // ========================
  // 15. Create Landing Content
  // ========================
  const landingContentData = [
    {
      section: 'hero',
      title: 'إديوتراك - منصة إدارة المؤسسات التعليمية',
      subtitle: 'الحل الأمثل لإدارة مدارسكم ومراكز الدعم المدرسي بكل سهولة وكفاءة',
      content: JSON.stringify({
        ctaText: 'ابدأ مجاناً',
        ctaLink: '/register',
        secondaryCtaText: 'شاهد العرض التوضيحي',
        secondaryCtaLink: '#features',
        backgroundImage: null,
      }),
      enabled: true,
      order: 1,
    },
    {
      section: 'features',
      title: 'مميزات المنصة',
      subtitle: 'كل ما تحتاجه لإدارة مؤسستك التعليمية في مكان واحد',
      content: JSON.stringify([
        { icon: 'users', title: 'إدارة التلاميذ', description: 'تسجيل ومتابعة التلاميذ وإدارة أقسامهم وبياناتهم' },
        { icon: 'calendar', title: 'جدولة الحصص', description: 'تنظيم الجدول الزمني وإدارة الحصص الأسبوعية بسهولة' },
        { icon: 'clipboard-check', title: 'تتبع الحضور والغياب', description: 'تسجيل الحضور والغياب مع إشعار أولياء الأمور تلقائياً' },
        { icon: 'receipt', title: 'الفواتير والمدفوعات', description: 'إنشاء الفواتير وتتبع المدفوعات وإدارة الفواتير المتأخرة' },
        { icon: 'message-circle', title: 'التواصل الفوري', description: 'تواصل مباشر بين الأساتذة وأولياء الأمور والإدارة' },
        { icon: 'bar-chart', title: 'التقارير والإحصائيات', description: 'تقارير مفصلة وإحصائيات شاملة لمتابعة أداء المؤسسة' },
      ]),
      enabled: true,
      order: 2,
    },
    {
      section: 'pricing',
      title: 'خطط الاشتراك',
      subtitle: 'اختر الخطة المناسبة لمؤسستكم',
      content: JSON.stringify([
        {
          name: 'مجاني',
          plan: 'FREE',
          price: 0,
          period: 'شهري',
          features: ['حتى 50 تلميذ', 'مدير واحد', 'إدارة أساسية', 'تقارير محدودة'],
          highlighted: false,
        },
        {
          name: 'أساسي',
          plan: 'BASIC',
          price: 2500,
          period: 'شهري',
          features: ['حتى 200 تلميذ', '5 أساتذة', 'إدارة كاملة', 'تقارير مفصلة', 'إشعارات بالبريد'],
          highlighted: false,
        },
        {
          name: 'برومزي',
          plan: 'PREMIUM',
          price: 5000,
          period: 'شهري',
          features: ['تلاميذ غير محدودين', 'أساتذة غير محدودين', 'جميع المميزات', 'تقارير متقدمة', 'إشعارات SMS وبريد', 'دعم فني أولوي', 'API متقدم'],
          highlighted: true,
        },
      ]),
      enabled: true,
      order: 3,
    },
    {
      section: 'testimonials',
      title: 'ماذا يقول عملاؤنا',
      subtitle: 'آراء مديري المؤسسات التعليمية الذين يثقون بنا',
      content: JSON.stringify([
        { name: 'أسماء بن عمر', role: 'مديرة مدرسة النور الخاصة', text: 'إديوتراك غيّر طريقة إدارتنا للمدرسة بالكامل. الآن نتابع كل شيء بسهولة.', rating: 5 },
        { name: 'كريم بوزيد', role: 'مدير مركز الأمل', text: 'نظام الفواتير والحضور وفّر لنا ساعات من العمل اليومي. أنصح به بشدة.', rating: 5 },
        { name: 'فاطمة زهراء مراد', role: 'مديرة أكاديمية الفجر', text: 'التواصل مع أولياء الأمور أصبح أسهل بكثير. المنصة ساعدتنا كثيراً.', rating: 4 },
      ]),
      enabled: true,
      order: 4,
    },
    {
      section: 'stats',
      title: 'أرقامنا تتحدث',
      subtitle: 'نفتخر بثقة مئات المؤسسات التعليمية في الجزائر',
      content: JSON.stringify([
        { label: 'مؤسسة تعليمية', value: '500+', icon: 'school' },
        { label: 'تلميذ مسجل', value: '50,000+', icon: 'graduation-cap' },
        { label: 'أستاذ نشط', value: '2,000+', icon: 'chalkboard-teacher' },
        { label: 'فاتورة معالجة', value: '100,000+', icon: 'file-text' },
      ]),
      enabled: true,
      order: 5,
    },
    {
      section: 'footer',
      title: 'إديوتراك',
      subtitle: 'منصة إدارة المؤسسات التعليمية في الجزائر',
      content: JSON.stringify({
        links: [
          { label: 'الرئيسية', href: '/' },
          { label: 'المميزات', href: '#features' },
          { label: 'الأسعار', href: '#pricing' },
          { label: 'اتصل بنا', href: '/contact' },
        ],
        social: [
          { platform: 'facebook', url: 'https://facebook.com/edutrack.dz' },
          { platform: 'instagram', url: 'https://instagram.com/edutrack.dz' },
        ],
        contactEmail: 'contact@edutrack.dz',
        contactPhone: '0555-000-000',
        copyright: '© 2025 إديوتراك. جميع الحقوق محفوظة.',
      }),
      enabled: true,
      order: 6,
    },
  ];

  for (const contentData of landingContentData) {
    await db.landingContent.create({ data: contentData });
  }

  console.log(`✅ تم إنشاء ${landingContentData.length} محتوى صفحة الهبوط`);

  // Final Summary
  console.log('\n========================================');
  console.log('🎉 تم ملء قاعدة البيانات بنجاح!');
  console.log('========================================');
  console.log(`📊 المؤسسات: ${institutions.length}`);
  console.log(`👨‍🏫 الأساتذة: ${teachers.length} (كل أستاذ مادة واحدة)`);
  console.log(`👨‍👩‍👧‍👦 أولياء الأمور: ${parents.length}`);
  console.log(`🎓 التلاميذ: ${students.length}`);
  console.log(`📚 المواد الدراسية: ${allSubjects.length}`);
  console.log(`📅 السنوات: ${allYears.length}`);
  console.log(`🏫 الأقسام: ${allSections.length}`);
  console.log(`📋 الحصص الأسبوعية: ${sessions.length}`);
  console.log(`📝 الأنشطة: ${activityCount}`);
  console.log(`💰 الفواتير: ${invoiceCount}`);
  console.log(`💵 إجمالي الإيرادات: ${totalRevenue.toLocaleString()} دج`);
  console.log(`🔔 الإشعارات: ${notificationCount}`);
  console.log(`📋 التقارير: ${reportCount}`);
  console.log(`💳 المدفوعات: ${paymentsData.length}`);
  console.log(`📄 محتوى صفحة الهبوط: ${landingContentData.length}`);
  console.log('========================================');
  console.log('\n🔑 بيانات الدخول التجريبية:');
  console.log('  مدير النظام: admin@edutrack.dz / demo123');
  console.log('  مدير مؤسسة: director1@edutrack.dz / demo123');
  console.log('  أستاذ: teacher1@edutrack.dz / demo123');
  console.log('  ولي أمر: parent1@edutrack.dz / demo123');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ:', e);
    await db.$disconnect();
    process.exit(1);
  });
