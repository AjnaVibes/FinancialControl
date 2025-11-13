// src/app/(auth)/login/page.tsx
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  // ✅ Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('👤 Usuario ya autenticado, redirigiendo a dashboard');
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleGoogleLogin = () => {
    console.log('🔐 Iniciando login con Google...');
    signIn('google', { 
      callbackUrl: '/dashboard',  // ✅ Especificar callbackUrl
      redirect: true 
    });
  };

  // Mostrar loading si ya está autenticado
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {/* Mostrar mensaje de sesión expirada si viene del middleware */}
          {message === 'session-expired' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 text-amber-800">
                <Clock className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
                </p>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                Las sesiones expiran automáticamente a las 9:00 PM todos los días.
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-3xl text-white font-bold">$</span>
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema Control Financiero
            </h1>
            <p className="text-gray-600 mt-2">
              Inicia sesión con tu cuenta de Google
            </p>
          </div>

          <Button
            onClick={handleGoogleLogin}
            className="w-full"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Button>

          <p className="text-xs text-gray-500">
            Solo usuarios de govacasa.com pueden acceder
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
