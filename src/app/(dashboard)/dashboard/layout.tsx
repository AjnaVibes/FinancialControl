'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/organisms/Header';
import { Sidebar } from '@/components/organisms/Sidebar';
import { AuthWrapper } from '@/components/AuthWrapper';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

// Datos de ejemplo para las empresas
const companies = [
  { id: 'govacasa', name: 'govacasa', displayName: 'Govacasa' },
  { id: 'mabu', name: 'mabu', displayName: 'MABU' },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed, mobileOpen } = useSidebar();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Cerrado por defecto en móvil
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('govacasa');

  // Detectar tamaño de pantalla al montar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // Abrir en desktop
      } else {
        setSidebarOpen(false); // Cerrar en móvil
      }
    };

    // Ejecutar al montar
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notificaciones de ejemplo
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Nueva transacción',
      message: 'Se ha registrado una nueva venta por $50,000 MXN',
      time: 'Hace 5 minutos',
      read: false,
      type: 'success' as const,
    },
    {
      id: '2',
      title: 'Pago pendiente',
      message: 'El cliente Juan Pérez tiene un pago vencido',
      time: 'Hace 1 hora',
      read: false,
      type: 'warning' as const,
    },
  ]);

  const handleToggleSidebar = () => {
    // En desktop, colapsar/expandir. En móvil, abrir/cerrar
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleCloseSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onDeleteNotification={handleDeleteNotification}
        />

        {/* Sidebar con overlay para móvil */}
        <>
          {/* Overlay mejorado para móvil */}
          {sidebarOpen && window.innerWidth < 768 && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
              onClick={handleCloseSidebar}
              aria-hidden="true"
            />
          )}
          
          {/* Sidebar - ahora maneja su propio estado de colapso */}
          <Sidebar
            companyName={
              companies.find((c) => c.id === selectedCompanyId)?.displayName ||
              'Sistema'
            }
          />
        </>

        {/* Main Content - se ajusta dinámicamente basado en el estado del sidebar */}
        <main className={`pt-16 min-h-[calc(100vh-4rem)] pb-safe transition-all duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-72'
        }`}>
          {/* Contenedor con padding uniforme y responsive */}
          <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {/* Wrapper con padding consistente */}
              <div className="p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </div>
          </div>
        </main>

        {/* Navegación inferior para móviles (opcional) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-40 safe-bottom">
          <div className="flex justify-around items-center h-16 px-4">
            {/* Botones de navegación rápida para móvil */}
            <button 
              onClick={handleToggleSidebar}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </AuthWrapper>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
