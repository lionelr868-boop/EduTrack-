import { create } from 'zustand';

export type ViewType = 
  | 'landing' 
  | 'login' 
  | 'register' 
  | 'director-dashboard'
  | 'director-schedule'
  | 'director-students'
  | 'director-teachers'
  | 'director-absences'
  | 'director-billing'
  | 'director-reports'
  | 'director-settings'
  | 'director-notifications'
  | 'director-sections'
  | 'teacher-dashboard'
  | 'teacher-schedule'
  | 'teacher-attendance'
  | 'teacher-students'
  | 'teacher-absence-request'
  | 'teacher-notifications'
  | 'parent-dashboard'
  | 'parent-schedule'
  | 'parent-absences'
  | 'parent-invoices'
  | 'parent-notifications';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'DIRECTOR' | 'TEACHER' | 'PARENT';
  institutionId: string;
  teacherId?: string;
  parentId?: string;
}

interface AppState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  demoMode: boolean;
  setDemoMode: (demo: boolean) => void;
  institutionLogo: string | null;
  setInstitutionLogo: (logo: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  demoMode: false,
  setDemoMode: (demo) => set({ demoMode: demo }),
  institutionLogo: null,
  setInstitutionLogo: (logo) => set({ institutionLogo: logo }),
}));
