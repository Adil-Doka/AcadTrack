import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, cycleApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Crown,
  ChevronDown,
} from 'lucide-react';

export const TeamsManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject modal state
  const [rejectTeamId, setRejectTeamId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Selected team for details
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  // Cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles'],
    queryFn: cycleApi.getAll,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Teams list
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', activeCycleId, statusFilter],
    queryFn: () =>
      teamApi.getAll({
        cycleId: activeCycleId,
        status: statusFilter || undefined,
      }),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: teamApi.approve,
    onSuccess: () => {
      toast.success('Team approved');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Approval failed'),
  });

  // Put Under Review Mutation
  const reviewMutation = useMutation({
    mutationFn: teamApi.putUnderReview,
    onSuccess: () => {
      toast.success('Team marked as Under Review');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      teamApi.reject(id, { reason }),
    onSuccess: () => {
      toast.success('Team rejected');
      setRejectTeamId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Rejection failed'),
  });

  // Reopen Mutation
  const reopenMutation = useMutation({
    mutationFn: teamApi.reopen,
    onSuccess: () => {
      toast.success('Team reopened as Draft for students');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Reopen failed'),
  });

  const filteredTeams = teams?.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <PageLoading message="Loading teams list..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Verifications"
        subtitle="Review student team rosters, validate memberships, and approve groups"
      />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search teams by name..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {cycles && (
            <Select
              className="w-40 text-xs h-9"
              value={activeCycleId || ''}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}

          <Select
            className="w-36 text-xs h-9"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'SUBMITTED', label: 'Submitted' },
              { value: 'UNDER_REVIEW', label: 'Under Review' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'DRAFT', label: 'Draft' },
            ]}
          />
        </div>
      </div>

      {/* Teams Table / Cards */}
      {filteredTeams && filteredTeams.length > 0 ? (
        <Card className="overflow-hidden border border-slate-200">
          <div className="divide-y divide-slate-100">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200">
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                      <StatusBadge status={team.status} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span>{team.members?.length || 0} members</span>
                      <span>·</span>
                      <span>Cycle: {team.cycleName}</span>
                      <span>·</span>
                      <span>Updated {formatDate(team.updatedAt)}</span>
                    </div>

                    {/* Member chips preview */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {team.members?.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {m.teamRole === 'LEADER' && <Crown className="w-2.5 h-2.5 text-amber-600" />}
                          {m.name} ({m.pnr})
                        </span>
                      ))}
                    </div>

                    {team.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">
                        Rejection reason: {team.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coordinator actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {team.status === 'SUBMITTED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-8"
                      loading={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate(team.id)}
                    >
                      Start Review
                    </Button>
                  )}

                  {(team.status === 'SUBMITTED' || team.status === 'UNDER_REVIEW') && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs h-8"
                        loading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(team.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-xs h-8"
                        onClick={() => {
                          setRejectTeamId(team.id);
                          setRejectReason('');
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {(team.status === 'APPROVED' || team.status === 'REJECTED') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-slate-500 hover:text-slate-800"
                      loading={reopenMutation.isPending}
                      onClick={() => reopenMutation.mutate(team.id)}
                      icon={<RefreshCw className="w-3 h-3" />}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="No Teams Found"
          description="No teams matching the specified cycle or status filters."
        />
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectTeamId !== null}
        onClose={() => setRejectTeamId(null)}
        title="Reject Team Roster"
        description="Provide feedback to the student team on why their roster was rejected."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rejectTeamId && rejectReason.trim()) {
              rejectMutation.mutate({ id: rejectTeamId, reason: rejectReason.trim() });
            }
          }}
          className="space-y-4 pt-2"
        >
          <Textarea
            label="Rejection Reason"
            placeholder="e.g. Incomplete member count, missing prerequisite approval, student not registered..."
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectTeamId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={rejectMutation.isPending}>
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

