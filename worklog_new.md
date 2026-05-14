
---
Task ID: 11
Agent: Main
Task: Add "Add Teacher" feature to the admin dashboard Teachers page

Work Log:
- Read existing TeachersView.tsx and /api/teachers/route.ts
- Added POST endpoint to /api/teachers/route.ts for creating new teachers
  - Validates all required fields (name, email, password, institutionId, level, subjectId)
  - Checks email uniqueness
  - Verifies subject belongs to the institution and level
  - Creates User + Teacher in sequence
  - Creates welcome notification for the new teacher
  - Creates notification for directors about the new teacher
  - Returns created teacher with full details (subject, supervisedSections)
- Completely rewrote TeachersView.tsx with:
  - "إضافة أستاذ" (Add Teacher) button alongside "دعوة بالبريد" (Invite by Email)
  - Full Add Teacher dialog with form fields:
    - Name (required)
    - Email (required)
    - Password (required, min 6 chars)
    - Phone (optional)
    - Level/طور (required - ابتدائي/متوسط/ثانوي)
    - Subject (required - filtered by selected level)
    - Specialization (optional)
  - Level filter tabs in the main view (الكل/ابتدائي/متوسط/ثانوي)
  - Updated teacher cards to show: level badge, subject, phone, specialization, supervised sections
  - Teacher Details dialog showing full info and supervised sections
  - Edit Teacher dialog with level/subject/phone/specialization fields
  - Level distribution stats in summary cards
  - Proper form reset on dialog close
- Tested API: Successfully created "سمير بوعكاز" teacher via POST
- Verified new teacher appears in GET /api/teachers list
- Verified new teacher can login with the created credentials

Stage Summary:
- Full "Add Teacher" feature implemented end-to-end
- API validates data, creates user+teacher, sends notifications
- UI has comprehensive form with level-dependent subject filtering
- Teacher cards now show level, subject, phone, supervised sections
- Level filter and stats in the teachers view
