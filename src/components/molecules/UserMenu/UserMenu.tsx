'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/dashboard/settings');
    setIsOpen(false);
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de usuario */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="relative">
          {session.user.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name || ''} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Info del usuario (oculto en móvil) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {session.user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {session.user.email}
          </p>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform hidden md:block",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Info de usuario (visible en dropdown móvil) */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                Mi Perfil
              </span>
            </button>

            <button
              onClick={handleSettingsClick}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                Configuración
              </span>
            </button>
          </div>

          {/* Cerrar sesión */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
