import { cn } from '@/lib/utils';
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={cn('w-px h-full bg-gray-200 dark:bg-gray-700', className)} />;
  }
  
  return <div className={cn('w-full h-px bg-gray-200 dark:bg-gray-700', className)} />;
}