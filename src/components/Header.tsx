// src/components/Header.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-xl text-white font-bold">$</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Sistema Control Financiero
            </h1>
            <p className="text-xs text-gray-500">Govacasa</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Info del usuario */}
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || ''} 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.email}
              </p>
            </div>
          </div>

          {/* Botón de logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}