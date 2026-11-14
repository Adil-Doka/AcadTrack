import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => (
  <Loader2 className={cn('animate-spin text-indigo-600', sizes[size], className)} />
);

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
    <LoadingSpinner size="lg" />
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 space-y-3">
    <div className="shimmer h-4 w-1/3 rounded-md" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="shimmer h-3 rounded-md" style={{ width: `${70 + i * 10}%` }} />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
    <div className="p-4 border-b border-slate-100">
      <div className="shimmer h-4 w-24 rounded-md" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="shimmer h-3 rounded flex-1" style={{ maxWidth: j === 0 ? '30%' : undefined }} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

