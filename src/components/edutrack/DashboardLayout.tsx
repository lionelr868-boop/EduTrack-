'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ViewType } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Users,
  Building2,
  ClipboardX,
  Receipt,
  BarChart3,
  Settings,
  ClipboardCheck,
  AlertCircle,
  Home,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User,
  BellRing,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: ViewType;
}

const directorNavItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: <LayoutDashboard className="h-5 w-5" />, view: 'director-dashboard' },
  { label: 'الجدول الدراسي', icon: <Calendar className="h-5 w-5" />, view: 'director-schedule' },
  { label: 'الطلاب', icon: <GraduationCap className="h-5 w-5" />, view: 'director-students' },
  { label: 'الأقسام', icon: <Building2 className="h-5 w-5" />, view: 'director-sections' },
  { label: 'الأساتذة', icon: <Users className="h-5 w-5" />, view: 'director-teachers' },
  { label: 'الغيابات', icon: <ClipboardX className="h-5 w-5" />, view: 'director-absences' },
  { label: 'الفوترة', icon: <Receipt className="h-5 w-5" />, view: 'director-billing' },
  { label: 'التقارير', icon: <BarChart3 className="h-5 w-5" />, view: 'director-reports' },
  { label: 'الإشعارات', icon: <Bell className="h-5 w-5" />, view: 'director-notifications' },
  { label: 'الإعدادات', icon: <Settings className="h-5 w-5" />, view: 'director-settings' },
];

const teacherNavItems: NavItem[] = [
  { label: 'لوحة التحكم', icon: <LayoutDashboard className="h-5 w-5" />, view: 'teacher-dashboard' },
  { label: 'جدولي', icon: <Calendar className="h-5 w-5" />, view: 'teacher-schedule' },
  { label: 'تسجيل الحضور', icon: <ClipboardCheck className="h-5 w-5" />, view: 'teacher-attendance' },
  { label: 'الطلاب', icon: <GraduationCap className="h-5 w-5" />, view: 'teacher-students' },
  { label: 'إبلاغ غياب', icon: <AlertCircle className="h-5 w-5" />, view: 'teacher-absence-request' },
  { label: 'الإشعارات', icon: <Bell className="h-5 w-5" />, view: 'teacher-notifications' },
];

const parentNavItems: NavItem[] = [
  { label: 'الرئيسية', icon: <Home className="h-5 w-5" />, view: 'parent-dashboard' },
  { label: 'الجدول', icon: <Calendar className="h-5 w-5" />, view: 'parent-schedule' },
  { label: 'الغيابات', icon: <ClipboardX className="h-5 w-5" />, view: 'parent-absences' },
  { label: 'الفواتير', icon: <Receipt className="h-5 w-5" />, view: 'parent-invoices' },
  { label: 'الإشعارات', icon: <Bell className="h-5 w-5" />, view: 'parent-notifications' },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'DIRECTOR': return directorNavItems;
    case 'TEACHER': return teacherNavItems;
    case 'PARENT': return parentNavItems;
    default: return directorNavItems;
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'DIRECTOR': return 'مدير';
    case 'TEACHER': return 'أستاذ';
    case 'PARENT': return 'ولي أمر';
    default: return 'مستخدم';
  }
}

function getNotificationsView(role: string): ViewType {
  switch (role) {
    case 'DIRECTOR': return 'director-notifications';
    case 'TEACHER': return 'teacher-notifications';
    case 'PARENT': return 'parent-notifications';
    default: return 'director-notifications';
  }
}

// SidebarContent defined OUTSIDE the main component to avoid lint errors
function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentView, setCurrentView, user, institutionLogo, setInstitutionLogo } = useAppStore();

  useEffect(() => {
    if (user?.institutionId) {
      fetch(`/api/settings?institutionId=${user.institutionId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.logo) setInstitutionLogo(data.logo);
        })
        .catch(() => {});
    }
  }, [user?.institutionId, setInstitutionLogo]);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        {institutionLogo ? (
          <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
            <img src={institutionLogo} alt="شعار" className="h-9 w-9 object-contain" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-xl bg-edutrack-primary flex items-center justify-center shadow-lg shadow-edutrack-primary/30 flex-shrink-0">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
        )}
        <div className="overflow-hidden">
          <h1 className="text-lg font-bold gradient-text">EduTrack</h1>
          <p className="text-[10px] text-white/50 whitespace-nowrap">منصة تسيير المؤسسات</p>
        </div>
      </div>

      <Separator className="bg-white/10 mx-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <motion.button
                key={item.view}
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCurrentView(item.view);
                  onItemClick?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-edutrack-primary text-white shadow-lg shadow-edutrack-primary/30'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-edutrack-secondary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-white/10 mx-4" />

      {/* User info at bottom */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <Avatar className="h-9 w-9 border-2 border-edutrack-primary">
            <AvatarFallback className="bg-edutrack-primary text-white text-xs font-bold">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-white/50">{getRoleLabel(user.role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// HeaderContent defined OUTSIDE the main component
function HeaderContent() {
  const { user, setUser, setCurrentView, setSidebarOpen, institutionLogo, setInstitutionLogo } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [instData, setInstData] = useState<{ name: string; logo: string | null }>({ name: '', logo: null });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep userId ref in sync
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user]);

  // Fetch institution data
  useEffect(() => {
    if (user?.institutionId) {
      fetch(`/api/settings?institutionId=${user.institutionId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setInstData({ name: data.name || '', logo: data.logo || null });
            if (data.logo) setInstitutionLogo(data.logo);
          }
        })
        .catch(() => {});
    }
  }, [user?.institutionId, setInstitutionLogo]);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      try {
        const res = await fetch(`/api/notifications?userId=${uid}&unreadOnly=true&limit=1`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Silently fail
      }
    };

    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.id]);

  if (!user) return null;

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  const handleNotificationClick = () => {
    setCurrentView(getNotificationsView(user.role));
  };

  return (
    <div className="flex items-center gap-4 px-4 lg:px-6 h-16">
      {/* Mobile hamburger */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-edutrack-dark hover:bg-edutrack-primary/10 h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Institution Name */}
      <div className="hidden sm:flex items-center gap-2">
        {instData.logo ? (
          <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
            <img src={instData.logo} alt="شعار" className="h-7 w-7 object-contain" />
          </div>
        ) : null}
        <div>
          <h2 className="text-sm font-bold text-edutrack-dark">{instData.name || 'لوحة التحكم'}</h2>
          <p className="text-[10px] text-muted-foreground">لوحة التحكم</p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative max-w-xs w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-9 h-9 bg-gray-50 border-gray-200 focus:border-edutrack-primary focus:ring-edutrack-primary/20 rounded-lg text-sm"
        />
      </div>

      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNotificationClick}
        className="relative h-9 w-9 text-edutrack-dark hover:bg-edutrack-primary/10"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-edutrack-primary" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -left-1 h-5 min-w-[20px] flex items-center justify-center p-0 bg-edutrack-danger text-white text-[10px] font-bold border-2 border-white rounded-full ${
              unreadCount > 0 ? 'animate-pulse' : ''
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </Button>

      {/* User Avatar + Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 hover:bg-edutrack-primary/10">
            <Avatar className="h-8 w-8 border-2 border-edutrack-primary/20">
              <AvatarFallback className="bg-edutrack-primary text-white text-xs font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-edutrack-dark">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
            <ChevronLeft className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-right">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer flex-row-reverse justify-end gap-2">
            <User className="h-4 w-4" />
            <span>الملف الشخصي</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleNotificationClick}
            className="cursor-pointer flex-row-reverse justify-end gap-2"
          >
            <Bell className="h-4 w-4" />
            <span>الإشعارات</span>
            {unreadCount > 0 && (
              <Badge className="mr-auto bg-edutrack-danger text-white text-[10px] h-5 min-w-[20px] flex items-center justify-center p-0 rounded-full">
                {unreadCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer flex-row-reverse justify-end gap-2">
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer flex-row-reverse justify-end gap-2 text-edutrack-danger focus:text-edutrack-danger"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, user, institutionLogo, setInstitutionLogo } = useAppStore();
  const [isMobile, setIsMobile] = useState(false);
  const [instData, setInstData] = useState<{ name: string; logo: string | null }>({ name: '', logo: null });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch institution data
  useEffect(() => {
    if (user?.institutionId) {
      fetch(`/api/settings?institutionId=${user.institutionId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setInstData({ name: data.name || '', logo: data.logo || null });
            if (data.logo) setInstitutionLogo(data.logo);
          }
        })
        .catch(() => {});
    }
  }, [user?.institutionId, setInstitutionLogo]);

  return (
    <div className="min-h-screen bg-edutrack-light flex" dir="rtl">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-64 bg-edutrack-dark flex-shrink-0 flex flex-col min-h-screen sticky top-0"
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="right" className="w-72 bg-edutrack-dark border-white/10 p-0">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {instData.logo ? (
                  <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/10">
                    <img src={instData.logo} alt="شعار" className="h-7 w-7 object-contain" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-edutrack-primary flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="gradient-text font-bold">{instData.name || 'EduTrack'}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm"
        >
          <HeaderContent />
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
