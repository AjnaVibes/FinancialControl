'use client';

import { useState } from 'react';
import { Header } from '@/components/organisms/Header';
import { Sidebar } from '@/components/organisms/Sidebar';

// Datos de ejemplo para las empresas
const companies = [
  { id: 'govacasa', name: 'govacasa', displayName: 'Govacasa' },
  { id: 'mabu', name: 'mabu', displayName: 'MABU' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('govacasa');

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
    setSidebarOpen(!sidebarOpen);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        companyName={
          companies.find((c) => c.id === selectedCompanyId)?.displayName ||
          'Sistema'
        }
      />

      {/* Main Content */}
      <main
        className={`
          pt-16 transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
