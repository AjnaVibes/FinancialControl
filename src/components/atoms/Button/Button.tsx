import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from './Button.types';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant='default', size='md', isLoading=false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = { default: "bg-blue-600 text-white hover:bg-blue-700", outline: "border border-gray-300 hover:bg-gray-100", ghost: "hover:bg-gray-100", destructive: "bg-red-600 text-white hover:bg-red-700" };
    const sizes = { sm: "h-9 px-3 text-sm", md: "h-10 px-4", lg: "h-11 px-8 text-lg" };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || isLoading} {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
