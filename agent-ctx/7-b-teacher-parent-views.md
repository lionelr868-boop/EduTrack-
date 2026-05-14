# Task 7-b: Teacher Panel + Parent Portal Views

## Summary
Built all 7 component files and 2 API routes for the EduTrack Teacher and Parent portals.

## Components Created

### Teacher Portal
1. **TeacherDashboard.tsx** - Main dashboard with welcome section, today's sessions (4 cards with color-coded status), quick stats (3 cards: attendance 89%, unregistered sessions 2, student count 20), weekly attendance bar chart (recharts), and recent absence alerts list.

2. **TeacherStudentsView.tsx** - Student list with attendance rate per student, warning badge for >20% absences (yellow for <80%, red for <70%), search by name, student detail dialog with attendance history.

3. **TeacherAbsenceRequest.tsx** - Self-absence report form with date picker (calendar popover), reason textarea, "هل يمكن تعويضها؟" switch toggle, submit button, and previous requests list.

### Parent Portal (Mobile-First)
4. **ParentDashboard.tsx** - Child card with initials avatar and level badge, today's status (2 cards: has sessions? / attended?), latest notification card with red accent, quick actions grid (4 big icon buttons), bottom navigation bar (5 tabs, fixed at bottom).

5. **ParentScheduleView.tsx** - Weekly schedule in list view (not grid) for mobile friendliness, day sections with session cards, color-coded by status: green=attended, red=absent, grey=cancelled, right-border accent.

6. **ParentAbsencesView.tsx** - Timeline-style absence list with connecting line and dots, each item shows date, subject, teacher, notification status (bell icon), summary card at top.

7. **ParentNotificationsView.tsx** - Notification list with unread highlighted (blue left border + dot), click to mark as read (optimistic update), type icons (red=absence, orange=invoice, blue=general), "mark all as read" button, relative time display.

## API Routes Created
1. **`/api/teacher/absence-request/route.ts`** (POST) - Creates absence record, finds affected sessions by teacher + day, notifies director and parents of affected students.

2. **`/api/parent/notifications/route.ts`** (GET, PUT) - GET fetches notifications for a user, PUT marks single or all notifications as read.

## Design Implementation
- All text in Arabic (RTL)
- EduTrack color scheme (#1A56DB primary, #F97316 secondary)
- framer-motion animations (staggered container/item variants, page transitions)
- shadcn/ui components (Card, Badge, Dialog, Calendar, Switch, Progress, etc.)
- Lucide React icons
- Parent portal is mobile-first with 44px+ touch targets and fixed bottom navigation bar
- Teacher dashboard is professional and efficient with data visualizations
