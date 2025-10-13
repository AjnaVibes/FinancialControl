import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', className, children, ...props }, ref) => {
    const variants = {
      ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
      solid: 'bg-primary-500 text-white hover:bg-primary-600'
    };

    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';