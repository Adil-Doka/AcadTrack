import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatRelative } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Clock, Info } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationApi.getAll(unreadOnly),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) return <PageLoading message="Loading notifications..." />;

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notifications"
          subtitle="Stay updated with approvals, phase deadlines, and evaluation releases"
        />

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              icon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            !unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Unread only ({unreadCount})
        </button>
      </div>

      {notifications && notifications.length > 0 ? (
        <Card className="divide-y divide-slate-100 border border-slate-200 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.read ? 'bg-indigo-50/20' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.read
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-indigo-600 shrink-0"
                  onClick={() => markReadMutation.mutate(n.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState
          icon={<Bell className="w-10 h-10" />}
          title="No Notifications"
          description={unreadOnly ? 'You have caught up with all updates.' : 'No alerts logged yet.'}
        />
      )}
    </div>
  );
};

