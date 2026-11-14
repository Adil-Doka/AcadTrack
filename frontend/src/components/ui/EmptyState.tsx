import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
    {icon && (
      <div className="mb-4 p-4 bg-slate-100 rounded-2xl text-slate-400">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 max-w-xs">{description}</p>
    )}
    {action && (
      <Button className="mt-4" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

