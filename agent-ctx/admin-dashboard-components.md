# Task: Admin Dashboard Components for EduTrack

## Summary
Created 3 major admin dashboard components for the EduTrack Arabic RTL educational management platform, along with supporting API routes and placeholder components.

## Components Created

### 1. AdminLandingView.tsx (`/src/components/edutrack/AdminLandingView.tsx`)
- Landing page content management for the admin
- Features: section list with toggle enable/disable, edit dialog (title, subtitle, content), reorder sections (up/down), preview mode toggle, create missing sections
- Sections: hero, features, pricing, testimonials, stats, footer
- Each section has unique color coding and icon
- Uses `GET /api/admin/landing` and `PUT /api/admin/landing`
- Arabic RTL layout with framer-motion animations

### 2. AdminUsersView.tsx (`/src/components/edutrack/AdminUsersView.tsx`)
- User management across all institutions
- Features: search by name/email (debounced), role filter (ALL, DIRECTOR, TEACHER, PARENT, ADMIN), paginated users table, deactivate/activate toggle, user detail dialog
- Role badges with colors: DIRECTOR=blue, TEACHER=orange, PARENT=green, ADMIN=purple
- Shows teacher details (subject, level) and parent details (student count, phone)
- Uses `GET /api/admin/users?search=&role=&page=&limit=` and `PUT /api/admin/users`
- Pagination with smart page number display

### 3. AdminSettingsView.tsx (`/src/components/edutrack/AdminSettingsView.tsx`)
- Admin settings with 4 tabs: Platform, System, Security, Danger Zone
- Platform config: site name, description, contact info, system info display
- System settings: maintenance mode toggle, registration enabled toggle
- Password change form with strength indicator and match validation
- Danger zone: reset database button with confirmation text input (visual only)
- Uses `PUT /api/admin/settings` and `POST /api/auth/change-password`

## API Routes

### PUT /api/admin/users (added to existing route)
- Body: `{ userId: string, active: boolean }`
- Toggles user active/deactivated status
- Admin-only access

### /api/admin/settings (new route)
- GET: Returns platform settings (in-memory storage)
- PUT: Updates platform or system settings
- Body: `{ type: "platform"|"system", ...fields }`

## Placeholder Components Created
- AdminDashboard.tsx - Simple stats dashboard
- AdminInstitutionsView.tsx - Placeholder
- AdminPaymentsView.tsx - Placeholder
- TeacherRegisterPage.tsx - Placeholder

## Styling
- All components use `'use client'` directive
- shadcn/ui components: Card, Badge, Button, Input, Switch, Select, Label, Textarea, Separator, Table, Dialog, Tabs, AlertDialog
- framer-motion for animations
- lucide-react icons
- Arabic RTL layout (`dir="rtl"`)
- Responsive design
- All text in Arabic
- Uses `useAppStore` from `@/store/useAppStore`

## Lint Status
Only pre-existing errors (watchdog.js require imports, layout.tsx font warning). No new errors from the created components.
