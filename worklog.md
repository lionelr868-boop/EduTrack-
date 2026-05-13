---
Task ID: 1
Agent: Main Agent
Task: Make landing page data real, dynamic, and connected to platform development

Work Log:
- Analyzed current LandingPage.tsx - found all data was hardcoded (500+ institutions, 10000+ students, 99.9% uptime, etc.)
- Created `/api/platform/stats` API route that queries real database for aggregate statistics
- Created `prisma/seed.ts` with realistic demo data (12 institutions, 24 teachers, 28 students, 97 sessions, 84 invoices, etc.)
- Ran `bun run db:push` and `bun run prisma/seed.ts` to populate database
- Updated LandingPage component with:
  - `usePlatformStats()` hook that fetches real data from `/api/platform/stats` with 2-minute auto-refresh
  - Hero badge now shows live institution count (e.g., "12 مؤسسة نشطة الآن")
  - Dashboard mockup shows real student/teacher/attendance data instead of hardcoded "247", "89", "96%"
  - Chart in mockup uses real monthly revenue data with month labels
  - Stats counter now shows 4 real metrics (institutions, students, teachers, attendance rate)
  - Added new "Live Activity" section showing real-time platform events (absences, payments, registrations)
  - Testimonials section now uses real institution names from the database
  - CTA section institution count is dynamic
- Fixed TypeScript errors in API route (monthlyGrowth type, teacher.user relation)

Stage Summary:
- Landing page now displays REAL data from the database via `/api/platform/stats` API
- Data auto-refreshes every 2 minutes to stay current
- New "Live Activity" section shows real platform events
- All numbers on landing page reflect actual database records
- Demo data includes 12 institutions, 28 students, 24 teachers, 97 sessions, 84 invoices
