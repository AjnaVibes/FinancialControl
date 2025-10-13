'use client';

import { Menu, X } from 'lucide-react';
import { IconButton } from '@/components/atoms/IconButton';
import { Logo } from '@/components/atoms/Logo';
import { CompanySelector } from '@/components/molecules/CompanySelector';
import { DarkModeToggle } from '@/components/molecules/DarkModeToggle';
import { UserMenu } from '@/components/molecules/UserMenu';
import { NotificationMenu } from '@/components/molecules/NotificationMenu';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  companies: Array<{
    id: string;
    name: string;
    displayName: string;
    logo?: string;
  }>;
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
  }>;
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
}

export function Header({
  sidebarOpen,
  onToggleSidebar,
  companies,
  selectedCompanyId,
  onCompanyChange,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left Section: Menu Toggle + Logo (móvil) */}
        <div className="flex items-center gap-3">
          <IconButton
            onClick={onToggleSidebar}
            variant="ghost"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </IconButton>

          {/* Logo visible solo en móvil cuando sidebar está cerrado */}
          <div className="lg:hidden">
            <Logo collapsed />
          </div>
        </div>

        {/* Center Section: Company Selector */}
        <div className="flex-1 flex justify-center max-w-xs">
          <CompanySelector
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onCompanyChange={onCompanyChange}
          />
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          
          <NotificationMenu
            notifications={notifications}
            onMarkAsRead={onMarkNotificationAsRead}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onDelete={onDeleteNotification}
          />
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
}