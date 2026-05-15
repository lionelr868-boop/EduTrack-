---
Task ID: 1
Agent: Main Agent
Task: Create system admin dashboard, payment system, institution freezing, and teacher registration

Work Log:
- Updated Prisma schema with: frozen/frozenAt/frozenReason/maxStudents/subscriptionExpiresAt on Institution, active on User, Payment model, LandingContent model
- Pushed schema changes and seeded database with admin user (admin@edutrack.dz/demo123), 6 payments, 6 landing content sections
- Created 9 API routes: admin/dashboard, admin/institutions, admin/institutions/[id], admin/payments, admin/payments/[id], admin/landing, admin/users, auth/register-teacher
- Updated auth/login route to support ADMIN role, check frozen institutions, check user.active status
- Created AdminDashboard.tsx with KPI cards, charts (monthly revenue, institutions by plan), recent activity tables, quick actions
- Created AdminInstitutionsView.tsx with search/filter, freeze/unfreeze dialogs, change plan dialog, add institution dialog, detail sheet
- Created AdminPaymentsView.tsx with summary cards, filter bar, payments table, create payment dialog, mark paid/failed/refund actions
- Created AdminLandingView.tsx with section management, toggle enable/disable, edit content, reorder, preview mode
- Created AdminUsersView.tsx with search, role filter, paginated table, activate/deactivate toggle, detail dialog
- Created AdminSettingsView.tsx with platform config, system settings, password change, danger zone
- Created TeacherRegisterPage.tsx with 4-step wizard: personal info → select institution → level & subject → review & submit
- Updated DashboardLayout with admin navigation items, admin header badge, ADMIN role support
- Updated LoginPage with ADMIN role selector (4 columns), admin demo credentials, teacher registration button
- Updated useAppStore with admin views and ADMIN role
- Updated page.tsx with all new view imports and switch cases

Stage Summary:
- Full system admin dashboard with real data KPIs
- Institution freeze/unfreeze cascading to director/teacher accounts
- Payment management system between institutions and admin
- Landing page content management for admin
- User management across all institutions
- Teacher self-registration flow with institution/subject selection
- All APIs verified working, all components lint-clean
- Demo credentials: admin@edutrack.dz / demo123
