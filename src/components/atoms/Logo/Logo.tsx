import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  collapsed?: boolean;
  companyName?: string;
  companyLogo?: string;
}

export function Logo({ collapsed = false, companyName = 'Sistema', companyLogo }: LogoProps) {
  return (
    <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3">
      {/* Logo/Icono */}
      <div className="relative w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
        {companyLogo ? (
          <Image 
            src={companyLogo} 
            alt={companyName}
            fill
            className="object-contain p-1"
          />
        ) : (
          <span className="text-white font-bold text-xl">
            {companyName.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Nombre (solo cuando no está colapsado) */}
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white text-lg">
            {companyName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Control Financiero
          </span>
        </div>
      )}
    </Link>
  );
}
