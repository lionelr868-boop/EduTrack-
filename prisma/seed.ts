import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 بدء ملء قاعدة البيانات ببيانات تجريبية واقعية...');

  // Clean existing data
  await db.studentActivity.deleteMany();
  await db.invoiceLineItem.deleteMany();
  await db.invoice.deleteMany();
  await db.attendance.deleteMany();
  await db.absence.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
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
  // 1. Create 8 Institutions
  // ========================
  const institution1 = await db.institution.create({
    data: {
      name: 'مدرسة النور الخاصة',
      address: 'شارع ديدوش مراد، الجزائر العاصمة',
      phone: '0555123456',
      city: 'الجزائر العاصمة',
      wilaya: 'الجزائر',
      subscriptionPlan: 'PREMIUM',
      frozen: false,
      maxStudents: 500,
      subscriptionExpiresAt: new Date(2025, 11, 31),
      createdAt: new Date(2024, 6, 1),
    },
  });

  const institution2 = await db.institution.create({
    data: {
      name: 'مركز الأمل للدعم المدرسي',
      address: 'شارع العربي بن مهيدي، وهران',
      phone: '0555789012',
      city: 'وهران',
      wilaya: 'وهران',
      subscriptionPlan: 'BASIC',
      frozen: false,
      maxStudents: 200,
      subscriptionExpiresAt: new Date(2025, 8, 30),
      createdAt: new Date(2024, 7, 15),
    },
  });

  const institution3 = await db.institution.create({
    data: {
      name: 'أكاديمية الفجر',
      address: 'شارع الاستقلال، قسنطينة',
      phone: '0555345678',
      city: 'قسنطينة',
      wilaya: 'قسنطينة',
      subscriptionPlan: 'PREMIUM',
      frozen: false,
      maxStudents: 500,
      subscriptionExpiresAt: new Date(2026, 2, 15),
      createdAt: new Date(2024, 5, 10),
    },
  });

  const institution4 = await db.institution.create({
    data: {
      name: 'معهد الحكمة',
      address: 'شارع الأمير عبد القادر، البليدة',
      phone: '0555456789',
      city: 'البليدة',
      wilaya: 'البليدة',
      subscriptionPlan: 'BASIC',
      frozen: false,
      maxStudents: 200,
      subscriptionExpiresAt: new Date(2025, 5, 15),
      createdAt: new Date(2024, 8, 20),
    },
  });

  const institution5 = await db.institution.create({
    data: {
      name: 'مدرسة الأفق الجديد',
      address: 'شارع 8 ماي 1945، سطيف',
      phone: '0555567890',
      city: 'سطيف',
      wilaya: 'سطيف',
      subscriptionPlan: 'FREE',
      frozen: false,
      maxStudents: 50,
      createdAt: new Date(2024, 9, 5),
    },
  });

  const institution6 = await db.institution.create({
    data: {
      name: 'روضة الأمل',
      address: 'شارع محمد بوضياف، تلمسان',
      phone: '0555678901',
      city: 'تلمسان',
      wilaya: 'تلمسان',
      subscriptionPlan: 'BASIC',
      frozen: true,
      frozenAt: new Date(2025, 0, 15),
      frozenReason: 'عدم تجديد الاشتراك - تجاوز المدة المسموحة',
      maxStudents: 200,
      subscriptionExpiresAt: new Date(2025, 0, 1),
      createdAt: new Date(2024, 4, 22),
    },
  });

  const institution7 = await db.institution.create({
    data: {
      name: 'أكاديمية العلوم المتقدمة',
      address: 'شارع الثورة، عنابة',
      phone: '0555789012',
      city: 'عنابة',
      wilaya: 'عنابة',
      subscriptionPlan: 'PREMIUM',
      frozen: false,
      maxStudents: 500,
      subscriptionExpiresAt: new Date(2025, 10, 30),
      createdAt: new Date(2024, 3, 18),
    },
  });

  const institution8 = await db.institution.create({
    data: {
      name: 'مركز النجاح التعليمي',
      address: 'شارع 1 نوفمبر، باتنة',
      phone: '0555890123',
      city: 'باتنة',
      wilaya: 'باتنة',
      subscriptionPlan: 'PREMIUM',
      frozen: true,
      frozenAt: new Date(2025, 1, 10),
      frozenReason: 'عدم سداد رسوم الاشتراك لمدة شهرين متتاليين',
      maxStudents: 500,
      subscriptionExpiresAt: new Date(2024, 11, 31),
      createdAt: new Date(2024, 2, 5),
    },
  });

  const institutions = [institution1, institution2, institution3, institution4, institution5, institution6, institution7, institution8];

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
  const directorNames = [
    'أسماء بن عمر', 'كريم بوزيد', 'فاطمة زهراء مراد', 'عبد الرحمن حداد',
    'نادية بوعلام', 'محمد الصغير بن عمر', 'سارة محفوظي', 'عبد الباقي قاسمي',
  ];
  const directors = [];
  for (let i = 0; i < institutions.length; i++) {
    const user = await db.user.create({
      data: {
        name: directorNames[i],
        email: `director${i + 1}@edutrack.dz`,
        password: 'hashed_demo123',
        role: 'DIRECTOR',
        institutionId: institutions[i].id,
        createdAt: new Date(2024, 5 + i, 1 + i),
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
      createdAt: new Date(2024, 0, 1),
    },
  });

  console.log(`✅ تم إنشاء مستخدم مدير النظام: ${adminUser.email}`);

  // ========================
  // 5. Create Teachers (51 total across 8 institutions)
  // ========================
  const teacherData: Array<{ instIdx: number; name: string; subject: string; level: string }> = [
    // Institution 1: مدرسة النور الخاصة - 12 teachers
    { instIdx: 0, name: 'أحمد منصوري', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 0, name: 'نادية بلحاج', subject: 'الفيزياء', level: 'ثانوي' },
    { instIdx: 0, name: 'ياسين خلفي', subject: 'اللغة العربية', level: 'ابتدائي' },
    { instIdx: 0, name: 'سمية غازي', subject: 'اللغة الفرنسية', level: 'متوسط' },
    { instIdx: 0, name: 'عمر بن ناصر', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { instIdx: 0, name: 'حنان زروقي', subject: 'التربية الإسلامية', level: 'متوسط' },
    { instIdx: 0, name: 'كمال بوطالب', subject: 'التاريخ والجغرافيا', level: 'ثانوي' },
    { instIdx: 0, name: 'مريم بلقاسمي', subject: 'اللغة الإنجليزية', level: 'متوسط' },
    { instIdx: 0, name: 'طه بوجلال', subject: 'الرياضيات', level: 'ثانوي' },
    { instIdx: 0, name: 'خديجة مساعد', subject: 'اللغة العربية', level: 'متوسط' },
    { instIdx: 0, name: 'عبد القادر بلخير', subject: 'الفيزياء', level: 'متوسط' },
    { instIdx: 0, name: 'آمال شويخ', subject: 'علوم الطبيعة والحياة', level: 'ثانوي' },

    // Institution 2: مركز الأمل للدعم المدرسي - 6 teachers
    { instIdx: 1, name: 'فتحي بوعكاز', subject: 'الرياضيات', level: 'ثانوي' },
    { instIdx: 1, name: 'إيمان حمداني', subject: 'الفيزياء', level: 'متوسط' },
    { instIdx: 1, name: 'نبيل شريف', subject: 'اللغة العربية', level: 'متوسط' },
    { instIdx: 1, name: 'رابحة مهداوي', subject: 'علوم الطبيعة والحياة', level: 'ثانوي' },
    { instIdx: 1, name: 'طارق بن عمر', subject: 'الفلسفة', level: 'ثانوي' },
    { instIdx: 1, name: 'زهرة بوعزيز', subject: 'اللغة الفرنسية', level: 'متوسط' },

    // Institution 3: أكاديمية الفجر - 8 teachers
    { instIdx: 2, name: 'محمد بوجمعة', subject: 'الرياضيات', level: 'ابتدائي' },
    { instIdx: 2, name: 'آمال حبشي', subject: 'اللغة العربية', level: 'ثانوي' },
    { instIdx: 2, name: 'رضا مقراني', subject: 'الفيزياء', level: 'متوسط' },
    { instIdx: 2, name: 'ليندة عيسوي', subject: 'التاريخ والجغرافيا', level: 'متوسط' },
    { instIdx: 2, name: 'جمال بلعربي', subject: 'العلوم الطبيعية', level: 'متوسط' },
    { instIdx: 2, name: 'حنيفة زيتوني', subject: 'اللغة الفرنسية', level: 'ثانوي' },
    { instIdx: 2, name: 'نور الدين خليفي', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 2, name: 'صبرينة معمري', subject: 'التربية الإسلامية', level: 'ابتدائي' },

    // Institution 4: معهد الحكمة - 5 teachers
    { instIdx: 3, name: 'كريم بن داود', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 3, name: 'سمير بوزيت', subject: 'اللغة العربية', level: 'ابتدائي' },
    { instIdx: 3, name: 'أمينة خليفي', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { instIdx: 3, name: 'بلال مراد', subject: 'التربية الإسلامية', level: 'ثانوي' },
    { instIdx: 3, name: 'حسينة بوعكاز', subject: 'اللغة الفرنسية', level: 'متوسط' },

    // Institution 5: مدرسة الأفق الجديد - 3 teachers
    { instIdx: 4, name: 'عادل بوداود', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 4, name: 'فاطمة بن يوسف', subject: 'اللغة العربية', level: 'ابتدائي' },
    { instIdx: 4, name: 'يوسف حدادي', subject: 'الفيزياء', level: 'متوسط' },

    // Institution 6: روضة الأمل - 4 teachers (FROZEN)
    { instIdx: 5, name: 'محمد بوزيد', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 5, name: 'نجاة فرحات', subject: 'اللغة العربية', level: 'ابتدائي' },
    { instIdx: 5, name: 'عبد الله مرابط', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { instIdx: 5, name: 'سعاد بلحاج', subject: 'اللغة الفرنسية', level: 'متوسط' },

    // Institution 7: أكاديمية العلوم المتقدمة - 7 teachers
    { instIdx: 6, name: 'رشيد بن ناصر', subject: 'الرياضيات', level: 'ثانوي' },
    { instIdx: 6, name: 'ليلى حمداني', subject: 'الفيزياء', level: 'متوسط' },
    { instIdx: 6, name: 'عبد المجيد بوقرة', subject: 'اللغة العربية', level: 'ثانوي' },
    { instIdx: 6, name: 'حنان بلقاسم', subject: 'اللغة الإنجليزية', level: 'ثانوي' },
    { instIdx: 6, name: 'كمال زروال', subject: 'التاريخ والجغرافيا', level: 'ثانوي' },
    { instIdx: 6, name: 'أسماء مهداوي', subject: 'علوم الطبيعة والحياة', level: 'متوسط' },
    { instIdx: 6, name: 'نبيل بوعزيز', subject: 'التربية الإسلامية', level: 'متوسط' },

    // Institution 8: مركز النجاح التعليمي - 6 teachers (FROZEN)
    { instIdx: 7, name: 'صالح بوجلال', subject: 'الرياضيات', level: 'متوسط' },
    { instIdx: 7, name: 'نورة خليفي', subject: 'اللغة العربية', level: 'متوسط' },
    { instIdx: 7, name: 'خالد معمري', subject: 'الفيزياء', level: 'ثانوي' },
    { instIdx: 7, name: 'سمية زيتوني', subject: 'العلوم الطبيعية', level: 'ثانوي' },
    { instIdx: 7, name: 'إبراهيم حداد', subject: 'الفلسفة', level: 'ثانوي' },
    { instIdx: 7, name: 'مريم بلعربي', subject: 'اللغة الفرنسية', level: 'متوسط' },
  ];

  const teachers: Array<{ id: string; userId: string; institutionId: string; level: string; subjectId: string }> = [];
  let teacherIdx = 0;

  for (const td of teacherData) {
    const institution = institutions[td.instIdx];
    const subject = allSubjects.find(
      (s) => s.institutionId === institution.id && s.name === td.subject && s.level === td.level
    );
    if (!subject) continue;

    const user = await db.user.create({
      data: {
        name: td.name,
        email: `teacher${teacherIdx + 1}@edutrack.dz`,
        password: 'hashed_demo123',
        role: 'TEACHER',
        institutionId: institution.id,
        createdAt: new Date(2024, 6 + Math.floor(teacherIdx / 8), 1 + (teacherIdx % 28)),
      },
    });

    const teacher = await db.teacher.create({
      data: {
        userId: user.id,
        institutionId: institution.id,
        level: td.level,
        subjectId: subject.id,
        phone: `0555${String(teacherIdx + 200000).slice(-6)}`,
      },
    });

    teachers.push(teacher);
    teacherIdx++;
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
      // 1-2 sections per year (fewer sections for smaller institutions)
      const instIdx = institutions.indexOf(institution);
      const numSections = instIdx <= 2 ? (year.order <= 2 ? 2 : 1) : 1;
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
    // Parents for Institution 1 (~50 students)
    'خالد بوعكاز', 'محمد العربي', 'سعيد مرابط', 'عبد الله بن حمزة',
    'إبراهيم خليفي', 'مصطفى بلحاج', 'عبد الكريم زروال', 'رابح حداد',
    'لطيف بوعزيز', 'ناصر بلقاسم', 'محمد شريف', 'أحمد فرحات',
    'يوسف خلفي', 'علي غازي', 'حسن بن ناصر', 'عمر زروقي',
    'فتحي بوطالب', 'مختار بلقاسمي', 'رشيد بوعكاز', 'سالم مهداوي',
    'عبد المجيد بوزيد', 'محمد أمين حداد', 'كريم مرابط', 'عمر شريف',
    'ياسين بن عمر', 'سيد أحمد خليفي', 'نبيل غازي', 'مصعب بوعزيز',
    'إسلام بلقاسمي', 'أيمن مهداوي', 'جمال بوعلام', 'حسين مراد',
    'عبد الرحمن شريف', 'زين العابدين حداد', 'محمد بلال خليفي',
    'عبد الباسط بوزيت', 'شفيق بن داود', 'أنور بوجمعة', 'صالح محفوظي',
    'رابح بوعبدالله', 'سعيد حمداني', 'عادل خليفي', 'نذير بلحاج',
    'عبد الوهاب بوعزيز', 'محمد فاروق زروال', 'إياد غازي', 'محمد نبيل بوطالب',
    'خير الدين بن عمر', 'عبد العزيز قاسمي',
    // Parents for Institution 2 (~25 students)
    'رشيد بوعكاز', 'عبد النور بوزيد', 'محمد الحبيب حداد', 'جمال خليفي',
    'نبيل بوعزيز', 'فتحي بوعلام', 'عبد القادر بلقاسمي', 'محمد سعيد مرابط',
    'أحمد بوجلال', 'يوسف بن ناصر', 'مصطفى بوزيت', 'عبد الرحمن بن عمر',
    'محمد كمال شريف', 'إسماعيل غازي', 'أحمد بوعكاز', 'سعيد محفوظي',
    'عبد الهادي خليفي', 'محمد العربي بوزيد', 'رابح بن حمزة', 'لطيف حداد',
    'عبد الله بوعبدالله', 'ياسين بوعزيز', 'كريم بلحاج', 'عادل زروقي',
    'محمد أمين مهداوي',
    // Parents for Institution 3 (~35 students)
    'بدر الدين بوعكاز', 'عبد الناصر بوزيد', 'محمد بشير حداد', 'أحمد بوعلام',
    'فاروق خليفي', 'زكريا بوعزيز', 'عبد الحميد بلقاسمي', 'محمد رضا مرابط',
    'عبد الباري بوجلال', 'إبراهيم بن ناصر', 'محمد نبيل بوزيت', 'عبد الله شريف',
    'أحمد رضا بن عمر', 'نور الدين غازي', 'محمد أمين بوعكاز', 'عبد الرشيد محفوظي',
    'حاتم خليفي', 'عبد المجيد بوزيد', 'رشيد بن حمزة', 'محمد فاروق حداد',
    'سعيد بوعبدالله', 'عبد الكريم بوعزيز', 'محمد إسلام بلحاج', 'عبد الله زروقي',
    'محمد خالد مهداوي', 'أنس بوعكاز', 'عبد الرحمن بوزيد', 'محمد الحسين حداد',
    'عادل بوعلام', 'محمد ياسين خليفي', 'نذير بوعزيز', 'عبد المالك بلقاسمي',
    'محمد بدر مرابط', 'زين الدين بوجلال', 'محمد عبد الله بن ناصر',
    // Parents for Institution 4 (~20 students)
    'عبد الغني بوزيت', 'محمد الطيب شريف', 'أحمد صالح بن عمر',
    'عبد الرزاق غازي', 'محمد نبيل بوعكاز', 'كمال محفوظي',
    'عبد الحليم خليفي', 'محمد ناصر بوزيد', 'أحمد جمال حداد',
    'عبد الباقي بوعلام', 'محمد كريم بوعزيز', 'أحمد فتحي بلحاج',
    'عبد الواحد زروقي', 'محمد عادل مهداوي', 'أحمد بدر بن حمزة',
    'عبد الهادي بوعبدالله', 'محمد وحيد خليفي', 'أحمد نبيل بوعكاز',
    'عبد المؤمن بوزيت', 'محمد رشيد شريف',
    // Parents for Institution 5 (~15 students)
    'عبد القادر بن عمر', 'محمد أمين غازي', 'أحمد نبيل بوعكاز',
    'عبد الرحمن محفوظي', 'محمد جمال خليفي', 'أحمد فريد بوزيد',
    'عبد الباسط حداد', 'محمد عبد الرحمن بوعلام', 'أحمد سعيد بوعزيز',
    'عبد المجيد بلحاج', 'محمد يوسف زروقي', 'أحمد طارق مهداوي',
    'عبد الكريم بن حمزة', 'محمد خير الدين بوعبدالله', 'أحمد عادل بوزيت',
    // Parents for Institution 6 (~18 students)
    'عبد الناصر بوجلال', 'محمد الحبيب بن ناصر', 'أحمد رضا بوزيت',
    'عبد الله شريف', 'محمد بلال بوعكاز', 'أحمد فاروق غازي',
    'عبد الرشيد محفوظي', 'محمد إسلام خليفي', 'أحمد نذير بوزيد',
    'عبد الحميد حداد', 'محمد أمين بوعلام', 'أحمد عبد الباقي بوعزيز',
    'عبد المجيد زروقي', 'محمد نبيل بلحاج', 'أحمد خالد مهداوي',
    'عبد الكريم بن حمزة', 'محمد سعيد بوعبدالله', 'أحمد جمال بوزيت',
    // Parents for Institution 7 (~30 students)
    'عبد العزيز بوعكاز', 'محمد الحسين بوزيد', 'أحمد مصطفى حداد',
    'عبد الرحمن بوعلام', 'محمد عمار خليفي', 'أحمد كمال بوعزيز',
    'عبد الوهاب بلقاسمي', 'محمد نبيل مرابط', 'أحمد إبراهيم بوجلال',
    'عبد الهادي بن ناصر', 'محمد رضا بوزيت', 'أحمد سعيد شريف',
    'عبد الباري غازي', 'محمد بدر محفوظي', 'أحمد فتحي خليفي',
    'عبد المالك بوزيد', 'محمد جمال حداد', 'أحمد نبيل بوعلام',
    'عبد الحليم بوعزيز', 'محمد خالد بلحاج', 'أحمد عادل زروقي',
    'عبد القادر مهداوي', 'محمد أمين بن حمزة', 'أحمد طارق بوعبدالله',
    'عبد المجيد بوزيت', 'محمد يوسف بوعكاز', 'أحمد عبد الله غازي',
    'عبد الرشيد محفوظي', 'محمد إسلام خليفي', 'أحمد فريد بوزيد',
    // Parents for Institution 8 (~22 students)
    'عبد الغني بوجلال', 'محمد الطيب بن ناصر', 'أحمد صالح بوزيت',
    'عبد الرزاق شريف', 'محمد نبيل بوعكاز', 'أحمد جمال غازي',
    'عبد الحليم محفوظي', 'محمد كريم خليفي', 'أحمد فتحي بوزيد',
    'عبد الباقي حداد', 'محمد عادل بوعلام', 'أحمد نبيل بوعزيز',
    'عبد الواحد زروقي', 'محمد رشيد بلحاج', 'أحمد بدر مهداوي',
    'عبد الهادي بن حمزة', 'محمد وحيد بوعبدالله', 'أحمد طارق بوزيت',
    'عبد المؤمن بوعكاز', 'محمد ياسين غازي', 'أحمد سعيد محفوظي',
    'عبد الرحمن خليفي',
  ];

  const studentNamesList = [
    // Institution 1 students (~50)
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
    'وليد خالد', 'حنين محمد العربي',
    // Institution 2 students (~25)
    'بسمة رشيد', 'محمد أمين بوعكاز', 'زينب فتحي', 'عبد الرحمن نبيل',
    'ملاك سعيد', 'يوسف كريم', 'هدى عبد النور', 'أحمد جمال',
    'سارة بوزيد', 'علي محمد الحبيب', 'نور فتحي', 'ريم عبد القادر',
    'خالد أحمد', 'فاطمة محمد سعيد', 'عبد الله إبراهيم', 'مريم يوسف',
    'ياسين مصطفى', 'أسماء عبد الرحمن', 'عمر محمد كمال', 'لينا إسماعيل',
    'أحمد نبيل', 'سلمى أحمد', 'محمد بوعكاز', 'حنان فتحي', 'بلال نبيل',
    // Institution 3 students (~35)
    'عبد الرحمن بدر الدين', 'مريم عبد الناصر', 'أحمد محمد بشير',
    'فاطمة فاروق', 'يوسف زكريا', 'نور عبد الحميد', 'سارة محمد رضا',
    'علي عبد الباري', 'هدى إبراهيم', 'محمد عبد الله', 'أسماء أحمد رضا',
    'كريم نور الدين', 'ريم محمد أمين', 'عبد الرشيد حاتم', 'لينا عبد المجيد',
    'أحمد رشيد', 'ملاك سعيد', 'ياسين عبد الكريم', 'فاطمة محمد',
    'خالد محمد إسلام', 'سلمى عبد الله', 'عمر محمد خالد', 'نبيلة أنس',
    'عبد الرحمن محمد', 'زهرة محمد ياسين', 'أحمد نذير', 'مريم عبد المالك',
    'يوسف محمد بدر', 'نور زين الدين', 'سارة أحمد', 'علي محمد عبد الله',
    'هدى عبد الرزاق', 'محمد كريم', 'أسماء محمد نبيل', 'أحمد عبد الغني',
    // Institution 4 students (~20)
    'محمد الطيب', 'فاطمة عبد الغني', 'أحمد صالح', 'مريم عبد الرزاق',
    'يوسف محمد نبيل', 'سارة كمال', 'عبد الرحمن عبد الحليم', 'نور محمد ناصر',
    'هدى أحمد جمال', 'علي عبد الباقي', 'أسماء محمد كريم', 'خالد أحمد فتحي',
    'ريم عبد الواحد', 'محمد عبد الهادي', 'فاطمة محمد وحيد', 'أحمد نبيل',
    'مريم عبد المؤمن', 'يوسف عبد القادر', 'سارة محمد أمين', 'عمر أحمد عادل',
    // Institution 5 students (~15)
    'أحمد عبد القادر', 'مريم محمد أمين', 'يوسف أحمد نبيل',
    'فاطمة عبد الرحمن', 'محمد جمال', 'سارة أحمد فريد',
    'عبد الباسط محمد', 'نور أحمد سعيد', 'هدى عبد المجيد',
    'علي محمد يوسف', 'أسماء أحمد طارق', 'خالد عبد الكريم',
    'ريم محمد خير الدين', 'محمد أحمد عادل', 'فاطمة عبد الباقي',
    // Institution 6 students (~18)
    'أحمد عبد الناصر', 'مريم محمد الحبيب', 'يوسف أحمد رضا',
    'فاطمة عبد الله', 'محمد بلال', 'سارة أحمد فاروق',
    'عبد الرشيد محمد إسلام', 'نور أحمد نذير', 'هدى عبد الحميد',
    'علي محمد أمين', 'أسماء أحمد عبد الباقي', 'خالد عبد المجيد',
    'ريم أحمد خالد', 'محمد نبيل', 'فاطمة عبد الكريم',
    'أحمد محمد سعيد', 'مريم عبد المجيد', 'يوسف أحمد جمال',
    // Institution 7 students (~30)
    'أحمد عبد العزيز', 'مريم محمد الحسين', 'يوسف أحمد مصطفى',
    'فاطمة عبد الرحمن', 'محمد عمار', 'سارة أحمد كمال',
    'عبد الوهاب محمد نبيل', 'نور أحمد إبراهيم', 'هدى عبد الهادي',
    'علي محمد رضا', 'أسماء أحمد سعيد', 'خالد عبد الباري',
    'ريم أحمد فتحي', 'محمد عبد المالك', 'فاطمة أحمد نبيل',
    'عبد الحليم محمد جمال', 'مريم محمد خالد', 'يوسف أحمد عادل',
    'سارة عبد القادر', 'محمد أمين', 'نور أحمد طارق',
    'هدى عبد المجيد', 'علي محمد يوسف', 'أسماء أحمد عبد الله',
    'خالد عبد الرشيد', 'ريم محمد إسلام', 'محمد أحمد فريد',
    'فاطمة أحمد نبيل', 'عبد الرحمن محمد نبيل', 'مريم أحمد سعيد',
    // Institution 8 students (~22)
    'أحمد عبد الغني', 'مريم محمد الطيب', 'يوسف أحمد صالح',
    'فاطمة عبد الرزاق', 'محمد نبيل', 'سارة أحمد جمال',
    'عبد الحليم محمد كريم', 'نور أحمد فتحي', 'هدى عبد الباقي',
    'علي محمد عادل', 'أسماء أحمد نبيل', 'خالد عبد الواحد',
    'ريم محمد رشيد', 'محمد بدر', 'فاطمة أحمد نبيل',
    'عبد الهادي محمد وحيد', 'مريم أحمد طارق', 'يوسف عبد المؤمن',
    'سارة محمد ياسين', 'أحمد سعيد', 'نور عبد الرحمن', 'هدى محمد جمال',
  ];

  const parents: Array<{ id: string; userId: string }> = [];
  const students: Array<{ id: string; name: string; level: string; institutionId: string; sectionId: string | null; parentId: string | null }> = [];
  let parentIdx = 0;
  let studentNameIdx = 0;

  // Target students per institution
  const studentsPerInst = [50, 25, 35, 20, 15, 18, 30, 22];

  for (let instIdx = 0; instIdx < institutions.length; instIdx++) {
    const institution = institutions[instIdx];
    const instSections = allSections.filter((s) => s.institutionId === institution.id);
    const targetStudents = studentsPerInst[instIdx];

    // Calculate students per section
    const studentsPerSection = Math.max(2, Math.ceil(targetStudents / instSections.length));

    for (const section of instSections) {
      const year = allYears.find((y) => y.id === section.yearId);
      if (!year) continue;

      // How many students left for this institution
      const remainingTarget = targetStudents - students.filter(s => s.institutionId === institution.id).length;
      if (remainingTarget <= 0) break;

      const numStudents = Math.min(studentsPerSection, remainingTarget, studentNamesList.length - studentNameIdx);
      if (numStudents <= 0) break;

      for (let s = 0; s < numStudents; s++) {
        if (studentNameIdx >= studentNamesList.length || parentIdx >= parentNames.length) break;

        // Create parent
        const parentUser = await db.user.create({
          data: {
            name: parentNames[parentIdx],
            email: `parent${parentIdx + 1}@edutrack.dz`,
            password: 'hashed_demo123',
            role: 'PARENT',
            institutionId: institution.id,
            createdAt: new Date(2024, 6 + Math.floor(parentIdx / 30), 1 + (parentIdx % 28)),
          },
        });
        const parent = await db.parent.create({
          data: {
            userId: parentUser.id,
            phone: `0555${String(parentIdx + 300000).slice(-6)}`,
          },
        });
        parents.push(parent);

        const student = await db.student.create({
          data: {
            name: studentNamesList[studentNameIdx],
            level: year.level,
            parentId: parent.id,
            institutionId: institution.id,
            sectionId: section.id,
            enrollmentDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
            gender: Math.random() > 0.5 ? 'ذكر' : 'أنثى',
          },
        });
        students.push(student);
        parentIdx++;
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
    { start: '08:00', end: '09:30' },
    { start: '09:30', end: '11:00' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '15:30', end: '17:00' },
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

      // Schedule sessions for each teacher at this level
      let slotIdx = 0;
      for (const teacher of levelTeachers) {
        const subject = allSubjects.find((sub) => sub.id === teacher.subjectId);
        if (!subject) continue;

        // 1-2 sessions per teacher per section per week
        const sessionsForTeacher = Math.random() > 0.6 ? 2 : 1;
        for (let s = 0; s < sessionsForTeacher; s++) {
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
              createdAt: new Date(2024, 8, 1),
            },
          });
          sessions.push(session);
        }
      }
    }
  }

  console.log(`✅ تم إنشاء ${sessions.length} حصة أسبوعية`);

  // ========================
  // 9. Create Attendances & Absences (past 7 days - one week covers all weekly sessions)
  // ========================
  let attendanceCount = 0;
  let absenceCount = 0;
  const today = new Date();
  const createdAttendanceKeys = new Set<string>();

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
        // Skip if attendance already exists for this student-session pair
        const key = `${student.id}-${session.id}`;
        if (createdAttendanceKeys.has(key)) continue;

        const rand = Math.random();
        if (rand < 0.82) {
          await db.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status: 'PRESENT',
            },
          });
          attendanceCount++;
        } else if (rand < 0.93) {
          await db.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status: 'ABSENT',
            },
          });
          const reasons = ['مرضي', 'عائلي', 'شخصي', undefined];
          await db.absence.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              absenceType: 'STUDENT',
              reason: reasons[Math.floor(Math.random() * reasons.length)],
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
        createdAttendanceKeys.add(key);
      }
    }
  }

  // Teacher absences (more variety)
  const teacherAbsenceReasons = ['ظرف عائلي', 'مرضي', 'إجازة سنوية', 'تكوين مهني', undefined];
  for (let i = 0; i < 8; i++) {
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
    if (!randomSession) continue;
    await db.absence.create({
      data: {
        teacherId: randomSession.teacherId,
        sessionId: randomSession.id,
        absenceType: 'TEACHER',
        reason: teacherAbsenceReasons[Math.floor(Math.random() * teacherAbsenceReasons.length)],
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
  for (const session of sessions) {
    if (!session.sectionId) continue;
    const sectionStudents = students.filter((st) => st.sectionId === session.sectionId);
    if (sectionStudents.length === 0) continue;

    // Add 1-2 activities per session
    const numActivities = 1 + Math.floor(Math.random() * 2);
    for (let a = 0; a < numActivities; a++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const titles = activityTitles[type];
      const title = titles[Math.floor(Math.random() * titles.length)];
      // Apply to a random subset of students
      const numStudents = Math.min(sectionStudents.length, 2 + Math.floor(Math.random() * 4));
      const selectedStudents = [...sectionStudents].sort(() => Math.random() - 0.5).slice(0, numStudents);

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
            date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          },
        });
        activityCount++;
      }
    }
  }

  console.log(`✅ تم إنشاء ${activityCount} نشاط طالب`);

  // ========================
  // 11. Create Invoices (6 months of data for realistic charts)
  // ========================
  let invoiceCount = 0;
  let totalRevenue = 0;
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (const student of students) {
    const pricePerSession = student.level === 'ابتدائي' ? 300 : student.level === 'متوسط' ? 400 : 500;

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const invoiceMonth = currentMonth - monthOffset;
      const invoiceYear = invoiceMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = ((invoiceMonth % 12) + 12) % 12;

      const totalSessions = 4 + Math.floor(Math.random() * 5);
      const absentSessions = Math.floor(Math.random() * Math.min(3, totalSessions));
      const compensatedSessions = Math.floor(Math.random() * Math.min(absentSessions, 2));
      const amount = (totalSessions - absentSessions + compensatedSessions) * pricePerSession;

      let status: 'PAID' | 'PENDING' | 'OVERDUE';
      if (monthOffset === 0) {
        // Current month: mix of paid and pending
        const rand = Math.random();
        status = rand > 0.35 ? 'PAID' : 'PENDING';
      } else if (monthOffset === 1) {
        const rand = Math.random();
        status = rand > 0.15 ? 'PAID' : 'OVERDUE';
      } else if (monthOffset === 2) {
        const rand = Math.random();
        status = rand > 0.08 ? 'PAID' : 'OVERDUE';
      } else {
        // Older months: mostly paid
        const rand = Math.random();
        status = rand > 0.05 ? 'PAID' : 'OVERDUE';
      }

      const paidAt = status === 'PAID'
        ? new Date(invoiceYear, adjustedMonth, 15 + Math.floor(Math.random() * 15))
        : null;

      const paymentMethods = ['CASH', 'CCP', 'BARIDIMOB', 'BANK_TRANSFER'];
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
          paymentMethod: status === 'PAID' ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null,
          createdAt: new Date(invoiceYear, adjustedMonth, 1),
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
  // 12. Create Notifications (comprehensive for all user types)
  // ========================
  let notificationCount = 0;

  // Notifications for directors
  for (const director of directors) {
    const instIdx = directors.indexOf(director);
    const instName = institutions[instIdx].name;
    const directorNotifs = [
      { title: 'غياب تلميذ', message: `تم تسجيل غياب تلميذ عن حصة الرياضيات اليوم في ${instName}`, type: 'ABSENCE', link: 'director-absences' },
      { title: 'فاتورة مدفوعة', message: `تم دفع فاتورة بمبلغ 4,800 دج في ${instName}`, type: 'INVOICE', link: 'director-billing' },
      { title: 'طلب غياب أستاذ', message: 'أحد الأساتذة طلب إذن غياب ليوم الخميس', type: 'GENERAL', link: 'director-teachers' },
      { title: 'حصة تعويضية', message: 'تم جدولة حصة تعويضية للفيزياء يوم الخميس الساعة 10:00', type: 'CANCELLATION', link: 'director-schedule' },
      { title: 'تلميذ جديد', message: 'تم تسجيل تلميذ جديد في المؤسسة', type: 'SYSTEM', link: 'director-students' },
      { title: 'فواتير متأخرة', message: `تذكير: هناك فواتير متأخرة هذا الشهر في ${instName}`, type: 'INVOICE', link: 'director-billing' },
      { title: 'تقرير شهري', message: 'تقرير الشهر الماضي جاهز للتحميل والمراجعة', type: 'SYSTEM', link: 'director-reports' },
      { title: 'نشاط جديد', message: 'أحد الأساتذة أضاف نشاط امتحان لقسم', type: 'ACTIVITY', link: 'director-students' },
      { title: 'تنبيه اشتراك', message: 'اشتراك المؤسسة يقترب من الانتهاء', type: 'SYSTEM', link: 'director-settings' },
      { title: 'إحصائيات الأسبوع', message: 'معدل الحضور هذا الأسبوع 87%', type: 'GENERAL', link: 'director-dashboard' },
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
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      notificationCount++;
    }
  }

  // Notifications for teachers
  for (const teacher of teachers) {
    const teacherUser = await db.user.findUnique({ where: { id: teacher.userId } });
    if (!teacherUser) continue;

    const teacherNotifs = [
      { title: 'حصة قادمة', message: 'لديك حصة اليوم في الساعة 10:00', type: 'GENERAL' },
      { title: 'غياب تلميذ', message: 'أحد التلاميذ غاب عن حصتك اليوم', type: 'ABSENCE' },
      { title: 'حصة ملغاة', message: 'حصة يوم الخميس تم إلغاؤها بسبب عطلة رسمية', type: 'CANCELLATION' },
      { title: 'رسالة جديدة', message: 'ولي أمر أرسل لك رسالة بخصوص تلميذ', type: 'GENERAL' },
    ];

    for (const notif of teacherNotifs) {
      await db.notification.create({
        data: {
          userId: teacherUser.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        },
      });
      notificationCount++;
    }
  }

  // Notifications for parents
  for (const parent of parents) {
    const parentUser = await db.user.findUnique({ where: { id: parent.userId } });
    if (!parentUser) continue;

    const parentNotifs = [
      { title: 'غياب ابنك', message: 'تم تسجيل غياب ابنك عن حصة اليوم', type: 'ABSENCE' },
      { title: 'فاتورة جديدة', message: 'فاتورة جديدة تم إنشاؤها لشهر الحالي', type: 'INVOICE' },
      { title: 'نشاط دراسي', message: 'حصل ابنك على 16/20 في اختبار', type: 'ACTIVITY' },
      { title: 'رسالة من الأستاذ', message: 'الأستاذ أرسل ملاحظة بخصوص مستوى ابنك', type: 'GENERAL' },
    ];

    for (const notif of parentNotifs) {
      await db.notification.create({
        data: {
          userId: parentUser.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: Math.random() > 0.3,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
      notificationCount++;
    }
  }

  // Admin notifications
  const adminNotifs = [
    { title: 'مؤسسة مجمدة', message: 'تم تجميد روضة الأمل بسبب عدم تجديد الاشتراك', type: 'SYSTEM', link: 'admin-institutions' },
    { title: 'مؤسسة مجمدة', message: 'تم تجميد مركز النجاح التعليمي بسبب عدم السداد', type: 'SYSTEM', link: 'admin-institutions' },
    { title: 'دفعة جديدة', message: 'تم استلام دفعة اشتراك من أكاديمية الفجر', type: 'INVOICE', link: 'admin-payments' },
    { title: 'تسجيل جديد', message: 'مدرسة الأفق الجديد سجلت في المنصة بالخطة المجانية', type: 'SYSTEM', link: 'admin-institutions' },
    { title: 'إحصائيات عامة', message: 'إجمالي المؤسسات النشطة: 6 من 8', type: 'GENERAL', link: 'admin-dashboard' },
    { title: 'تنبيه دفع', message: '3 مؤسسات لديها دفعات متأخرة', type: 'INVOICE', link: 'admin-payments' },
    { title: 'تقرير الإيرادات', message: 'إيرادات هذا الشهر تجاوزت 50,000 دج', type: 'SYSTEM', link: 'admin-reports' },
    { title: 'طلب دعم فني', message: 'مدير معهد الحكمة طلب مساعدة تقنية', type: 'GENERAL', link: 'admin-support' },
  ];
  for (const notif of adminNotifs) {
    await db.notification.create({
      data: {
        userId: adminUser.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: notif.link,
        read: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    });
    notificationCount++;
  }

  console.log(`✅ تم إنشاء ${notificationCount} إشعار`);

  // ========================
  // 13. Create Reports (6 months for each institution)
  // ========================
  let reportCount = 0;
  for (const institution of institutions) {
    for (let m = 0; m < 6; m++) {
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

      const attendanceRate = 82 + Math.floor(Math.random() * 12);
      const revenue = instStudents.length * (3 + Math.floor(Math.random() * 4)) * 400;

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
            attendanceRate,
            revenue,
            summary: `تقرير شهري لشهر ${adjustedMonth + 1}/${reportYear} - ${instStudents.length} تلميذ، ${instTeachers.length} أستاذ`,
          }),
          generatedAt: new Date(reportYear, adjustedMonth, 28),
        },
      });
      reportCount++;
    }
  }

  console.log(`✅ تم إنشاء ${reportCount} تقرير`);

  // ========================
  // 14. Create Payments (comprehensive for all 8 institutions)
  // ========================
  const paymentsData = [
    // Institution 1 - PREMIUM
    {
      institutionId: institutions[0].id,
      amount: 60000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2025-001',
      notes: 'اشتراك سنوي برومزي - مدرسة النور',
      paidAt: new Date(2025, 0, 15),
      dueDate: new Date(2025, 0, 1),
    },
    {
      institutionId: institutions[0].id,
      amount: 30000,
      plan: 'PREMIUM',
      periodMonths: 6,
      status: 'PENDING',
      paymentMethod: null,
      transactionRef: null,
      notes: 'تجديد اشتراك برومزي - لم يتم الدفع بعد',
      paidAt: null,
      dueDate: new Date(2025, 5, 1),
    },
    // Institution 2 - BASIC
    {
      institutionId: institutions[1].id,
      amount: 15000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'PAID',
      paymentMethod: 'BARIDIMOB',
      transactionRef: 'BAR-2025-002',
      notes: 'اشتراك نصفي أساسي - مركز الأمل',
      paidAt: new Date(2025, 1, 20),
      dueDate: new Date(2025, 1, 1),
    },
    {
      institutionId: institutions[1].id,
      amount: 15000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'PENDING',
      paymentMethod: null,
      transactionRef: null,
      notes: 'تجديد اشتراك أساسي - بانتظار التأكيد',
      paidAt: null,
      dueDate: new Date(2025, 7, 1),
    },
    // Institution 3 - PREMIUM
    {
      institutionId: institutions[2].id,
      amount: 60000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'BANK-2025-003',
      notes: 'تحويل بنكي - اشتراك سنوي برومزي - أكاديمية الفجر',
      paidAt: new Date(2025, 2, 10),
      dueDate: new Date(2025, 2, 1),
    },
    // Institution 4 - BASIC
    {
      institutionId: institutions[3].id,
      amount: 15000,
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
      institutionId: institutions[3].id,
      amount: 15000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'PAID',
      paymentMethod: 'CASH',
      transactionRef: null,
      notes: 'دفع نقدي - معهد الحكمة',
      paidAt: new Date(2025, 3, 15),
      dueDate: new Date(2025, 3, 1),
    },
    // Institution 5 - FREE
    {
      institutionId: institutions[4].id,
      amount: 0,
      plan: 'FREE',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: null,
      transactionRef: null,
      notes: 'خطة مجانية - مدرسة الأفق الجديد',
      paidAt: new Date(2024, 9, 5),
      dueDate: null,
    },
    // Institution 6 - BASIC (FROZEN)
    {
      institutionId: institutions[5].id,
      amount: 15000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'PAID',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2024-006',
      notes: 'اشتراك سابق - روضة الأمل (منتهي)',
      paidAt: new Date(2024, 6, 10),
      dueDate: new Date(2024, 6, 1),
    },
    {
      institutionId: institutions[5].id,
      amount: 15000,
      plan: 'BASIC',
      periodMonths: 6,
      status: 'FAILED',
      paymentMethod: 'BARIDIMOB',
      transactionRef: 'BAR-2025-006',
      notes: 'فشل تجديد الاشتراك - تجميد الحساب',
      paidAt: null,
      dueDate: new Date(2025, 0, 1),
    },
    // Institution 7 - PREMIUM
    {
      institutionId: institutions[6].id,
      amount: 60000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'BANK-2025-007',
      notes: 'اشتراك سنوي برومزي - أكاديمية العلوم المتقدمة',
      paidAt: new Date(2025, 3, 5),
      dueDate: new Date(2025, 3, 1),
    },
    // Institution 8 - PREMIUM (FROZEN)
    {
      institutionId: institutions[7].id,
      amount: 60000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'PAID',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2024-008',
      notes: 'اشتراك سنوي سابق - مركز النجاح التعليمي (منتهي)',
      paidAt: new Date(2024, 0, 20),
      dueDate: new Date(2024, 0, 1),
    },
    {
      institutionId: institutions[7].id,
      amount: 60000,
      plan: 'PREMIUM',
      periodMonths: 12,
      status: 'FAILED',
      paymentMethod: 'CCP',
      transactionRef: 'CCP-2025-008',
      notes: 'فشل تجديد الاشتراك - عدم سداد لشهرين - تجميد الحساب',
      paidAt: null,
      dueDate: new Date(2025, 0, 1),
    },
  ];

  for (const paymentData of paymentsData) {
    await db.payment.create({ data: paymentData });
  }

  console.log(`✅ تم إنشاء ${paymentsData.length} سجل دفع`);

  // ========================
  // 15. Create Conversations and Messages
  // ========================
  let conversationCount = 0;
  let messageCount = 0;

  // Build parent-to-institution map
  const parentInstitutionMap = new Map<string, string>();
  for (const parent of parents) {
    const parentUser = await db.user.findUnique({ where: { id: parent.userId } });
    if (parentUser) {
      parentInstitutionMap.set(parent.id, parentUser.institutionId);
    }
  }

  // Create conversations between teachers and parents for each institution
  for (const institution of institutions) {
    const instTeachers = teachers.filter((t) => t.institutionId === institution.id);
    const instParents = parents.filter((p) => parentInstitutionMap.get(p.id) === institution.id);

    // Create 3-5 conversations per institution
    const numConversations = Math.min(5, Math.max(3, instTeachers.length));
    for (let c = 0; c < numConversations && c < instTeachers.length && c < instParents.length; c++) {
      const teacher = instTeachers[c];
      const parent = instParents[c];

      const teacherUser = await db.user.findUnique({ where: { id: teacher.userId } });
      const parentUser = await db.user.findUnique({ where: { id: parent.userId } });
      if (!teacherUser || !parentUser) continue;

      const conversation = await db.conversation.create({
        data: {
          type: 'DIRECT',
          institutionId: institution.id,
        },
      });

      // Add participants
      await db.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: teacherUser.id,
        },
      });
      await db.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: parentUser.id,
        },
      });

      // Add messages
      const messagesData = [
        { senderId: parentUser.id, content: 'السلام عليكم، أريد الاستفسار عن مستوى ابني في المادة' },
        { senderId: teacherUser.id, content: 'وعليكم السلام، مستوى ابنك جيد ويحتاج مزيد من المراجعة في المنزل' },
        { senderId: parentUser.id, content: 'شكراً جزيلاً، هل هناك تمارين إضافية يمكنه العمل عليها؟' },
        { senderId: teacherUser.id, content: 'نعم، سأرسل له تمارين إضافية عبر المنصة' },
      ];

      for (let m = 0; m < messagesData.length; m++) {
        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: messagesData[m].senderId,
            content: messagesData[m].content,
            type: 'TEXT',
            createdAt: new Date(Date.now() - (messagesData.length - m) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000),
          },
        });
        messageCount++;
      }

      conversationCount++;
    }
  }

  console.log(`✅ تم إنشاء ${conversationCount} محادثة و ${messageCount} رسالة`);

  // ========================
  // 16. Create Landing Content
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
          price: 7000,
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
        { name: 'محمد الصغير بن عمر', role: 'مدير روضة الأمل', text: 'المنصة ممتازة لكننا نأمل إضافة مميزات أكثر للطور الابتدائي.', rating: 4 },
        { name: 'سارة محفوظي', role: 'مديرة أكاديمية العلوم المتقدمة', text: 'التقارير المتقدمة ساعدتنا في اتخاذ قرارات أفضل لمؤسستنا.', rating: 5 },
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
  console.log(`📊 المؤسسات: ${institutions.length} (2 مجمدة)`);
  console.log(`👨‍🏫 الأساتذة: ${teachers.length}`);
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
  console.log(`💬 المحادثات: ${conversationCount}`);
  console.log(`📨 الرسائل: ${messageCount}`);
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
