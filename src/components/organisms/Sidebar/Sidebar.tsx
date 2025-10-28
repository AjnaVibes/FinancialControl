'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Building2,
  Settings,
  Users,
  BarChart3,
  Receipt  // 👈 NUEVO: Ícono para Pagarés
} from 'lucide-react';
import { Logo } from '@/components/atoms/Logo';
import { Divider } from '@/components/atoms/Divider';
import { cn } from '@/lib/utils';


interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  collapsed?: boolean;
  companyName?: string;
  companyLogo?: string;
}

const menuSections: MenuSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard'
      }
    ]
  },
  {
    title: 'Finanzas',
    items: [
      {
        id: 'ingresos',
        label: 'Ingresos',
        icon: TrendingUp,
        href: '/dashboard/ingresos'
      },
      {
        id: 'egresos',
        label: 'Egresos',
        icon: DollarSign,
        href: '/dashboard/egresos'
      },
      {
        id: 'proyectos',
        label: 'Proyectos',
        icon: Building2,
        href: '/dashboard/proyectos'
      },
      // 👇 NUEVO: Entrada de Pagarés
      {
        id: 'pagares',
        label: 'Pagarés',
        icon: Receipt,
        href: '/dashboard/pagares'
      },
      // 👆 FIN NUEVO
      {
        id: 'reportes',
        label: 'Reportes',
        icon: FileText,
        href: '/dashboard/reportes'
      }
    ]
  },
  {
    title: 'Analytics',
    items: [
      {
        id: 'metricas',
        label: 'Métricas',
        icon: BarChart3,
        href: '/dashboard/metricas'
      }
    ]
  },
  {
    title: 'Administración',
    items: [
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: Users,
        href: '/dashboard/usuarios'
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        href: '/dashboard/configuracion'
      }
    ]
  }
];

export function Sidebar({ 
  isOpen, 
  collapsed = false,
  companyName = 'Sistema',
  companyLogo 
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {/* Se manejará desde el componente padre */}}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0" // Siempre visible en desktop
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800">
          <Logo 
            collapsed={collapsed} 
            companyName={companyName}
            companyLogo={companyLogo}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuSections.map((section, index) => (
            <div key={index}>
              {/* Section Title */}
              {section.title && !collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              
              {/* Section Divider si no tiene título y no es la primera sección */}
              {!section.title && index > 0 && (
                <Divider className="mb-4" />
              )}

              {/* Menu Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                        collapsed && "justify-center"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive 
                          ? "text-blue-600 dark:text-blue-400" 
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      )} />
                      
                      {!collapsed && (
                        <>
                          <span className="flex-1 font-medium text-sm">
                            {item.label}
                          </span>
                          
                          {item.badge && (
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-semibold rounded-full",
                              isActive
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - Version info */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p className="font-semibold">Sistema Financiero</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}