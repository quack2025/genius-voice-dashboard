import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PlanBadge from '@/components/PlanBadge';
import { accountApi } from '@/lib/api';
import {
  FolderKanban,
  Mic2,
  Download,
  Settings,
  LogOut,
  Mic,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { key: 'projects', href: '/dashboard', icon: FolderKanban },
  { key: 'recordings', href: '/recordings', icon: Mic2 },
  { key: 'export', href: '/export', icon: Download },
  { key: 'settings', href: '/settings', icon: Settings },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const [planKey, setPlanKey] = useState<string>('free');

  useEffect(() => {
    if (user) {
      accountApi.getUsage().then(result => {
        if (result.success && result.data) {
          setPlanKey(result.data.plan);
        }
      });
    }
  }, [user]);

  return (
    <aside className={cn(
      "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-200",
      open ? "translate-x-0" : "-translate-x-full",
      "md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sidebar-primary rounded-lg">
              <Mic className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">Voice Capture</span>
          </div>
          {/* Close button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-muted hover:text-sidebar-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href === '/dashboard' && location.pathname.startsWith('/projects'));

          return (
            <NavLink
              key={item.key}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-medium text-sidebar-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email}
            </p>
            <PlanBadge plan={planKey} />
          </div>
        </div>
        <div className="px-4 py-2 mb-2">
          <LanguageSwitcher />
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
