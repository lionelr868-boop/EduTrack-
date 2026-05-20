'use client';

import dynamic from 'next/dynamic';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'framer-motion';

// Dynamically import all views to reduce initial bundle and prevent server overload
const LandingPage = dynamic(() => import('@/components/edutrack/LandingPage'), { ssr: false });
const LoginPage = dynamic(() => import('@/components/edutrack/LoginPage'), { ssr: false });
const RegisterPage = dynamic(() => import('@/components/edutrack/RegisterPage'), { ssr: false });
const ParentRegisterPage = dynamic(() => import('@/components/edutrack/ParentRegisterPage'), { ssr: false });
const DashboardLayout = dynamic(() => import('@/components/edutrack/DashboardLayout'), { ssr: false });
const DirectorDashboard = dynamic(() => import('@/components/edutrack/DirectorDashboard'), { ssr: false });
const ScheduleView = dynamic(() => import('@/components/edutrack/ScheduleView'), { ssr: false });
const StudentsView = dynamic(() => import('@/components/edutrack/StudentsView'), { ssr: false });
const TeachersView = dynamic(() => import('@/components/edutrack/TeachersView'), { ssr: false });
const AbsencesView = dynamic(() => import('@/components/edutrack/AbsencesView'), { ssr: false });
const BillingView = dynamic(() => import('@/components/edutrack/BillingView'), { ssr: false });
const ReportsView = dynamic(() => import('@/components/edutrack/ReportsView'), { ssr: false });
const SettingsView = dynamic(() => import('@/components/edutrack/SettingsView'), { ssr: false });
const AttendanceView = dynamic(() => import('@/components/edutrack/AttendanceView'), { ssr: false });
const TeacherDashboard = dynamic(() => import('@/components/edutrack/TeacherDashboard'), { ssr: false });
const TeacherStudentsView = dynamic(() => import('@/components/edutrack/TeacherStudentsView'), { ssr: false });
const TeacherAbsenceRequest = dynamic(() => import('@/components/edutrack/TeacherAbsenceRequest'), { ssr: false });
const TeacherAbsencesView = dynamic(() => import('@/components/edutrack/TeacherAbsencesView'), { ssr: false });
const ParentDashboard = dynamic(() => import('@/components/edutrack/ParentDashboard'), { ssr: false });
const ParentScheduleView = dynamic(() => import('@/components/edutrack/ParentScheduleView'), { ssr: false });
const ParentAbsencesView = dynamic(() => import('@/components/edutrack/ParentAbsencesView'), { ssr: false });
const ParentInvoicesView = dynamic(() => import('@/components/edutrack/ParentInvoicesView'), { ssr: false });
const ParentNotificationsView = dynamic(() => import('@/components/edutrack/ParentNotificationsView'), { ssr: false });
const ParentSettingsView = dynamic(() => import('@/components/edutrack/ParentSettingsView'), { ssr: false });
const ParentGradesView = dynamic(() => import('@/components/edutrack/ParentGradesView'), { ssr: false });
const ParentChildrenView = dynamic(() => import('@/components/edutrack/ParentChildrenView'), { ssr: false });
const NotificationsView = dynamic(() => import('@/components/edutrack/NotificationsView'), { ssr: false });
const SectionsView = dynamic(() => import('@/components/edutrack/SectionsView'), { ssr: false });
const MessagingView = dynamic(() => import('@/components/edutrack/MessagingView'), { ssr: false });
const ParentMessagingView = dynamic(() => import('@/components/edutrack/ParentMessagingView'), { ssr: false });
const TeacherSettingsView = dynamic(() => import('@/components/edutrack/TeacherSettingsView'), { ssr: false });
const AdminDashboard = dynamic(() => import('@/components/edutrack/AdminDashboard'), { ssr: false });
const AdminInstitutionsView = dynamic(() => import('@/components/edutrack/AdminInstitutionsView'), { ssr: false });
const AdminPaymentsView = dynamic(() => import('@/components/edutrack/AdminPaymentsView'), { ssr: false });
const AdminLandingView = dynamic(() => import('@/components/edutrack/AdminLandingView'), { ssr: false });
const AdminUsersView = dynamic(() => import('@/components/edutrack/AdminUsersView'), { ssr: false });
const AdminSettingsView = dynamic(() => import('@/components/edutrack/AdminSettingsView'), { ssr: false });
const TeacherRegisterPage = dynamic(() => import('@/components/edutrack/TeacherRegisterPage'), { ssr: false });

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-edutrack-light">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-edutrack-primary/20 border-t-edutrack-primary animate-spin" />
        <p className="text-sm text-edutrack-dark/50 font-arabic">جاري التحميل...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  const renderView = (view: ViewType) => {
    switch (view) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'register-parent':
        return <ParentRegisterPage />;

      // Director views
      case 'director-dashboard':
        return <DashboardLayout><DirectorDashboard /></DashboardLayout>;
      case 'director-schedule':
        return <DashboardLayout><ScheduleView mode="director" /></DashboardLayout>;
      case 'director-students':
        return <DashboardLayout><StudentsView /></DashboardLayout>;
      case 'director-teachers':
        return <DashboardLayout><TeachersView /></DashboardLayout>;
      case 'director-absences':
        return <DashboardLayout><AbsencesView /></DashboardLayout>;
      case 'director-billing':
        return <DashboardLayout><BillingView /></DashboardLayout>;
      case 'director-reports':
        return <DashboardLayout><ReportsView /></DashboardLayout>;
      case 'director-settings':
        return <DashboardLayout><SettingsView /></DashboardLayout>;
      case 'director-notifications':
        return <DashboardLayout><NotificationsView /></DashboardLayout>;
      case 'director-sections':
        return <DashboardLayout><SectionsView /></DashboardLayout>;
      case 'director-messages':
        return <DashboardLayout><MessagingView /></DashboardLayout>;

      // Teacher views
      case 'teacher-dashboard':
        return <DashboardLayout><TeacherDashboard /></DashboardLayout>;
      case 'teacher-schedule':
        return <DashboardLayout><ScheduleView mode="teacher" /></DashboardLayout>;
      case 'teacher-attendance':
        return <DashboardLayout><AttendanceView /></DashboardLayout>;
      case 'teacher-students':
        return <DashboardLayout><TeacherStudentsView /></DashboardLayout>;
      case 'teacher-absence-request':
        return <DashboardLayout><TeacherAbsenceRequest /></DashboardLayout>;
      case 'teacher-student-absences':
        return <DashboardLayout><TeacherAbsencesView /></DashboardLayout>;
      case 'teacher-notifications':
        return <DashboardLayout><NotificationsView /></DashboardLayout>;
      case 'teacher-messages':
        return <DashboardLayout><MessagingView /></DashboardLayout>;
      case 'teacher-settings':
        return <DashboardLayout><TeacherSettingsView /></DashboardLayout>;

      // Parent views
      case 'parent-dashboard':
        return <DashboardLayout><ParentDashboard /></DashboardLayout>;
      case 'parent-schedule':
        return <DashboardLayout><ParentScheduleView /></DashboardLayout>;
      case 'parent-absences':
        return <DashboardLayout><ParentAbsencesView /></DashboardLayout>;
      case 'parent-invoices':
        return <DashboardLayout><ParentInvoicesView /></DashboardLayout>;
      case 'parent-notifications':
        return <DashboardLayout><ParentNotificationsView /></DashboardLayout>;
      case 'parent-messages':
        return <DashboardLayout><ParentMessagingView /></DashboardLayout>;
      case 'parent-settings':
        return <DashboardLayout><ParentSettingsView /></DashboardLayout>;
      case 'parent-grades':
        return <DashboardLayout><ParentGradesView /></DashboardLayout>;
      case 'parent-children':
        return <DashboardLayout><ParentChildrenView /></DashboardLayout>;

      // Admin views
      case 'admin-dashboard':
        return <DashboardLayout><AdminDashboard /></DashboardLayout>;
      case 'admin-institutions':
        return <DashboardLayout><AdminInstitutionsView /></DashboardLayout>;
      case 'admin-payments':
        return <DashboardLayout><AdminPaymentsView /></DashboardLayout>;
      case 'admin-landing':
        return <DashboardLayout><AdminLandingView /></DashboardLayout>;
      case 'admin-users':
        return <DashboardLayout><AdminUsersView /></DashboardLayout>;
      case 'admin-settings':
        return <DashboardLayout><AdminSettingsView /></DashboardLayout>;

      // Teacher registration
      case 'register-teacher':
        return <TeacherRegisterPage />;

      default:
        return <LandingPage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {renderView(currentView)}
      </motion.div>
    </AnimatePresence>
  );
}
