# Task 9 - Layout & Auth Agent

## Task: Update DashboardLayout, store, login, and page routing

## Summary of Changes

### 1. `/home/z/my-project/src/store/useAppStore.ts`
- Added `director-notifications` and `teacher-notifications` to ViewType union
- Added `teacherId?: string` and `parentId?: string` to AuthUser interface

### 2. `/home/z/my-project/src/app/api/auth/login/route.ts`
- Added `teacherId` and `parentId` to login response
- Already had `include: { teacher: true, parent: true }` — just needed to expose the IDs

### 3. `/home/z/my-project/src/components/edutrack/NotificationsView.tsx` (NEW)
- Full notifications page component for director/teacher roles
- Fetches from `/api/notifications?userId=XXX` with pagination
- Groups by date (today, yesterday, this week, older)
- Mark individual as read (optimistic) + mark all as read
- Load-more pagination
- Type-specific icons: ABSENCE, INVOICE, CANCELLATION, ACTIVITY, SYSTEM, GENERAL

### 4. `/home/z/my-project/src/components/edutrack/DashboardLayout.tsx`
- Real notification bell with unread count badge
- Fetches from `/api/notifications?userId=XXX&unreadOnly=true` every 30s
- Uses `userIdRef` + internal function in `useEffect` to avoid lint errors
- `BellRing` icon + pulse animation when unread > 0
- Badge caps at 99+
- Click navigates to role-appropriate notifications view
- Added "الإشعارات" to director and teacher sidebar nav items
- "الإشعارات" also added to user dropdown menu with count badge
- Removed old hardcoded notification dropdown

### 5. `/home/z/my-project/src/app/page.tsx`
- Added `NotificationsView` dynamic import
- Added `director-notifications` → `<DashboardLayout><NotificationsView /></DashboardLayout>`
- Added `teacher-notifications` → `<DashboardLayout><NotificationsView /></DashboardLayout>`

## Lint Status
- Passes with no new errors (only pre-existing watchdog.js issues)
