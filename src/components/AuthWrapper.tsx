// src/components/AuthWrapper.tsx
'use client';

import { useSession } from 'next-auth/react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  // El middleware ya maneja las redirecciones y verificaciones
  // Solo mostramos un loading mientras se carga la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Una vez cargada la sesión, mostrar el contenido
  // El middleware ya verificó los permisos
  return <>{children}</>;
}
