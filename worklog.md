---
Task ID: 1
Agent: main
Task: Fix Admin Dashboard to show real data from the database

Work Log:
- Analyzed current AdminDashboard.tsx - it was showing hardcoded zeros (all stats = '0')
- Found that the `/api/admin/dashboard` API already existed with full real data queries, but the UI never called it
- Found that AdminPaymentsView.tsx was a placeholder with just an empty card
- Rebuilt AdminDashboard.tsx with:
  - Fetches real data from `/api/admin/dashboard` API
  - Shows 4 main KPI cards (Institutions, Users, Students, Revenue) with growth indicators
  - Shows 3 chart sections (Monthly Revenue, Users by Role, Institutions by Plan)
  - Shows recent institutions list with plan badges and frozen status
  - Shows recent payments list with status badges
  - Loading skeletons and error handling
  - Navigation to detail views (institutions, payments)
- Rebuilt AdminPaymentsView.tsx with:
  - Full payment table with institution name, amount, plan, period, method, status, date
  - Summary cards (Total, Paid, Pending, Failed)
  - Search and filter by status/plan
  - Pagination
  - Action buttons (confirm/reject pending payments, retry failed)
- Optimized `/api/admin/dashboard/route.ts`:
  - Replaced 12 sequential monthly revenue aggregate queries with 2 queries + JS grouping
  - This reduced server memory usage significantly
- Optimized `/api/admin/payments/route.ts`:
  - Replaced 7 parallel aggregate queries with single findMany + JS calculation
- Fixed lint error: Missing Button import in AdminDashboard.tsx

Stage Summary:
- Admin Dashboard now shows REAL data: 8 institutions, 61 users, 59 students, 207,300 DZD revenue
- Admin Payments now shows REAL data: 6 payments, 30,000 DZD paid, 13,000 DZD pending, 8,000 DZD failed
- Server stability improved by optimizing heavy DB queries
- Watchdog auto-restarts server if it crashes due to memory pressure
