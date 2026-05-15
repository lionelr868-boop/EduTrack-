# Task: ParentChildrenView Component

## Summary
Created `/home/z/my-project/src/components/edutrack/ParentChildrenView.tsx` — a comprehensive, RTL, Arabic-labeled component for parents to view detailed information about their children.

## What was done
1. **Created ParentChildrenView.tsx** with all required features:
   - `'use client'` directive
   - RTL layout (`dir="rtl"`)
   - All Arabic labels
   - Uses `useAppStore` from `@/store/useAppStore` for user state
   - Framer Motion animations (container stagger, item fade-in, card expand/collapse, chevron rotation)
   - Fetches data from `/api/parent/dashboard?userId=...`
   - Header with "أبنائي" title and UsersRound icon
   - Summary stats: total children, total absences, average attendance rate
   - Child cards in responsive grid (1 col mobile, 2 cols desktop)
   - Each card shows: profile with avatar/name/level badge/section badge/year badge, attendance summary (present/absent/late), attendance progress bar, unpaid invoices count
   - Expandable child detail view with: recent absences (last 5), recent activities/grades (last 5), quick links to schedule/absences/grades
   - Unpaid invoices summary banner
   - Empty state when no children
   - Level colors: ابتدائي=emerald, متوسط=sky, ثانوي=rose
   - Gradient card headers per level
   - Loading skeleton

2. **Integration**: The component was already referenced in `page.tsx` (line 31: `dynamic(() => import('@/components/edutrack/ParentChildrenView'))`), and `DashboardLayout.tsx` already includes the sidebar nav item for "أبنائي" pointing to `parent-children` view. No additional integration needed.

3. **Lint**: Clean — no errors or warnings in the new component.

## API Used
- `GET /api/parent/dashboard?userId=xxx` — already existed, returns all needed data
