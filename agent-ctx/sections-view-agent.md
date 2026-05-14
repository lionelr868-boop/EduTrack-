# Task: SectionsView Component Creation

## Summary
Created a comprehensive SectionsView (الأقسام) management component for the EduTrack Arabic RTL educational platform, including all required API routes and full integration.

## Files Created

### 1. `/src/components/edutrack/SectionsView.tsx`
- Full hierarchical view: Level → Years → Sections
- Grouped by level: ابتدائي (blue), متوسط (emerald), ثانوي (purple)
- Expandable/collapsible levels and years with Framer Motion animations
- Summary stats cards at top: total years, total sections, total students
- Section CRUD dialogs (Add/Edit) with name, year dropdown, capacity, supervisor dropdown
- Year CRUD dialogs (Add/Edit) with name, level, order
- Delete confirmation dialogs for both sections and years
- Progress bars for fill capacity per section
- Color-coded badges and icons per level
- Responsive grid layout for section cards
- Uses useAppStore for user data (institutionId)
- Proper Arabic RTL design with dir="rtl"

### 2. `/src/app/api/sections/route.ts` (Modified)
- Added POST handler for creating new sections
- Validates: name, yearId, institutionId, supervisorId
- Verifies year belongs to institution
- Returns created section with supervisor and student count

### 3. `/src/app/api/sections/[id]/route.ts` (New)
- PUT handler for updating sections (name, capacity, supervisorId, yearId)
- DELETE handler for deleting sections (checks for students first)

### 4. `/src/app/api/years/route.ts` (Modified)
- Added POST handler for creating new years
- Validates: name, level, institutionId, order
- Checks for duplicate names within same level
- Returns created year with sections

### 5. `/src/app/api/years/[id]/route.ts` (New)
- PUT handler for updating years (name, level, order)
- DELETE handler with cascade safety check (prevents deletion if sections have students)

## Files Modified

### 6. `/src/store/useAppStore.ts`
- Added `'director-sections'` to ViewType union

### 7. `/src/app/page.tsx`
- Added dynamic import for SectionsView
- Added route case for `'director-sections'`

### 8. `/src/components/edutrack/DashboardLayout.tsx`
- Added Building2 import from lucide-react
- Added "الأقسام" nav item with Building2 icon for director role
- Placed between "الطلاب" and "الأساتذة" in sidebar navigation

## Design Decisions
- Used custom expandable sections (not Accordion) for better Framer Motion integration
- Level colors: ابتدائي=blue, متوسط=emerald, ثانوي=purple (as specified)
- Section cards show: name, student count/capacity with progress bar, supervisor name
- Over-capacity sections shown in red, near-capacity in amber
- Year delete cascade warning in confirmation dialog
- Section delete prevented if students exist (returns error)
- Year delete prevented if any section has students (returns error)
