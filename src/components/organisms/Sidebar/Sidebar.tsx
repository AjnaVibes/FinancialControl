'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  FileText,
  Building2,
  Settings,
  Users,
  BarChart3,
  Receipt,
  ShieldCheck,
  Briefcase,
  CreditCard,
  Wallet,
  RefreshCw,
  Database,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
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
  isOpen?: boolean;
  onToggle?: () => void;
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
    title: 'Dirección',
    items: [
      {
        id: 'direccion',
        label: 'Dirección General',
        icon: Briefcase,
        href: '/dashboard/direccion',
        badge: 'NUEVO'
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
      {
        id: 'pagares',
        label: 'Pagarés',
        icon: Receipt,
        href: '/dashboard/pagares'
      },
      {
        id: 'financiamientos',
        label: 'Financiamientos',
        icon: Wallet,
        href: '/dashboard/financiamientos/creditos',
        badge: 'NUEVO'
      },
      {
        id: 'pagos',
        label: 'Pagos',
        icon: FileText,
        href: '/dashboard/pagos',
        badge: 'NUEVO'
      },
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
        id: 'admin',
        label: 'Panel de Admin',
        icon: ShieldCheck,
        href: '/dashboard/admin',
        badge: 'NUEVO'
      },
      {
        id: 'sync',
        label: 'Centro de Sincronización',
        icon: RefreshCw,
        href: '/dashboard/sync',
        badge: 'NUEVO'
      },
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
  companyName = 'Sistema',
  companyLogo 
}: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Botón de menú móvil flotante */}
      <button
        onClick={toggleMobile}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg md:hidden"
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        )}
      </button>

      {/* Overlay para móvil */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full",
          "bg-white dark:bg-gray-900",
          "border-r border-gray-200 dark:border-gray-700",
          "z-30 transition-all duration-300 ease-in-out",
          "shadow-xl md:shadow-lg",
          "flex flex-col",
          // Width responsive
          collapsed ? "w-20" : "w-72",
          // Visibilidad en móvil
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Siempre visible en desktop
          "md:translate-x-0"
        )}
      >
        {/* Header con logo */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 flex-shrink-0">
          <Logo 
            collapsed={collapsed} 
            companyName={companyName}
            companyLogo={companyLogo}
          />
        </div>

        {/* Botón de colapso justo arriba del scroll (solo desktop) */}
        <div className="hidden md:flex justify-end px-3 py-2">
          <button
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center justify-center",
              "w-6 h-6 rounded",
              "text-gray-400 dark:text-gray-500",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "hover:text-gray-600 dark:hover:text-gray-300",
              "transition-all duration-200"
            )}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Navigation con scroll mejorado */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-4 custom-scrollbar">
          {menuSections.map((section, index) => (
            <div key={index}>
              {/* Section Title */}
              {section.title && !collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              
              {/* Section Divider */}
              {!section.title && index > 0 && (
                <Divider className="mb-4" />
              )}

              {/* Menu Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  // Detección precisa de rutas activas
                  let isActive = false;
                  
                  // Lista de rutas que deben ser exactas (no pueden tener subrutas activas)
                  const exactRoutes = ['/dashboard', '/dashboard/admin'];
                  
                  if (exactRoutes.includes(item.href)) {
                    // Para estas rutas, solo marcar como activo si es exacta
                    isActive = pathname === item.href;
                  } else {
                    // Para otras rutas, marcar como activo si coincide exactamente
                    // o si es una subruta (para rutas como financiamientos/creditos)
                    isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "transition-all duration-200",
                        "group relative",
                        // Estados activos
                        isActive 
                          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" 
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70",
                        collapsed && "justify-center px-2",
                        // Efecto hover
                        "hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      <Icon className={cn(
                        "flex-shrink-0 transition-colors",
                        collapsed ? "w-6 h-6" : "w-5 h-5",
                        isActive 
                          ? "text-primary-600 dark:text-primary-400" 
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                      )} />
                      
                      {!collapsed && (
                        <>
                          <span className="flex-1 font-medium text-sm whitespace-nowrap">
                            {item.label}
                          </span>
                          
                          {item.badge && (
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-semibold rounded-full",
                              "transition-colors",
                              isActive
                                ? "bg-primary-600 text-white dark:bg-primary-500"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      
                      {/* Tooltip para modo colapsado */}
                      {collapsed && (
                        <div className={cn(
                          "absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded",
                          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                          "transition-all duration-200 pointer-events-none z-50",
                          "whitespace-nowrap"
                        )}>
                          {item.label}
                          {item.badge && (
                            <span className="ml-2 text-yellow-300">
                              ({item.badge})
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Indicador visual activo */}
                      {isActive && (
                        <div className={cn(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-r-full",
                          collapsed && "h-6"
                        )} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - Version info */}
        <div className={cn(
          "p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0",
          collapsed && "p-2"
        )}>
          {!collapsed ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p className="font-semibold">Sistema Financiero</p>
              <p className="mt-1">v1.0.0</p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                SF
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Estilos del scrollbar */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </>
  );
}
