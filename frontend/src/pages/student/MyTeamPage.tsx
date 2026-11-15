import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { teamApi, cycleApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Trash2,
  Send,
  Crown,
  AlertTriangle,
  Info,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const MyTeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [memberPnr, setMemberPnr] = useState('');

  // Fetch active cycles
  const { data: cycles, isLoading: isCyclesLoading } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: cycleApi.getActive,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Fetch My Team
  const {
    data: team,
    isLoading: isTeamLoading,
    refetch: refetchTeam,
  } = useQuery({
    queryKey: ['my-team', activeCycleId],
    queryFn: () => (activeCycleId ? teamApi.getMyTeam(activeCycleId) : Promise.reject('No cycle')),
    enabled: !!activeCycleId,
    retry: false,
  });

  // Create Team Mutation
  const createMutation = useMutation({
    mutationFn: teamApi.create,
    onSuccess: (data) => {
      toast.success(`Team "${data.name}" created successfully!`);
      setIsCreateModalOpen(false);
      setTeamName('');
      queryClient.invalidateQueries({ queryKey: ['my-team'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create team');
    },
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, pnr }: { teamId: number; pnr: string }) =>
      teamApi.addMember(teamId, { userPnr: pnr }),
    onSuccess: () => {
      toast.success('Member added successfully!');
      setIsAddMemberModalOpen(false);
      setMemberPnr('');
      refetchTeam();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to add member');
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberUserId }: { teamId: number; memberUserId: number }) =>
      teamApi.removeMember(teamId, memberUserId),
    onSuccess: () => {
      toast.success('Member removed');
      refetchTeam();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to remove member');
    },
  });

  // Submit Team Mutation
  const submitTeamMutation = useMutation({
    mutationFn: (teamId: number) => teamApi.submit(teamId),
    onSuccess: () => {
      toast.success('Team submitted for coordinator approval!');
      refetchTeam();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit team');
    },
  });

  if (isCyclesLoading || (activeCycleId && isTeamLoading && !team)) {
    return <PageLoading message="Loading team details..." />;
  }

  const isLeader = team?.members?.some(
    (m) => m.userId === user?.id && m.teamRole === 'LEADER'
  );
  const canEdit = isLeader && (team?.status === 'DRAFT' || team?.status === 'REJECTED');
  const canSubmit = canEdit && (team?.members?.length ?? 0) >= 2;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Team Management"
          subtitle="Form, organize, and submit your project team for approval"
        />

        {cycles && cycles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Cycle:</span>
            <Select
              className="w-48 text-xs"
              value={activeCycleId || ''}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
        )}
      </div>

      {!team ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="No Team Found"
          description="You are currently not part of any team for this academic cycle. Create a new team or ask your team leader to add your PNR."
          action={{
            label: 'Create Team',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Team Info Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                  <StatusBadge status={team.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Cycle: <span className="font-medium text-slate-700">{team.cycleName}</span>
                  <span>·</span>
                  Created {formatDate(team.createdAt)}
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                    onClick={() => setIsAddMemberModalOpen(true)}
                    disabled={(team.members?.length || 0) >= 4}
                  >
                    Add Member
                  </Button>
                  <Button
                    size="sm"
                    icon={<Send className="w-3.5 h-3.5" />}
                    loading={submitTeamMutation.isPending}
                    onClick={() => submitTeamMutation.mutate(team.id)}
                    disabled={!canSubmit}
                  >
                    Submit Team
                  </Button>
                </div>
              )}
            </div>

            {/* Notice / Status Callouts */}
            {team.status === 'REJECTED' && team.rejectionReason && (
              <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-red-800">Team Submission Rejected</h4>
                  <p className="text-xs text-red-700 mt-0.5">{team.rejectionReason}</p>
                  <p className="text-xs text-red-600 mt-1">Please update your members and resubmit.</p>
                </div>
              </div>
            )}

            {team.status === 'DRAFT' && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Team requirement: Minimum 2 members, maximum 4 members required before submitting for approval.
                </span>
              </div>
            )}

            {/* Team Members List */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Team Members ({team.members?.length || 0}/4)
                </h3>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {team.members?.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center border border-slate-200">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{member.name}</span>
                          {member.teamRole === 'LEADER' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                              <Crown className="w-3 h-3 text-amber-600" /> Leader
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Member
                            </span>
                          )}
                          {member.userId === user?.id && (
                            <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          PNR: <span className="font-mono text-slate-600">{member.pnr}</span> ·{' '}
                          {member.department} · {member.email}
                        </p>
                      </div>
                    </div>

                    {canEdit && member.teamRole !== 'LEADER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        loading={removeMemberMutation.isPending}
                        onClick={() =>
                          removeMemberMutation.mutate({
                            teamId: team.id,
                            memberUserId: member.userId,
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Modal: Create Team */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create a New Team"
        description="You will automatically become the Team Leader."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!activeCycleId || !teamName.trim()) return;
            createMutation.mutate({ name: teamName.trim(), cycleId: activeCycleId });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Team Name"
            placeholder="e.g. CodeCrafters / AI Research Group"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Member */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Team Member"
        description="Enter the student's unique PNR number to add them to your team."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!team || !memberPnr.trim()) return;
            addMemberMutation.mutate({ teamId: team.id, pnr: memberPnr.trim() });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Student PNR"
            placeholder="e.g. STU2024002"
            value={memberPnr}
            onChange={(e) => setMemberPnr(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddMemberModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addMemberMutation.isPending}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

