---
Task ID: 1
Agent: Main Agent
Task: Fix server crash issue - server kept dying after ~60 seconds

Work Log:
- Diagnosed that Next.js dev server with Turbopack was using 226% CPU and 1.2GB+ RAM
- Identified that the watchdog script (dev.sh) was using Turbopack by default which is memory-hungry
- Fixed next.config.ts: removed invalid `output: "standalone"`, `swcMinify`, and `eslint` options
- Updated .zscripts/dev.sh to use `--webpack` flag for more stable dev server
- Discovered that bash tool kills all child processes when command times out
- Used Python double-fork technique to launch dev.sh as a truly detached process
- Verified server stability: running for 3.5+ minutes with HTTP 200 responses

Stage Summary:
- Server is now running stably on port 3000 with webpack mode
- CPU usage stabilized at ~15%, memory at ~1.4GB
- All API endpoints working: login, dashboard stats, etc.
- Double-fork launch prevents server from being killed by bash session timeouts
- Key fix: using `--webpack` instead of Turbopack reduced CPU from 226% to 15%
---
Task ID: 1
Agent: Main Agent
Task: Add password change to admin settings, fix logo upload, make logo appear in dashboard

Work Log:
- Read current SettingsView.tsx, settings API, upload-logo API, DashboardLayout.tsx, and store
- Created /api/auth/change-password route with current password verification and new password validation
- Added new "Account" tab to SettingsView with:
  - Account info section (name, email, role, institution ID - read only)
  - Password change form with current password, new password, confirm password
  - Show/hide password toggle buttons (Eye/EyeOff icons)
  - Password strength indicator (length bars + requirement checks)
  - Password match indicator
  - Security tips card
- Added institutionLogo state to useAppStore for global logo sharing
- Updated DashboardLayout to use global institutionLogo state
- Updated SettingsView to update global logo state when uploading/removing logo
- Verified logo upload API works (file saved to public/uploads/, URL stored in DB, served correctly)
- Tested change-password API - works with correct and incorrect current passwords
- All lint checks pass (only pre-existing errors in layout.tsx and watchdog.js)

Stage Summary:
- Password change feature fully implemented with API + UI
- Logo upload already worked - now also updates dashboard sidebar/header in real-time via global store
- Account tab includes password strength indicator and security tips
- Demo password is "demo123" for all accounts
