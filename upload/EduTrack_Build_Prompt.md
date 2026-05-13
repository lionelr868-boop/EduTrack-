# 🎓 برومبت بناء منصة EduTrack — مقسّم إلى مراحل

> **نوع المشروع:** منصة SaaS ويب (React + Node.js)  
> **الهدف:** تسيير المؤسسات التعليمية الخاصة ومراكز الدعم  
> **المستخدمون:** المدير — الأستاذ — ولي الأمر

---

## ✅ المرحلة 0 — الإعداد التقني الأولي

```
أنشئ بنية مشروع Full-Stack لمنصة SaaS تعليمية باسم "EduTrack".

=== Stack التقني ===
- Frontend: React 18 + Vite + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- State Management: Zustand
- Backend: Node.js + Express.js
- Database: PostgreSQL + Prisma ORM
- Auth: JWT + bcrypt
- Notifications: Firebase Cloud Messaging (FCM) أو Twilio SMS
- Hosting: Vercel (frontend) + Railway أو Render (backend)
- Cloud Storage: Cloudinary

=== هيكل المجلدات ===
edutrack/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   └── types/
├── server/                  # Node.js Backend
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   └── utils/
└── prisma/
    └── schema.prisma

=== قاعدة البيانات — Prisma Schema ===
أنشئ الـ Models التالية بالعلاقات الكاملة:
- Institution (المؤسسة): id, name, address, phone, logo, subscriptionPlan, createdAt
- User (المستخدم): id, name, email, password, role (DIRECTOR | TEACHER | PARENT), institutionId
- Student (التلميذ): id, name, level, parentId, institutionId
- Teacher (الأستاذ): id, userId, subjects[], institutionId
- Subject (المادة): id, name, level
- Session (الحصة): id, subjectId, teacherId, dayOfWeek, startTime, endTime, date, status (SCHEDULED | DONE | CANCELLED | COMPENSATED)
- Absence (الغياب): id, studentId | teacherId, sessionId, reason, notificationSent, createdAt
- Invoice (الفاتورة): id, studentId, month, year, totalSessions, absentSessions, compensatedSessions, amount, status (PENDING | PAID), createdAt
- Notification (الإشعار): id, userId, message, type, read, createdAt
- Report (التقرير): id, institutionId, type (DAILY | MONTHLY), data (JSON), generatedAt
```

---

## ✅ المرحلة 1 — نظام المصادقة والتسجيل (Auth)

```
ابنِ نظام مصادقة كامل لمنصة EduTrack بثلاثة أدوار مختلفة.

=== Backend — Auth API ===
أنشئ المسارات التالية في Express.js:

POST /api/auth/register-institution
  - Body: { institutionName, directorName, email, password, phone, address }
  - يُنشئ: Institution + User (role: DIRECTOR) في نفس الوقت
  - يُرجع: JWT token

POST /api/auth/login
  - Body: { email, password }
  - يُرجع: JWT + user info + role

POST /api/auth/invite-teacher
  - Protected (DIRECTOR only)
  - يُرسل دعوة بالإيميل للأستاذ مع رابط تسجيل

POST /api/auth/reset-password

Middleware: authMiddleware (verify JWT) + roleGuard(role[])

=== Frontend — صفحات Auth ===
أنشئ الصفحات التالية بتصميم احترافي:

1. صفحة Landing (/) 
   - Hero section تُظهر قيمة المنصة
   - Features section (6 ميزات مع أيقونات)
   - Pricing section (خطط الاشتراك)
   - CTA: "ابدأ تجربة مجانية"

2. صفحة تسجيل المؤسسة (/register)
   - Form متعدد الخطوات (3 steps):
     Step 1: معلومات المؤسسة
     Step 2: بيانات المدير
     Step 3: تأكيد + اختيار الخطة

3. صفحة الدخول (/login)
   - يوجّه تلقائياً حسب الدور:
     DIRECTOR → /dashboard
     TEACHER  → /teacher-panel
     PARENT   → /parent-portal

=== التصميم ===
الألوان الرئيسية:
  Primary:   #1A56DB (أزرق داكن احترافي)
  Secondary: #F97316 (برتقالي — لون العلامة التجارية EduTrack)
  Background: #F8FAFF
  Dark:      #0F172A

الخط: Noto Kufi Arabic للعربية + Inter للأرقام والإنجليزية
الاتجاه: RTL كامل
```

---

## ✅ المرحلة 2 — لوحة تحكم المدير (Director Dashboard)

```
ابنِ لوحة تحكم كاملة للمدير في منصة EduTrack.

=== Layout الرئيسي ===
Sidebar (عمودي — RTL):
  - لوحة التحكم (Dashboard)
  - الجدول الدراسي
  - الطلاب
  - الأساتذة
  - الغيابات
  - الفوترة
  - التقارير
  - الإعدادات

Header:
  - اسم المؤسسة + شعارها
  - اسم المستخدم
  - إشعارات (bell icon مع badge)
  - تسجيل الخروج

=== الصفحة الرئيسية — Overview Cards ===
أنشئ 6 بطاقات إحصائية:
1. عدد التلاميذ المسجلين (مع نسبة التغيير)
2. عدد الأساتذة النشطين
3. نسبة الحضور اليوم (%)
4. الإيرادات الشهرية (دج)
5. عدد الغيابات غير المبررة
6. الحصص المقررة لهذا اليوم

=== Charts (باستخدام Recharts) ===
1. LineChart: تطور رقم الأعمال (6 أشهر)
2. BarChart: نسبة الحضور أسبوعياً
3. PieChart: توزيع الغيابات (تلاميذ / أساتذة)
4. AreaChart: مقارنة الحصص المقررة vs المنجزة

=== Recent Activities Feed ===
آخر 10 أحداث: غياب مسجّل، فاتورة مدفوعة، حصة تعويضية...

=== Alert Banners ===
- تنبيه: "3 تلاميذ غابوا اليوم ولم يُبلَّغ أولياؤهم"
- تنبيه: "5 فواتير متأخرة هذا الشهر"

=== API Calls المطلوبة ===
GET /api/dashboard/stats?institutionId=...
  Returns: { totalStudents, totalTeachers, attendanceRate, revenue, absences, todaySessions }

GET /api/dashboard/revenue-chart
GET /api/dashboard/recent-activities
```

---

## ✅ المرحلة 3 — إدارة الجدول الدراسي

```
ابنِ نظام إدارة الجدول الدراسي لمنصة EduTrack.

=== الميزات المطلوبة ===

1. Weekly Schedule View
   - جدول أسبوعي بصري (Grid)
   - الأعمدة: الأيام (الأحد → الخميس + الجمعة السبت اختياري)
   - الصفوف: الفترات الزمنية (كل ساعة)
   - كل خلية تُظهر: المادة + الأستاذ + المجموعة + اللون
   - Drag & Drop لتحريك الحصص (باستخدام @dnd-kit/core)

2. إضافة/تعديل/حذف حصة
   Modal Form:
   - المادة (Select)
   - الأستاذ (Select — يُصفَّى حسب المادة)
   - المجموعة/المستوى (Select)
   - اليوم (Select)
   - الوقت من → إلى (TimePicker)
   - تكرار: أسبوعي / استثنائي
   - Validation: لا تعارض في الوقت للأستاذ أو القاعة

3. إدارة التغييرات الطارئة
   - زر "إلغاء حصة": مع سبب + إشعار تلقائي للأولياء
   - زر "حصة تعويضية": تحديد موعد بديل

4. فلاتر الجدول:
   - حسب الأستاذ
   - حسب المستوى/المجموعة
   - حسب المادة

=== API Backend ===
GET    /api/sessions?institutionId&week&teacherId&level
POST   /api/sessions          — إنشاء حصة
PUT    /api/sessions/:id       — تعديل حصة
DELETE /api/sessions/:id       — حذف مع إشعار
POST   /api/sessions/:id/cancel    — إلغاء + إشعار فوري
POST   /api/sessions/:id/compensate — جدولة تعويضية

=== Conflict Detection Logic ===
قبل حفظ أي حصة:
  - تحقق أن الأستاذ لا توجد له حصة في نفس الوقت
  - تحقق أن المجموعة لا توجد لها حصة أخرى في نفس الوقت
  - إذا كان هناك تعارض → رسالة خطأ واضحة
```

---

## ✅ المرحلة 4 — نظام تسجيل الغيابات والحضور

```
ابنِ نظام تسجيل الغيابات والحضور لمنصة EduTrack.

=== واجهة المدير/الأستاذ ===

1. صفحة تسجيل الحضور اليومي
   - يختار الأستاذ الحصة من قائمة حصص اليوم
   - تظهر قائمة التلاميذ مع Checkbox لكل واحد
   - حالات: حاضر ✓ / غائب ✗ / متأخر ⏱
   - زر "إرسال الكشف" → يحفظ + يرسل إشعارات للغائبين
   - Timer: يُظهر تنبيهاً إذا لم يُسجَّل الحضور خلال 15 دقيقة من بداية الحصة

2. صفحة الغيابات (عرض شامل)
   - جدول بالتصفية: حسب التاريخ / التلميذ / المادة / الأستاذ
   - عمود حالة الإشعار: أُرسل / لم يُرسل
   - زر "إعادة الإرسال" للإشعار إذا فشل
   - Export PDF / Excel

3. غياب الأستاذ
   - المدير يُسجّل غياب أستاذ
   - يختار: حصة متأثرة + إشعار للأولياء المعنيين تلقائياً
   - يجدول حصة تعويضية اختيارياً

=== منطق الإشعارات (Notification Logic) ===

عند تسجيل غياب تلميذ:
  1. جلب رقم هاتف ولي الأمر المرتبط
  2. إرسال SMS عبر Twilio:
     "السلام عليكم، نُعلمكم بغياب ابنكم [اسم التلميذ]
      عن حصة [المادة] بتاريخ [التاريخ] — [اسم المؤسسة]"
  3. إرسال Push Notification عبر FCM (إذا كان ولي الأمر على التطبيق)
  4. تسجيل حالة الإشعار في قاعدة البيانات

عند إلغاء حصة بسبب غياب الأستاذ:
  "نُعلمكم بأن حصة [المادة] ليوم [اليوم] مُلغاة بسبب غياب الأستاذ.
   سيتم تعويضها بتاريخ [إن وُجد]"

=== API Backend ===
POST /api/attendance/submit
  Body: { sessionId, records: [{studentId, status}] }

GET  /api/absences?institutionId&from&to&studentId
POST /api/absences/teacher  — تسجيل غياب أستاذ
POST /api/absences/:id/notify  — إعادة إرسال الإشعار

Cron Job:
  كل يوم الساعة 9:00 صباحاً:
  - تحقق من حصص اليوم غير المُسجّل حضورها
  - أرسل تنبيهاً للمدير
```

---

## ✅ المرحلة 5 — نظام الفوترة الذكية

```
ابنِ نظام الفوترة الذكي لمنصة EduTrack مبنياً على الحصص الفعلية.

=== منطق حساب الفاتورة ===

صيغة الحساب:
  المبلغ المستحق = (الحصص_المنجزة - غيابات_التلميذ + الحصص_التعويضية_الحاضرة) × سعر_الحصة

الحالات:
  - حصة منجزة + تلميذ حاضر → تُحسب
  - حصة منجزة + تلميذ غائب → لا تُحسب (حسب سياسة المؤسسة)
  - حصة ملغاة بسبب الأستاذ → لا تُحسب (دائماً)
  - حصة تعويضية + تلميذ حاضر → تُحسب

=== واجهة الفوترة ===

1. إعدادات الأسعار (Settings)
   - جدول أسعار حسب المادة + المستوى
   - سياسة الغياب: "هل يُحسب غياب التلميذ؟" (نعم/لا)
   - تاريخ إصدار الفواتير (مثلاً: أول كل شهر)

2. صفحة الفواتير الشهرية
   - زر "توليد فواتير [الشهر]" → يحسب تلقائياً لجميع التلاميذ
   - قائمة فواتير مع الحالة: PENDING / PAID / OVERDUE
   - فلاتر: حسب الشهر / المستوى / حالة الدفع

3. تفاصيل الفاتورة (لكل تلميذ)
   - جدول مفصّل: كل مادة، عدد الحصص، الغيابات، المبلغ الجزئي
   - الإجمالي المستحق
   - زر "تحديد كمدفوع" + تاريخ الدفع + طريقة الدفع
   - زر "طباعة PDF" (باستخدام react-pdf أو jsPDF)

4. تصدير الفواتير
   - PDF بتنسيق رسمي مع شعار المؤسسة
   - Excel لجميع الفواتير

=== تصميم الفاتورة PDF ===
الرأس:  شعار المؤسسة + العنوان + التاريخ
الجسم:  اسم التلميذ + الشهر + جدول تفصيلي
الذيل:  الإجمالي + حالة الدفع + توقيع المدير

=== API Backend ===
POST /api/invoices/generate
  Body: { institutionId, month, year }
  Logic: يجلب جميع التلاميذ + يحسب لكل واحد + ينشئ Invoice records

GET  /api/invoices?institutionId&month&year&status
GET  /api/invoices/:studentId/:month/:year  — فاتورة تلميذ محدد
PUT  /api/invoices/:id/mark-paid
  Body: { paidAt, paymentMethod }
GET  /api/invoices/:id/pdf   — يُولّد ويُرجع PDF
```

---

## ✅ المرحلة 6 — التقارير الآلية

```
ابنِ نظام التقارير الآلية لمنصة EduTrack.

=== أنواع التقارير ===

1. التقرير اليومي
   المحتوى:
   - الحصص المنجزة اليوم (مع تسجيل الحضور)
   - الحصص الملغاة + الأسباب
   - قائمة غيابات التلاميذ
   - قائمة غيابات الأساتذة
   - الإشعارات المُرسلة
   
   التوليد: تلقائي كل يوم الساعة 22:00 (Cron Job)
   التوزيع: إيميل للمدير + متاح في لوحة التحكم

2. التقرير الشهري
   المحتوى:
   - إجمالي الحصص المنجزة / الملغاة / التعويضية
   - معدل حضور التلاميذ (%) مع ترتيب
   - معدل حضور الأساتذة (%)
   - رقم الأعمال الشهري
   - الفواتير المدفوعة vs المعلقة
   - مقارنة مع الشهر السابق (% تغيير)
   
   التوليد: أول كل شهر تلقائياً

3. تقرير تلميذ بعينه
   - سجل الحضور التفصيلي
   - المواد التي تعثّر فيها (نسبة حضور < 80%)
   - تطور الغيابات عبر الزمن
   - الفواتير المدفوعة والمتأخرة

4. تقرير أستاذ
   - الحصص المنجزة vs الغائب عنها
   - تقييم الحضور
   - المستويات التي يُدرّسها

=== واجهة التقارير ===
- صفحة التقارير: قائمة بجميع التقارير المولّدة
- فلاتر: النوع + الفترة
- زر تحميل PDF لكل تقرير
- Dashboard Charts مدمجة (Recharts)

=== API ===
GET  /api/reports?type=DAILY&date=2025-05-01
GET  /api/reports?type=MONTHLY&month=5&year=2025
GET  /api/reports/student/:id?from=&to=
GET  /api/reports/teacher/:id?month=&year=
POST /api/reports/generate — توليد تقرير يدوياً
```

---

## ✅ المرحلة 7 — بوابة ولي الأمر (Parent Portal)

```
ابنِ بوابة ولي الأمر لمنصة EduTrack. يجب أن تكون بسيطة جداً
وقابلة للاستخدام على الهاتف المحمول (Mobile-First).

=== صفحات البوابة ===

1. الصفحة الرئيسية (/parent)
   - بطاقة: "ابنك [الاسم]" مع صورة + المستوى
   - آخر إشعار مستلم (غياب / تنبيه / فاتورة)
   - حالة اليوم: هل لديه حصص؟ هل حضر؟

2. الجدول الأسبوعي (/parent/schedule)
   - جدول بسيط يُظهر حصص الابن هذا الأسبوع
   - ألوان: أخضر = حاضر، أحمر = غائب، رمادي = ملغاة

3. سجل الغيابات (/parent/absences)
   - قائمة زمنية بجميع الغيابات
   - التاريخ + المادة + الأستاذ + الإشعار المُرسل

4. الفواتير (/parent/invoices)
   - آخر فاتورة بوضوح (المبلغ + الحالة)
   - قائمة الفواتير السابقة
   - زر "تحميل PDF" لكل فاتورة
   - الحالة: مدفوعة ✓ / معلقة ⏳

5. الإشعارات (/parent/notifications)
   - قائمة جميع الإشعارات مرتبة بالتاريخ
   - تمييز: مقروء / غير مقروء

=== تصميم Mobile-First ===
- Bottom Navigation Bar بدلاً من Sidebar
- بطاقات كبيرة سهلة النقر
- خط كبير واضح
- ألوان واضحة المعنى
- لا جداول معقدة

=== PWA Support ===
- manifest.json لتثبيت التطبيق على الهاتف
- Service Worker للإشعارات حتى خارج المتصفح
- Offline cache للبيانات الأساسية

=== API ===
GET /api/parent/dashboard?parentId=
GET /api/parent/schedule?studentId=&week=
GET /api/parent/absences?studentId=&from=&to=
GET /api/parent/invoices?studentId=
GET /api/parent/notifications?userId=
PUT /api/parent/notifications/:id/read
```

---

## ✅ المرحلة 8 — واجهة الأستاذ (Teacher Panel)

```
ابنِ لوحة الأستاذ في منصة EduTrack.

=== صفحات لوحة الأستاذ ===

1. الصفحة الرئيسية
   - حصص اليوم مع الأوقات والمستويات
   - إحصائية سريعة: حضور هذا الأسبوع (%)
   - تنبيه: حصص لم يُسجّل لها الحضور بعد

2. جدولي الأسبوعي
   - عرض حصصه فقط
   - تمييز: منجزة ✓ / قادمة ⏰ / ملغاة ✗

3. تسجيل الحضور
   - يختار الحصة من حصص اليوم
   - يُسجّل الحضور (واجهة سريعة بـ Swipe أو Tap)
   - ملاحظة اختيارية لكل تلميذ

4. الطلاب
   - قائمة طلابه مع نسبة الحضور لكل واحد
   - تنبيه: من تجاوز غياباته 20%

5. إبلاغ عن غياب نفسه
   - Form بسيط: التاريخ + السبب + هل يمكن تعويض؟
   - يذهب للمدير كطلب موافقة

=== API ===
GET /api/teacher/schedule?teacherId=&week=
GET /api/teacher/sessions/today?teacherId=
GET /api/teacher/students?teacherId=
POST /api/teacher/absence-request
```

---

## ✅ المرحلة 9 — الإعدادات وإدارة المؤسسة

```
ابنِ صفحة الإعدادات الشاملة للمدير في منصة EduTrack.

=== أقسام الإعدادات ===

1. معلومات المؤسسة
   - الاسم + العنوان + الهاتف
   - رفع الشعار (Cloudinary)
   - تعديل بيانات الاتصال

2. إدارة الطلاب
   - إضافة / تعديل / حذف تلميذ
   - Form: الاسم + المستوى + ولي الأمر (ربط)
   - استيراد من Excel (Bulk Import)

3. إدارة الأساتذة
   - إضافة أستاذ (دعوة بالإيميل)
   - تعديل بياناته + مواده
   - تعطيل / تفعيل حساب

4. المواد والمستويات
   - إضافة مواد دراسية
   - تحديد المستويات (ابتدائي / متوسط / ثانوي)
   - ربط المادة بالأستاذ والمستوى

5. إعدادات الفوترة
   - جدول الأسعار: مادة × مستوى × سعر الحصة
   - سياسة الغياب (يُحسب / لا يُحسب)
   - يوم إصدار الفواتير
   - معلومات الدفع (للـ PDF)

6. إعدادات الإشعارات
   - تفعيل/تعطيل SMS
   - قالب رسالة الغياب (مخصص)
   - قالب رسالة إلغاء الحصة
   - تفعيل إشعارات الفاتورة

7. الاشتراك والخطة
   - الخطة الحالية + تاريخ الانتهاء
   - ترقية الخطة
   - سجل الفواتير (فواتير المنصة نفسها)

=== API ===
GET/PUT /api/settings/institution
POST    /api/students (+ bulk import)
PUT/DELETE /api/students/:id
POST    /api/teachers/invite
GET/PUT /api/settings/billing
GET/PUT /api/settings/notifications
```

---

## ✅ المرحلة 10 — الاختبار والنشر

```
أعدّ منصة EduTrack للنشر الكامل.

=== اختبارات ===

1. Unit Tests (Jest + React Testing Library)
   - اختبار منطق حساب الفاتورة
   - اختبار Conflict Detection للجدول
   - اختبار توليد الإشعارات

2. Integration Tests
   - Auth flow كامل (register → login → dashboard)
   - Attendance flow (تسجيل حضور → إشعار → فاتورة)

3. E2E Tests (Playwright)
   - سيناريو كامل: مدير يُسجّل غياب → ولي يستقبل إشعار

=== Security ===
- Helmet.js لحماية Headers
- Rate Limiting (express-rate-limit)
- Input Validation (Zod)
- SQL Injection Protection (Prisma)
- CORS إعداد صحيح

=== Performance ===
- React Query لـ Caching البيانات
- Lazy Loading للصفحات
- Image Optimization (Cloudinary)
- Pagination في جميع القوائم

=== النشر ===
Frontend (Vercel):
  - Build: npm run build
  - Environment: VITE_API_URL, VITE_FCM_KEY

Backend (Railway):
  - Environment: DATABASE_URL, JWT_SECRET, TWILIO_*, FCM_SERVER_KEY
  - Cron Jobs: node-cron للتقارير والإشعارات التلقائية

Database (Railway PostgreSQL):
  - Migrations: npx prisma migrate deploy
  - Seed: npx prisma db seed (بيانات تجريبية)

=== بيانات تجريبية (Seed) ===
أنشئ:
  - مؤسسة تجريبية: "معهد النجاح التعليمي"
  - 1 مدير + 3 أساتذة + 20 تلميذ + 5 أولياء أمور
  - جدول أسبوعي كامل (الرياضيات، الفيزياء، الفرنسية، الإنجليزية، العربية)
  - غيابات وفواتير للشهر الماضي
```

---

## 📋 ملخص المراحل

| المرحلة | الوصف | الأولوية |
|---------|-------|----------|
| 0 | الإعداد التقني + قاعدة البيانات | 🔴 ضروري |
| 1 | نظام المصادقة + Landing Page | 🔴 ضروري |
| 2 | لوحة تحكم المدير | 🔴 ضروري |
| 3 | إدارة الجدول الدراسي | 🔴 ضروري |
| 4 | نظام الغيابات + الإشعارات | 🔴 ضروري |
| 5 | نظام الفوترة الذكية | 🔴 ضروري |
| 6 | التقارير الآلية | 🟡 مهم |
| 7 | بوابة ولي الأمر | 🟡 مهم |
| 8 | واجهة الأستاذ | 🟡 مهم |
| 9 | الإعدادات الشاملة | 🟢 تكميلي |
| 10 | الاختبار والنشر | 🟢 تكميلي |

---

## 💡 تلميحات للاستخدام الأمثل

1. **ابدأ دائماً بالمرحلة 0 و1** قبل أي شيء آخر
2. **كل مرحلة مستقلة** — يمكنك إعطاءها لأي AI Coding Tool (Cursor, Claude Code, Copilot)
3. **أضف السياق دائماً**: "أنا أبني منصة EduTrack — راجع المرحلة السابقة..."
4. **للحصول على أفضل نتيجة** مع Claude Code: أرفق ملف `schema.prisma` مع كل برومبت
5. **ترتيب النشر الموصى به**: 0 → 1 → 3 → 4 → 5 → 2 → 6 → 7 → 8 → 9 → 10
