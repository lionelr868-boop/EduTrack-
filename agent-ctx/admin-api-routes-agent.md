# Task: Admin Dashboard API Routes

## Summary
Created 8 API route files for the system admin dashboard and 1 updated file.

## Files Created

1. **`/home/z/my-project/src/app/api/admin/dashboard/route.ts`** - GET endpoint for admin dashboard stats including institution counts, user counts by role, student/teacher/parent totals, revenue metrics, recent institutions & payments, monthly revenue trend (6 months), and platform growth metrics. ADMIN role only.

2. **`/home/z/my-project/src/app/api/admin/institutions/route.ts`** - GET: List all institutions with stats (students, teachers, plan, frozen status, revenue), search/filter via query params (search, plan, frozen, city, pagination). POST: Create new institution with optional director user creation.

3. **`/home/z/my-project/src/app/api/admin/institutions/[id]/route.ts`** - GET: Full institution details with users, subjects, payments, revenue/invoice stats. PATCH: Update institution including freeze/unfreeze logic (sets frozenAt and frozenReason on freeze, clears them on unfreeze).

4. **`/home/z/my-project/src/app/api/admin/payments/route.ts`** - GET: List all payments with institution info, filter by status/institution/plan, includes summary stats. POST: Create payment for an institution with validation.

5. **`/home/z/my-project/src/app/api/admin/payments/[id]/route.ts`** - PATCH: Update payment status (PAID, FAILED, REFUNDED). When marking as paid: sets paidAt, updates institution subscriptionPlan and subscriptionExpiresAt, unfreezes institution.

6. **`/home/z/my-project/src/app/api/admin/landing/route.ts`** - GET: List all landing content ordered by order field. POST: Create new landing content section (validates uniqueness). PUT: Update landing content by id or section name.

7. **`/home/z/my-project/src/app/api/admin/users/route.ts`** - GET: List all users across institutions with role, institution name, teacher/parent details. Supports search, role filter, institution filter, pagination.

8. **`/home/z/my-project/src/app/api/auth/register-teacher/route.ts`** - POST: Register new teacher. Validates institution exists and is not frozen, validates subject belongs to institution, checks email uniqueness. Creates User with role=TEACHER and Teacher record.

## Files Updated

9. **`/home/z/my-project/src/app/api/auth/login/route.ts`** - Updated to:
   - Support ADMIN role (returns redirect to /admin-dashboard)
   - Check if user's institution is frozen (for DIRECTOR and TEACHER roles) - returns 403 with frozenReason
   - Check if user.active is false - returns 403
   - Returns institutionFrozen flag in response
   - Includes institution info in response for non-admin users

## Technical Details
- All admin routes check `x-user-role` header for ADMIN authorization
- All user-facing messages are in Arabic
- Uses `import { db } from '@/lib/db'` for database access
- Uses `import { NextRequest, NextResponse } from 'next/server'`
- Dynamic routes use `params: Promise<{ id: string }>` pattern for Next.js 16
- All responses are JSON
- Lint passes (only pre-existing errors in watchdog.js and layout.tsx warning)
