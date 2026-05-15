# Admin Dashboard Component - Work Record

## Task
Create `AdminDashboard.tsx` component at `/home/z/my-project/src/components/edutrack/AdminDashboard.tsx`

## Summary
Created a comprehensive Arabic RTL admin dashboard component for the EduTrack platform. The component fetches real data from `/api/admin/dashboard` and displays it in a well-organized layout.

## Key Features Implemented
1. **KPI Cards** (2 rows of 4):
   - Row 1: Total Institutions (with active/frozen breakdown), Total Students, Total Teachers, Total Revenue (DZD)
   - Row 2: Active Subscriptions, Pending Payments, Student Growth %, Revenue Growth %
   - Each card has animated counter, trend indicators, gradient top bar, and hover effects

2. **Charts Section** (2 columns):
   - Left: Monthly Revenue Area Chart using Recharts with gradient fill
   - Right: Institutions by Plan Pie Chart (FREE=gray, BASIC=blue, PREMIUM=orange)

3. **Recent Activity**:
   - Recent Institutions table (name, city, plan badge, status badge, date)
   - Recent Payments table (institution, amount in DZD, plan badge, status badge, date)

4. **Users Distribution** section with role-based cards

5. **Quick Actions** (4 buttons):
   - Add Institution → admin-institutions
   - Manage Payments → admin-payments
   - Edit Landing Page → admin-landing
   - View Users → admin-users

## Styling Details
- Arabic RTL with `dir="rtl"`
- edutrack color scheme (#1A56DB primary, #F97316 secondary, #0F172A dark)
- shadcn/ui components (Card, Badge, Button, Table, Skeleton)
- framer-motion animations
- Recharts for charts (AreaChart, PieChart, Cell)
- Responsive grid layout
- Loading skeleton state
- Error state with retry button
- Frozen institution alert banner
- Payment status badges: PAID=green, PENDING=yellow, FAILED=red
- Plan badges: FREE=gray, BASIC=blue(edutrack-primary), PREMIUM=orange(edutrack-secondary)

## API Integration
- Fetches from `/api/admin/dashboard` with admin role header
- Handles the actual API response structure (nested objects for institutions, users, revenue, growth)
- No placeholder data - shows real API data or loading/error state
