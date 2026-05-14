# Task 7-a: Build Remaining Director Dashboard Views

## Summary
Built 4 remaining views for the EduTrack Director Dashboard: Students, Teachers, Reports, and Settings. All components are 'use client', RTL Arabic, use framer-motion animations, shadcn/ui components, and the EduTrack color scheme (#1A56DB primary, #F97316 secondary).

## Components Created

### 1. StudentsView (`/src/components/edutrack/StudentsView.tsx`)
- Header with search input and "إضافة تلميذ" button
- Summary cards: total students, primary level count, middle level count
- Students table with columns: الاسم, المستوى, ولي الأمر, تاريخ التسجيل, إجراءات
- Search/filter by name and level with pagination
- Add/Edit Student dialog with name, level select, parent dropdown
- Delete confirmation dialog
- API integration with `/api/students`

### 2. TeachersView (`/src/components/edutrack/TeachersView.tsx`)
- Header with search and "دعوة أستاذ" button
- Summary cards: total teachers, active, disabled
- Card-based grid layout (instead of table) with avatar, name, subjects, email, status badge
- Edit/Disable action buttons per card
- Invite Teacher dialog with email input and multi-select subjects (pill toggles)
- Edit Teacher dialog with subject selection
- API integration with `/api/teachers` and `/api/teachers/invite`

### 3. ReportsView (`/src/components/edutrack/ReportsView.tsx`)
- Tabs: يومي / شهري / تلميذ / أستاذ
- Daily Report: date selector, sessions stats cards, student/teacher absences lists, notifications count
- Monthly Report: month/year selector, summary cards with comparison to previous month (%), revenue, attendance
- Student Report: student selector, attendance line chart (recharts), low attendance subjects with progress bars, absences timeline
- Teacher Report: teacher selector, sessions stats, levels taught, bar chart (completed vs absent)
- Generate Report and Export PDF buttons

### 4. SettingsView (`/src/components/edutrack/SettingsView.tsx`)
- Tabs: معلومات المؤسسة / الأسعار / الإشعارات / الاشتراك
- Institution Info: logo upload area, name, address, phone with save
- Pricing: pricing table with add/edit/delete, dialog for subject×level×price
- Notifications: SMS toggle switch, customizable message templates (absence, invoice, reminder)
- Subscription: current plan card, upgrade options (Free/Basic/Premium) with feature lists

## API Routes Created

### Students API
- `GET /api/students` - List students with filters (institutionId, search, level, page, limit)
- `POST /api/students` - Create student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student
- `GET /api/students/parents` - List parents for dropdown

### Teachers API
- `GET /api/teachers` - List teachers with search
- `POST /api/teachers/invite` - Invite/create teacher
- `GET /api/teachers/subjects` - List subjects for selection

### Reports API
- `GET /api/reports` - Generate reports (daily, monthly, student, teacher) with type param

### Settings API
- `GET /api/settings` - Get institution settings
- `PUT /api/settings` - Update institution settings
- `GET /api/settings/pricing` - List pricing rows
- `POST /api/settings/pricing` - Create pricing row
- `PUT /api/settings/pricing/[id]` - Update pricing row
- `DELETE /api/settings/pricing/[id]` - Delete pricing row

## Page.tsx Updates
- Added imports for StudentsView, TeachersView, ReportsView, SettingsView, BillingView
- Added route cases for: director-students, director-teachers, director-billing, director-reports, director-settings

## Lint Status
- ✅ No errors (only pre-existing font warning)
- Fixed React hooks lint issue in ReportsView by restructuring useEffect

## Dev Server
- Running successfully on port 3000
