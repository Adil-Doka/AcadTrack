import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  Upload,
  Star,
  Bell,
  BookOpen,
  CheckSquare,
  Settings,
  ClipboardList,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'My Team', to: '/team', icon: <Users className="w-4 h-4" /> },
  { label: 'My Project', to: '/project', icon: <FolderOpen className="w-4 h-4" /> },
  { label: 'Phases & Submissions', to: '/phases', icon: <Upload className="w-4 h-4" /> },
  { label: 'Evaluations', to: '/evaluations', icon: <Star className="w-4 h-4" /> },
  { label: 'Notifications', to: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

const coordinatorNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Academic Cycles', to: '/cycles', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Teams', to: '/teams', icon: <Users className="w-4 h-4" /> },
  { label: 'Projects', to: '/projects', icon: <FolderOpen className="w-4 h-4" /> },
  { label: 'Phases', to: '/phases', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Evaluations', to: '/evaluations', icon: <ClipboardList className="w-4 h-4" /> },
  { label: 'Notifications', to: '/notifications', icon: <Bell className="w-4 h-4" /> },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const isCoordinator = user?.role === 'COORDINATOR';
  const navItems = isCoordinator ? coordinatorNav : studentNav;

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <BrandLogo textSize="sm" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          {isCoordinator ? 'Coord' : 'Student'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 sidebar-scroll overflow-y-auto">
        <p className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {isCoordinator ? 'Management' : 'My Work'}
        </p>
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-[#20144d] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn(isActive ? 'text-amber-300' : 'text-slate-400')}>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User info */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.pnr}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

