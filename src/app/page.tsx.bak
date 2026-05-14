'use client';

import { useAppStore, ViewType } from '@/store/useAppStore';
import LandingPage from '@/components/edutrack/LandingPage';
import LoginPage from '@/components/edutrack/LoginPage';
import RegisterPage from '@/components/edutrack/RegisterPage';
import DashboardLayout from '@/components/edutrack/DashboardLayout';
import DirectorDashboard from '@/components/edutrack/DirectorDashboard';
import ScheduleView from '@/components/edutrack/ScheduleView';
import StudentsView from '@/components/edutrack/StudentsView';
import TeachersView from '@/components/edutrack/TeachersView';
import AbsencesView from '@/components/edutrack/AbsencesView';
import BillingView from '@/components/edutrack/BillingView';
import ReportsView from '@/components/edutrack/ReportsView';
import SettingsView from '@/components/edutrack/SettingsView';
import AttendanceView from '@/components/edutrack/AttendanceView';
import TeacherDashboard from '@/components/edutrack/TeacherDashboard';
import TeacherStudentsView from '@/components/edutrack/TeacherStudentsView';
import TeacherAbsenceRequest from '@/components/edutrack/TeacherAbsenceRequest';
import ParentDashboard from '@/components/edutrack/ParentDashboard';
import ParentScheduleView from '@/components/edutrack/ParentScheduleView';
import ParentAbsencesView from '@/components/edutrack/ParentAbsencesView';
import ParentInvoicesView from '@/components/edutrack/ParentInvoicesView';
import ParentNotificationsView from '@/components/edutrack/ParentNotificationsView';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  const renderView = (view: ViewType) => {
    // Auth / Landing views (no dashboard layout)
    switch (view) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;

      // Director views
      case 'director-dashboard':
        return (
          <DashboardLayout>
            <DirectorDashboard />
          </DashboardLayout>
        );
      case 'director-schedule':
        return (
          <DashboardLayout>
            <ScheduleView mode="director" />
          </DashboardLayout>
        );
      case 'director-students':
        return (
          <DashboardLayout>
            <StudentsView />
          </DashboardLayout>
        );
      case 'director-teachers':
        return (
          <DashboardLayout>
            <TeachersView />
          </DashboardLayout>
        );
      case 'director-absences':
        return (
          <DashboardLayout>
            <AbsencesView />
          </DashboardLayout>
        );
      case 'director-billing':
        return (
          <DashboardLayout>
            <BillingView />
          </DashboardLayout>
        );
      case 'director-reports':
        return (
          <DashboardLayout>
            <ReportsView />
          </DashboardLayout>
        );
      case 'director-settings':
        return (
          <DashboardLayout>
            <SettingsView />
          </DashboardLayout>
        );

      // Teacher views
      case 'teacher-dashboard':
        return (
          <DashboardLayout>
            <TeacherDashboard />
          </DashboardLayout>
        );
      case 'teacher-schedule':
        return (
          <DashboardLayout>
            <ScheduleView mode="teacher" />
          </DashboardLayout>
        );
      case 'teacher-attendance':
        return (
          <DashboardLayout>
            <AttendanceView />
          </DashboardLayout>
        );
      case 'teacher-students':
        return (
          <DashboardLayout>
            <TeacherStudentsView />
          </DashboardLayout>
        );
      case 'teacher-absence-request':
        return (
          <DashboardLayout>
            <TeacherAbsenceRequest />
          </DashboardLayout>
        );

      // Parent views
      case 'parent-dashboard':
        return (
          <DashboardLayout>
            <ParentDashboard />
          </DashboardLayout>
        );
      case 'parent-schedule':
        return (
          <DashboardLayout>
            <ParentScheduleView />
          </DashboardLayout>
        );
      case 'parent-absences':
        return (
          <DashboardLayout>
            <ParentAbsencesView />
          </DashboardLayout>
        );
      case 'parent-invoices':
        return (
          <DashboardLayout>
            <ParentInvoicesView />
          </DashboardLayout>
        );
      case 'parent-notifications':
        return (
          <DashboardLayout>
            <ParentNotificationsView />
          </DashboardLayout>
        );

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
