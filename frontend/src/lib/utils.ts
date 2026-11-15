import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy') {
  return format(new Date(date), formatStr);
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDeadline(date: string | Date): { text: string; urgency: 'past' | 'today' | 'soon' | 'normal' } {
  const d = new Date(date);
  if (isPast(d)) return { text: `Overdue · ${format(d, 'MMM d')}`, urgency: 'past' };
  if (isToday(d)) return { text: 'Due Today', urgency: 'today' };
  if (isTomorrow(d)) return { text: 'Due Tomorrow', urgency: 'soon' };
  return { text: `Due ${format(d, 'MMM d, yyyy')}`, urgency: 'normal' };
}

type StatusVariant = {
  label: string;
  color: string;
  bg: string;
  dot: string;
};

export function getStatusVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    DRAFT: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
    SUBMITTED: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
    UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
    APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
    ACTIVE: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Inactive', color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' },
  };
  return map[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(contentType: string): string {
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📊';
  if (contentType.includes('image')) return '🖼️';
  if (contentType.includes('zip')) return '📦';
  return '📎';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function percentageOf(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

