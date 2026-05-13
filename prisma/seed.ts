import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 بدء ملء قاعدة البيانات ببيانات تجريبية واقعية...');

  // Clean existing data
  await db.invoiceLineItem.deleteMany();
  await db.invoice.deleteMany();
  await db.attendance.deleteMany();
  await db.absence.deleteMany();
  await db.notification.deleteMany();
  await db.report.deleteMany();
  await db.pricing.deleteMany();
  await db.teacherSubject.deleteMany();
  await db.session.deleteMany();
  await db.student.deleteMany();
  await db.parent.deleteMany();
  await db.teacher.deleteMany();
  await db.user.deleteMany();
  await db.subject.deleteMany();
  await db.institution.deleteMany();

  // ========================
  // 1. Create Institutions (12 institutions for realistic data)
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
    db.institution.create({
      data: {
        name: 'مدرسة الأمل',
        address: 'حي المدينة الجديدة، عنابة',
        phone: '0555567890',
        subscriptionPlan: 'FREE',
      },
    }),
    db.institution.create({
      data: {
        name: 'مركز النور التعليمي',
        address: 'شارع الأمير عبد القادر، تلمسان',
        phone: '0555678901',
        subscriptionPlan: 'BASIC',
      },
    }),
    db.institution.create({
      data: {
        name: 'أكاديمية الإبداع',
        address: 'حي 500 مسكن، سطيف',
        phone: '0555789013',
        subscriptionPlan: 'PREMIUM',
      },
    }),
    db.institution.create({
      data: {
        name: 'مدرسة المستقبل',
        address: 'شارع 1 نوفمبر، بجاية',
        phone: '0555890123',
        subscriptionPlan: 'FREE',
      },
    }),
    db.institution.create({
      data: {
        name: 'مركز المعرفة',
        address: 'شارع محمد الخامس، البليدة',
        phone: '0555901234',
        subscriptionPlan: 'BASIC',
      },
    }),
    db.institution.create({
      data: {
        name: 'معهد العلوم الحديثة',
        address: 'حي كوسطار، تيزي وزو',
        phone: '0555012345',
        subscriptionPlan: 'PREMIUM',
      },
    }),
    db.institution.create({
      data: {
        name: 'مدرسة البيان',
        address: 'شارع أحمد بوقرة، Médéa',
        phone: '0555123467',
        subscriptionPlan: 'BASIC',
      },
    }),
    db.institution.create({
      data: {
        name: 'مركز الأمانة للتعليم',
        address: 'شارع الأمير عبد القادر، باتنة',
        phone: '0555234578',
        subscriptionPlan: 'FREE',
      },
    }),
  ]);

  console.log(`✅ تم إنشاء ${institutions.length} مؤسسة تعليمية`);

  // ========================
  // 2. Create Subjects per institution
  // ========================
  const subjectNames = [
    { name: 'الرياضيات', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'الفيزياء', levels: ['متوسط', 'ثانوي'] },
    { name: 'العلوم الطبيعية', levels: ['متوسط', 'ثانوي'] },
    { name: 'اللغة العربية', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'اللغة الفرنسية', levels: ['ابتدائي', 'متوسط', 'ثانوي'] },
    { name: 'اللغة الإنجليزية', levels: ['متوسط', 'ثانوي'] },
    { name: 'الفلسفة', levels: ['ثانوي'] },
    { name: 'التاريخ والجغرافيا', levels: ['متوسط', 'ثانوي'] },
  ];

  const allSubjects = [];
  for (const institution of institutions) {
    for (const subj of subjectNames) {
      for (const level of subj.levels) {
        const subject = await db.subject.create({
          data: {
            name: `${subj.name} - ${level}`,
            level,
            institutionId: institution.id,
          },
        });
        allSubjects.push(subject);

        // Create pricing for this subject
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
  // 3. Create Users (Directors, Teachers, Parents)
  // ========================
  const directorNames = [
    'أسماء بن عمر', 'كريم بوزيد', 'فاطمة زهراء مراد',
    'عبد الرحمن حداد', 'سارة بلقاسم', 'محمد أمين شريف',
    'نادية فرحات', 'يوسف بن عبد الله', 'أمينة خليفي',
    'رشيد مقراني', 'ليلى بوزيد', 'حسين بوعزة',
  ];

  const teacherNames = [
    'أحمد منصوري', 'نادية بلحاج', 'ياسين خلفي', 'سمية غازي',
    'عمر بن ناصر', 'حنان زروقي', 'كمال بوطالب', 'مريم بلقاسمي',
    'فتحي بوعكاز', 'إيمان حمداني', 'نبيل شريف', 'رابحة مهداوي',
    'طارق بن عمر', 'زهرة بوعزيز', 'عدنان لحمر', 'سلمى بوزيدية',
    'محمد بوجمعة', 'آمال حبشي', 'رضا مقراني', 'ليندة عيسوي',
    'جمال بلعربي', 'حنيفة زيتوني', 'كريم بن داود', 'سمير بوزيت',
  ];

  const parentNames = [
    'خالد بوعكاز', 'محمد العربي', 'سعيد مرابط', 'عبد الله بن حمزة',
    'إبراهيم خليفي', 'مصطفى بلحاج', 'عبد الكريم زروال', 'رابح حداد',
    'لطيف بوعزيز', 'ناصر بلقاسم', 'محمد شريف', 'أحمد فرحات',
    'يوسف خلفي', 'علي غازي', 'حسن بن ناصر', 'عمر زروقي',
    'فتحي بوطالب', 'مختار بلقاسمي', 'رشيد بوعكاز', 'سالم مهداوي',
  ];

  const studentNames = [
    'أمينة خالد', 'يوسف محمد', 'فاطمة سعيد', 'أحمد عبد الله',
    'مريم إبراهيم', 'ياسين مصطفى', 'سارة عبد الكريم', 'عمر رابح',
    'نادية لطيف', 'كريم ناصر', 'هدى محمد', 'علي أحمد',
    'لينا يوسف', 'محمد علي', 'أسماء حسن', 'بلال عمر',
    'زهرة فتحي', 'أيوب مختار', 'إنعام رشيد', 'سلمى سالم',
    'رياض خالد', 'حنان محمد العربي', 'توفيق سعيد مرابط',
    'إيمان عبد الله', 'نبيل إبراهيم', 'سلمى مصطفى',
    'أحمد عبد الكريم', 'ياسمين رابح', 'عبد الرحمن لطيف',
    'مريم ناصر', 'محمد أمين محمد', 'فاطمة الزهراء أحمد',
    'خالد علي', 'نور يوسف', 'صفية حسن', 'مروان عمر',
    'آية فتحي', 'يوسف مختار', 'دانة رشيد', 'عبد المالك سالم',
    'ريم خالد', 'محمد ياسين محمد العربي', 'أسماء سعيد مرابط',
    'عدنان عبد الله', 'لمياء إبراهيم', 'أحمد رضا مصطفى',
    'سارة عبد الكريم', 'عمار رابح', 'بنيسة لطيف',
  ];

  // Create directors
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

  // Create teachers (2-3 per institution)
  const teachers = [];
  let teacherIdx = 0;
  for (let i = 0; i < institutions.length; i++) {
    const numTeachers = i < 4 ? 3 : 2; // More teachers for first 4 institutions
    for (let j = 0; j < numTeachers; j++) {
      if (teacherIdx >= teacherNames.length) break;
      const user = await db.user.create({
        data: {
          name: teacherNames[teacherIdx],
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
        },
      });

      // Assign subjects to this teacher (2-3 subjects)
      const instSubjects = allSubjects.filter((s) => s.institutionId === institutions[i].id);
      const teacherSubjectCount = Math.min(3, instSubjects.length);
      for (let k = 0; k < teacherSubjectCount; k++) {
        const subjIdx = (j * 3 + k) % instSubjects.length;
        try {
          await db.teacherSubject.create({
            data: {
              teacherId: teacher.id,
              subjectId: instSubjects[subjIdx].id,
            },
          });
        } catch {
          // Skip if already exists
        }
      }

      teachers.push(teacher);
      teacherIdx++;
    }
  }

  console.log(`✅ تم إنشاء ${teachers.length} معلم`);

  // Create parents and students
  const parents = [];
  const students = [];
  let parentIdx = 0;
  let studentIdx = 0;

  for (let i = 0; i < institutions.length; i++) {
    const numStudents = i < 3 ? 8 : i < 6 ? 5 : 3; // More students for first institutions
    for (let j = 0; j < numStudents; j++) {
      if (parentIdx >= parentNames.length || studentIdx >= studentNames.length) break;

      // Create parent user
      const parentUser = await db.user.create({
        data: {
          name: parentNames[parentIdx],
          email: `parent${parentIdx + 1}@edutrack.dz`,
          password: 'hashed_demo123',
          role: 'PARENT',
          institutionId: institutions[i].id,
        },
      });
      const parent = await db.parent.create({
        data: {
          userId: parentUser.id,
          phone: `0555${String(parentIdx + 100000).slice(-6)}`,
        },
      });
      parents.push(parent);

      // Create 1-2 students per parent
      const kidsPerParent = j % 3 === 0 ? 2 : 1;
      for (let k = 0; k < kidsPerParent && studentIdx < studentNames.length; k++) {
        const levels = ['ابتدائي', 'متوسط', 'ثانوي'];
        const level = levels[studentIdx % 3];
        const student = await db.student.create({
          data: {
            name: studentNames[studentIdx],
            level,
            parentId: parent.id,
            institutionId: institutions[i].id,
            createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in last 6 months
          },
        });
        students.push(student);
        studentIdx++;
      }
      parentIdx++;
    }
  }

  console.log(`✅ تم إنشاء ${parents.length} ولي أمر و ${students.length} تلميذ`);

  // ========================
  // 4. Create Sessions (weekly recurring)
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

  const sessions = [];
  for (const teacher of teachers) {
    const instSubjects = allSubjects.filter((s) => s.institutionId === teacher.institutionId);
    const teacherSubjs = await db.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
    });

    if (teacherSubjs.length === 0) continue;

    // Each teacher has 3-5 sessions per week
    const sessionsPerTeacher = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < sessionsPerTeacher; s++) {
      const subj = teacherSubjs[s % teacherSubjs.length];
      const day = daysOfWeek[s % daysOfWeek.length];
      const time = timeSlots[s % timeSlots.length];
      const levels = ['ابتدائي', 'متوسط', 'ثانوي'];
      const level = levels[s % 3];

      const session = await db.session.create({
        data: {
          subjectId: subj.subjectId,
          teacherId: teacher.id,
          institutionId: teacher.institutionId,
          dayOfWeek: day,
          startTime: time.start,
          endTime: time.end,
          level,
          repeatType: 'WEEKLY',
          status: 'SCHEDULED',
        },
      });
      sessions.push(session);
    }
  }

  console.log(`✅ تم إنشاء ${sessions.length} حصة أسبوعية`);

  // ========================
  // 5. Create Attendances & Absences (for the past week)
  // ========================
  let attendanceCount = 0;
  let absenceCount = 0;

  // Create past session instances and record attendance
  const today = new Date();
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const sessionDate = new Date(today);
    sessionDate.setDate(today.getDate() - dayOffset);
    const dayOfWeek = sessionDate.getDay();

    // Find sessions that happen on this day of week
    const daySessions = sessions.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const session of daySessions) {
      // Get students in this institution at this level
      const sessionStudents = students.filter(
        (st) => st.institutionId === session.institutionId && st.level === session.level
      );

      for (const student of sessionStudents) {
        // 85% chance of being present, 10% absent, 5% late
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

  // Also create some teacher absences
  for (let i = 0; i < 5; i++) {
    const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
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
  // 6. Create Invoices
  // ========================
  let invoiceCount = 0;
  let totalRevenue = 0;

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  for (const student of students) {
    const institution = institutions.find((i) => i.id === student.institutionId);
    if (!institution) continue;

    // Get subjects for this student's level
    const studentSubjects = allSubjects.filter(
      (s) => s.institutionId === student.institutionId && s.level === student.level
    );

    // Create invoice for current month and possibly previous months
    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const invoiceMonth = currentMonth - monthOffset;
      const invoiceYear = invoiceMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = ((invoiceMonth % 12) + 12) % 12;

      // Random total sessions (4-8 per subject)
      const totalSessions = (4 + Math.floor(Math.random() * 5)) * Math.min(studentSubjects.length, 2);
      const absentSessions = Math.floor(Math.random() * Math.min(3, totalSessions));
      const compensatedSessions = Math.floor(Math.random() * Math.min(absentSessions, 2));
      const pricePerSession = student.level === 'ابتدائي' ? 300 : student.level === 'متوسط' ? 400 : 500;
      const amount = (totalSessions - absentSessions + compensatedSessions) * pricePerSession;

      // 60% paid for current month, 80% for previous months, 10% overdue
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

      // Create line items for this invoice
      for (const subj of studentSubjects.slice(0, 2)) {
        const subjTotalSessions = Math.ceil(totalSessions / Math.min(studentSubjects.length, 2));
        const subjAbsentSessions = Math.ceil(absentSessions / Math.min(studentSubjects.length, 2));
        const subtotal = (subjTotalSessions - subjAbsentSessions) * pricePerSession;

        await db.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            subjectName: subj.name,
            totalSessions: subjTotalSessions,
            absentSessions: subjAbsentSessions,
            pricePerSession,
            subtotal,
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
  // 7. Create Notifications
  // ========================
  let notificationCount = 0;
  for (const director of directors) {
    // 3-5 notifications per director
    const numNotifs = 3 + Math.floor(Math.random() * 3);
    const types = ['ABSENCE', 'INVOICE', 'GENERAL', 'CANCELLATION'];
    const messages = [
      'تلميذ جديد تم تسجيله في مؤسستك',
      'تم تسجيل غياب تلميذ اليوم',
      'فاتورة جديدة تم إنشاؤها',
      'معلم طلب إذن غياب',
      'تم استلام دفعة جديدة',
      'تذكير: فواتير غير مدفوعة',
      'جلسة تعويضية تمت جدولتها',
      'تقرير شهري جاهز للتحميل',
    ];

    for (let i = 0; i < numNotifs; i++) {
      await db.notification.create({
        data: {
          userId: director.id,
          message: messages[i % messages.length],
          type: types[i % types.length],
          read: Math.random() > 0.5,
        },
      });
      notificationCount++;
    }
  }

  console.log(`✅ تم إنشاء ${notificationCount} إشعار`);

  // ========================
  // 8. Create Reports
  // ========================
  let reportCount = 0;
  for (const institution of institutions.slice(0, 4)) {
    // Monthly report for last 3 months
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

  // Final Summary
  console.log('\n========================================');
  console.log('🎉 تم ملء قاعدة البيانات بنجاح!');
  console.log('========================================');
  console.log(`📊 المؤسسات: ${institutions.length}`);
  console.log(`👨‍🏫 المعلمين: ${teachers.length}`);
  console.log(`👨‍👩‍👧‍👦 أولياء الأمور: ${parents.length}`);
  console.log(`🎓 التلاميذ: ${students.length}`);
  console.log(`📚 المواد الدراسية: ${allSubjects.length}`);
  console.log(`📅 الحصص الأسبوعية: ${sessions.length}`);
  console.log(`💰 الفواتير: ${invoiceCount}`);
  console.log(`💵 إجمالي الإيرادات: ${totalRevenue.toLocaleString()} دج`);
  console.log(`🔔 الإشعارات: ${notificationCount}`);
  console.log(`📋 التقارير: ${reportCount}`);
  console.log('========================================');
  console.log('\n🔑 بيانات الدخول التجريبية:');
  console.log('  مدير: director1@edutrack.dz / demo123');
  console.log('  معلم: teacher1@edutrack.dz / demo123');
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
