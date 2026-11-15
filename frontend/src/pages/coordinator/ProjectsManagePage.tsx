import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, cycleApi } from '@/lib/api';
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
  FolderOpen,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Code2,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const ProjectsManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject modal
  const [rejectProjectId, setRejectProjectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Detail expand
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  // Cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles'],
    queryFn: cycleApi.getAll,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Projects list
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', activeCycleId, statusFilter],
    queryFn: () =>
      projectApi.getAll({
        cycleId: activeCycleId,
        status: statusFilter || undefined,
      }),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: projectApi.approve,
    onSuccess: () => {
      toast.success('Project approved!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Approval failed'),
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: projectApi.putUnderReview,
    onSuccess: () => {
      toast.success('Project placed under review');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      projectApi.reject(id, { reason }),
    onSuccess: () => {
      toast.success('Project proposal rejected');
      setRejectProjectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Rejection failed'),
  });

  const filteredProjects = projects?.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.techStack.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <PageLoading message="Loading project proposals..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Proposals"
        subtitle="Evaluate capstone project topics, review technological stacks, and grant approval"
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by title, team, or stack..."
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

      {filteredProjects && filteredProjects.length > 0 ? (
        <div className="space-y-3">
          {filteredProjects.map((proj) => {
            const isExpanded = expandedProjectId === proj.id;

            return (
              <Card key={proj.id} className="overflow-hidden border border-slate-200">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                        <StatusBadge status={proj.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Team: <strong className="text-slate-700">{proj.teamName}</strong></span>
                        <span>·</span>
                        <span>Cycle: {proj.cycleName}</span>
                        <span>·</span>
                        <span>Updated {formatDate(proj.updatedAt)}</span>
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proj.techStack.split(',').map((t, idx) => (
                          <Badge key={idx} variant="default" className="text-[10px]">
                            {t.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {proj.status === 'SUBMITTED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-8"
                        loading={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate(proj.id)}
                      >
                        Review
                      </Button>
                    )}

                    {(proj.status === 'SUBMITTED' || proj.status === 'UNDER_REVIEW') && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs h-8"
                          loading={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(proj.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="text-xs h-8"
                          onClick={() => {
                            setRejectProjectId(proj.id);
                            setRejectReason('');
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                    >
                      {isExpanded ? 'Less' : 'Details'}
                      <ChevronDown
                        className={`w-3.5 h-3.5 ml-1 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs text-slate-700">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Project Abstract:</h4>
                      <p className="whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {proj.description}
                      </p>
                    </div>

                    {proj.githubUrl && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">GitHub Repository:</span>
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          {proj.githubUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {proj.rejectionReason && (
                      <p className="text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                        <strong>Rejection Reason:</strong> {proj.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen className="w-10 h-10" />}
          title="No Projects Found"
          description="No projects match the current search or filters."
        />
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectProjectId !== null}
        onClose={() => setRejectProjectId(null)}
        title="Reject Project Proposal"
        description="Detail the revisions or objections required from the team."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rejectProjectId && rejectReason.trim()) {
              rejectMutation.mutate({ id: rejectProjectId, reason: rejectReason.trim() });
            }
          }}
          className="space-y-4 pt-2"
        >
          <Textarea
            label="Rejection Comments"
            placeholder="e.g. Scope too narrow, overlaps with existing project, missing feasibility analysis..."
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectProjectId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={rejectMutation.isPending}>
              Reject Proposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

