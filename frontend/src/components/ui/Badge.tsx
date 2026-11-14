import React from 'react';
import { cn, getStatusVariant } from '@/lib/utils';

interface BadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className, size = 'md', showDot = true }) => {
  const variant = getStatusVariant(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variant.bg,
        variant.color,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', variant.dot)} />
      )}
      {variant.label}
    </span>
  );
};

interface GenericBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const badgeVariants = {
  default: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-violet-50 text-violet-700',
};

export const Badge: React.FC<GenericBadgeProps> = ({ children, variant = 'default', className, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeVariants[variant],
      className
    )}
    {...props}
  >
    {children}
  </span>
);

