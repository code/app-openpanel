import { cn } from '@/utils/cn';

interface StickyBelowHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyBelowHeader({
  children,
  className,
}: StickyBelowHeaderProps) {
  return (
    <div
      className={cn(
        'top-0 z-20 rounded-lg border-b border-border bg-white md:sticky [[id=dashboard]_&]:top-16 [[id=dashboard]_&]:rounded-none',
        className
      )}
    >
      {children}
    </div>
  );
}
