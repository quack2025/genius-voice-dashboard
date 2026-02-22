import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFolders } from '@/contexts/FolderContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PlanBadge from '@/components/PlanBadge';
import { FolderSection } from '@/components/folders/FolderSection';
import { accountApi } from '@/lib/api';
import {
  FolderKanban,
  Mic2,
  Download,
  Settings,
  LogOut,
  X,
  Shield,
  Users,
  Building2,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const coreItems = [
  { key: 'projects', href: '/dashboard', icon: FolderKanban },
  { key: 'recordings', href: '/recordings', icon: Mic2 },
  { key: 'export', href: '/export', icon: Download },
];

const accountItems = [
  { key: 'usage', href: '/settings?tab=usage', icon: BarChart3 },
  { key: 'billing', href: '/settings?tab=billing', icon: CreditCard },
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
  const { selectedFolderId, setSelectedFolderId, projectCounts, totalProjects } = useFolders();
  const [planKey, setPlanKey] = useState<string>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgInfo, setOrgInfo] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (user) {
      accountApi.getUsage().then(result => {
        if (result.success && result.data) {
          setPlanKey(result.data.plan);
          setIsAdmin(result.data.is_admin);
          if (result.data.org) {
            setOrgInfo({ name: result.data.org.name, role: result.data.org.role });
          }
        }
      });
    }
  }, [user]);

  return (
    <aside className={cn(
      "w-64 bg-[hsl(var(--sidebar-bg))] border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-200",
      open ? "translate-x-0" : "-translate-x-full",
      "md:translate-x-0"
    )}>
      {/* Logo Block */}
      <div className="m-3 p-3 bg-white rounded-lg flex items-center gap-3">
        <img src="/genius-labs-logo.webp" alt="Voice Capture" className="w-8 h-8 object-contain" />
        <span className="font-semibold text-sm text-foreground truncate">Voice Capture</span>
        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto text-sidebar-muted hover:text-sidebar-foreground"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Core Zone */}
        {coreItems.map((item) => {
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
                  ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))]'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          );
        })}

        {/* Separator between Core and Folders */}
        <div className="my-3 border-t border-sidebar-border" />

        {/* Folders Zone */}
        <FolderSection
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          projectCounts={projectCounts}
          totalProjects={totalProjects}
        />

        {/* Separator between Folders and Account zones */}
        <div className="my-3 border-t border-sidebar-border" />

        {/* Account Zone */}
        {accountItems.map((item) => {
          const isActive = item.href.includes('?')
            ? location.pathname === '/settings' && location.search.includes(item.href.split('?')[1])
            : location.pathname === item.href && !location.search;

          return (
            <NavLink
              key={item.key}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))]'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))]'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </NavLink>
          );
        })}

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="my-3 border-t border-sidebar-border" />
            <p className="px-4 py-1 text-xs font-semibold text-[hsl(var(--sidebar-foreground))]/60 uppercase tracking-wider">
              {t('nav.admin')}
            </p>
            {[
              { key: 'adminDashboard', href: '/admin', icon: Shield },
              { key: 'adminUsers', href: '/admin/users', icon: Users },
              { key: 'adminOrgs', href: '/admin/orgs', icon: Building2 },
            ].map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.key}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-foreground))]'
                      : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))]'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {t(`nav.${item.key}`)}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User section — always at bottom */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--sidebar-hover-bg))] flex items-center justify-center">
            <span className="text-xs font-medium text-[hsl(var(--sidebar-foreground))]">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">
              {user?.email}
            </p>
            <PlanBadge plan={planKey} />
            {orgInfo && (
              <p className="text-xs text-[hsl(var(--sidebar-foreground))]/60 truncate">{orgInfo.name}</p>
            )}
          </div>
        </div>
        <div className="px-4 py-2 mb-2">
          <LanguageSwitcher />
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))] transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
