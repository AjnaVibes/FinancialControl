'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {/* Home */}
      <Link
        href="/dashboard"
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
            
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "font-medium",
                isLast 
                  ? "text-gray-900 dark:text-white" 
                  : "text-gray-600 dark:text-gray-400"
              )}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}