# Admin Institutions View - Work Record

## Task
Create AdminInstitutionsView.tsx component for the EduTrack platform admin panel.

## What was done

### 1. API Updates
- Updated `/src/app/api/admin/institutions/[id]/route.ts` PATCH endpoint to accept both `freeze` and `frozen` field names for freeze/unfreeze operations, matching the API spec.

### 2. Component Created
- Created `/src/components/edutrack/AdminInstitutionsView.tsx` - a comprehensive Arabic RTL view for managing institutions

### Features Implemented
1. **Search & Filter Bar** - Search by name/city, plan filter (ALL/FREE/BASIC/PREMIUM), status filter (ALL/Active/Frozen)
2. **Summary Cards** - Total institutions, active count, frozen count, total students
3. **Desktop Table View** - Full table with institution info, plan badges, status badges, counts, and action buttons
4. **Mobile Cards View** - Responsive card layout for mobile devices
5. **Freeze/Unfreeze Dialog** - AlertDialog with reason input (required for freezing), confirmation for unfreezing, shows previous reason
6. **Change Plan Dialog** - Select new plan with detailed plan features preview, prevents selecting current plan
7. **Add Institution Dialog** - Form with name (required), address, phone, email, plan selection with plan features preview
8. **Institution Detail Sheet** - Side panel with full institution info, statistics grid, financial summary, user list, quick actions
9. **Pagination** - Page navigation with page number buttons

### Database
- Added sample data: 8 institutions total with varied plans (FREE, BASIC, PREMIUM) and states (active/frozen)
- 2 frozen institutions with reasons

### Styling
- Arabic RTL with `dir="rtl"`
- Plan badges: FREE=gray, BASIC=teal, PREMIUM=orange
- Frozen badge: red with Snowflake icon
- Active badge: green with CheckCircle icon
- Framer Motion animations
- Responsive: cards on mobile, table on desktop
- Uses shadcn/ui components throughout

### API Endpoints Used
- `GET /api/admin/institutions` - List with search, plan, frozen filters, pagination
- `POST /api/admin/institutions` - Create new institution
- `PATCH /api/admin/institutions/[id]` - Freeze/unfreeze, change plan
- `GET /api/admin/institutions/[id]` - Get full institution detail

### No TypeScript errors in the component
