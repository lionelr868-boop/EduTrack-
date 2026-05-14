# Task: Rewrite StudentsView.tsx with Enhanced Features

## Task ID: students-view-enhancement

## Summary of Changes

### 1. Prisma Schema Update (`prisma/schema.prisma`)
Added 4 new fields to the Student model:
- `dateOfBirth DateTime?` - Student's date of birth
- `gender String?` - ذكر / أنثى
- `phone String?` - Student's phone number
- `address String?` - Student's address

Ran `npx prisma db push --accept-data-loss` successfully.

### 2. Students API Route Update (`src/app/api/students/route.ts`)
- Updated POST handler to accept new fields: `dateOfBirth`, `gender`, `phone`, `address`, `sectionId`
- All new fields are optional and default to null

### 3. Students [id] API Route Update (`src/app/api/students/[id]/route.ts`)
- Added GET handler that returns full student detail with:
  - Parent info (name, email, phone)
  - Section with year info
  - Recent absences (last 20)
  - Recent attendances (last 20)
  - Recent invoices with line items (last 10)
  - Recent activities with teacher info (last 10)
  - Computed attendance summary (total, present, absent, late, attendanceRate)
- Updated PUT handler to support all new fields: `name`, `level`, `sectionId`, `parentId`, `dateOfBirth`, `gender`, `phone`, `address`

### 4. StudentsView.tsx Complete Rewrite (`src/components/edutrack/StudentsView.tsx`)

#### New Features:
1. **Student Detail Sheet** (slide-in from right):
   - Opens when clicking any student row
   - Shows comprehensive student info with 4 tabs:
     - المعلومات (Info): Personal details, parent info
     - الحضور (Attendance): Summary cards + recent attendance records
     - الفواتير (Invoices): Recent invoices with line items
     - الأنشطة (Activities): Recent student activities with grades
   - Edit button to switch to inline edit mode within the sheet
   - All edit fields available in the detail sheet

2. **Enhanced Add/Edit Dialog**:
   - اسم التلميذ (Name) * - required
   - تاريخ الميلاد (Date of Birth) - date input
   - الجنس (Gender) - ذكر/أنثى select
   - المستوى (Level) * - required, resets section when changed
   - القسم (Section) - filtered by selected level
   - ولي الأمر (Parent) - dropdown
   - رقم هاتف التلميذ (Student phone) - optional
   - عنوان السكن (Address) - optional

3. **Section Filter**:
   - New section dropdown alongside existing level filter
   - When level is selected, section dropdown shows only sections belonging to years of that level
   - When section is selected, only students in that section are shown
   - Section filter resets when level changes
   - Section format: "Year Name - Section Name"

4. **Clickable Student Rows**:
   - Entire row is clickable to open detail sheet
   - Edit/Delete buttons still work with click event stopPropagation

5. **Additional Table Columns**:
   - Added القسم (Section) column showing year name + section name
   - Gender shown below student name

#### Visual Improvements:
- Detail sheet uses gradient header with avatar
- Color-coded attendance summary cards
- Invoice cards with line items breakdown
- Activity badges with type-specific colors
- Proper Arabic RTL formatting throughout

## Build Verification
- `npx next build` completed successfully with no errors
- All TypeScript compilation passes for modified files
- Prisma schema synced with database
