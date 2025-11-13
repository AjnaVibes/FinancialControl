// src/app/(dashboard)/pending-approval/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { Clock, Mail, Shield, LogOut } from 'lucide-react';

export default function PendingApprovalPage() {
  const { data: session } = useSession();
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours} horas ${mins > 0 ? `y ${mins} minutos` : ''}`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} días ${remainingHours > 0 ? `y ${remainingHours} horas` : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Shield className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              Solicitud de Acceso Pendiente
            </h1>
            <p className="text-center text-blue-100">
              Tu cuenta está siendo verificada por el administrador
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información del usuario */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'Usuario'}
                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {session?.user?.name || 'Usuario'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Estado de la solicitud */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Estado: En Revisión
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tu solicitud está siendo procesada. Tiempo de espera: {formatTime(timeElapsed)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Notificación por Correo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Recibirás un correo electrónico en <strong>{session?.user?.email}</strong> cuando 
                    tu acceso sea aprobado y se te asignen los permisos correspondientes.
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                ¿Qué sucede después?
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>El administrador revisará tu solicitud y asignará el rol apropiado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Se te otorgarán permisos según tu función en la organización</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Tendrás acceso a las empresas y módulos correspondientes</span>
                </li>
              </ul>
            </div>

            {/* Tiempo estimado */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                El tiempo promedio de aprobación es de <strong>2-4 horas hábiles</strong>
              </p>
            </div>

            {/* Botón de cerrar sesión */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Si tienes alguna pregunta, contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
