# Task 6: EduTrack Billing/Invoicing System

## Summary
Built the complete Billing and Invoicing system for EduTrack, including:
- Database schema with InvoiceLineItem model
- 4 API routes for invoice CRUD operations
- BillingView component for directors
- ParentInvoicesView component for parents
- Integration with existing DashboardLayout and navigation

## Files Created/Modified

### New Files
1. `/home/z/my-project/src/app/api/invoices/route.ts` - GET invoices with filters, pagination, and summary stats
2. `/home/z/my-project/src/app/api/invoices/generate/route.ts` - POST to generate invoices for all students
3. `/home/z/my-project/src/app/api/invoices/[id]/route.ts` - GET/PUT individual invoice
4. `/home/z/my-project/src/app/api/invoices/[id]/mark-paid/route.ts` - PUT mark invoice as paid
5. `/home/z/my-project/src/components/edutrack/BillingView.tsx` - Director billing page
6. `/home/z/my-project/src/components/edutrack/ParentInvoicesView.tsx` - Parent invoices view

### Modified Files
1. `/home/z/my-project/prisma/schema.prisma` - Added InvoiceLineItem model, updated Invoice relation
2. `/home/z/my-project/src/app/page.tsx` - Added BillingView and ParentInvoicesView imports and routes

## Key Features Implemented

### BillingView (Director)
- Header with month/year selector and "توليد فواتير الشهر" button
- 4 summary cards: إجمالي الإيرادات, الفواتير المدفوعة, الفواتير المعلقة, الفواتير المتأخرة
- Invoices table with columns: التلميذ, الشهر, عدد الحصص, الغيابات, التعويضية, المبلغ, الحالة, إجراءات
- Status badges: مدفوعة (green), معلقة (orange), متأخرة (red)
- Filters by status, level, and search by student name
- Pagination
- Mark as paid dialog with payment date and method
- Invoice detail dialog with line items table
- Generate invoices dialog with month/year selector and progress indicator
- All text in Arabic with Inter font for numbers
- Framer Motion animations throughout

### ParentInvoicesView (Parent)
- Latest invoice card with large amount and color-coded status
- Expandable invoice list with status badges
- Invoice detail dialog with line items
- PDF download buttons
- Mobile-friendly responsive design
- Color-coded status: مدفوعة ✓ (green), معلقة ⏳ (orange), متأخرة ⚠ (red)

### API Routes
- GET /api/invoices - Fetch with filters (institutionId, month, year, status, level, search, pagination)
- POST /api/invoices/generate - Generate invoices for all students with subject-based line items
- GET /api/invoices/[id] - Get invoice details with line items
- PUT /api/invoices/[id] - Update invoice
- PUT /api/invoices/[id]/mark-paid - Mark invoice as paid with payment method and date

### Database
- Added InvoiceLineItem model with fields: subjectName, totalSessions, absentSessions, pricePerSession, subtotal
- Seeded 50 line items for existing 20 invoices

## Technical Notes
- RTL direction (Arabic) throughout
- Color scheme: Primary #1A56DB, Secondary #F97316, Dark #0F172A
- Font: Noto Kufi Arabic + Inter for numbers
- Framer Motion for all animations
- shadcn/ui components used: Table, Dialog, Select, Button, Input, Badge, Card, Progress, Separator, Label
- Amounts formatted with comma separators and "دج" suffix
- All components are 'use client'
