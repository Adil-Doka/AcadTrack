import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardApi, cycleApi, teamApi, projectApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate, formatDeadline } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  FolderOpen,
  Calendar,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CoordinatorDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);

  // Active Cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: cycleApi.getActive,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Coordinator Dashboard Data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', 'coordinator', activeCycleId],
    queryFn: () => dashboardApi.getCoordinator(activeCycleId),
    enabled: true,
  });

  // Approve Team Mutation
  const approveTeamMutation = useMutation({
    mutationFn: teamApi.approve,
    onSuccess: () => {
      toast.success('Team approved successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'coordinator'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve team'),
  });

  // Approve Project Mutation
  const approveProjectMutation = useMutation({
    mutationFn: projectApi.approve,
    onSuccess: () => {
      toast.success('Project approved successfully');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'coordinator'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to approve project'),
  });

  if (isLoading) return <PageLoading message="Compiling coordinator analytics..." />;

  const stats = dashboard?.stats || {};
  const teamsAwaiting = dashboard?.teamsAwaitingReview || [];
  const projectsAwaiting = dashboard?.projectsAwaitingReview || [];
  const upcomingPhases = dashboard?.upcomingPhases || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Coordinator Center"
          subtitle={`Managing cycle: ${dashboard?.cycleName || 'Active Cycle'}`}
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

      {/* Stats KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Teams',
            value: stats['TOTAL_TEAMS'] ?? teamsAwaiting.length,
            icon: <Users className="w-5 h-5" />,
            color: 'bg-blue-50 text-blue-600',
            link: '/teams',
          },
          {
            label: 'Total Projects',
            value: stats['TOTAL_PROJECTS'] ?? projectsAwaiting.length,
            icon: <FolderOpen className="w-5 h-5" />,
            color: 'bg-indigo-50 text-indigo-600',
            link: '/projects',
          },
          {
            label: 'Teams to Review',
            value: teamsAwaiting.length,
            icon: <AlertCircle className="w-5 h-5" />,
            color: 'bg-amber-50 text-amber-600',
            link: '/teams',
          },
          {
            label: 'Pending Evaluations',
            value: dashboard?.pendingEvaluationsCount ?? 0,
            icon: <ClipboardList className="w-5 h-5" />,
            color: 'bg-rose-50 text-rose-600',
            link: '/evaluations',
          },
        ].map((item, index) => (
          <Link key={index} to={item.link}>
            <Card hover className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams Awaiting Review */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Teams Awaiting Review</h3>
              <p className="text-xs text-slate-400">Needs coordinator clearance</p>
            </div>
            <Link to="/teams" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View All ({teamsAwaiting.length})
            </Link>
          </div>

          {teamsAwaiting.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending team reviews.</p>
          ) : (
            <div className="space-y-3">
              {teamsAwaiting.slice(0, 4).map((team) => (
                <div
                  key={team.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{team.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {team.members?.length || 0} members · Submittted {formatDate(team.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-7 text-xs px-2.5"
                      loading={approveTeamMutation.isPending}
                      onClick={() => approveTeamMutation.mutate(team.id)}
                    >
                      Approve
                    </Button>
                    <Link to="/teams">
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-2">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Projects Awaiting Review */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Proposals to Review</h3>
              <p className="text-xs text-slate-400">Validate proposal scope and stack</p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View All ({projectsAwaiting.length})
            </Link>
          </div>

          {projectsAwaiting.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending project proposals.</p>
          ) : (
            <div className="space-y-3">
              {projectsAwaiting.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{proj.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Team: {proj.teamName} · {proj.techStack}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      className="h-7 text-xs px-2.5"
                      loading={approveProjectMutation.isPending}
                      onClick={() => approveProjectMutation.mutate(proj.id)}
                    >
                      Approve
                    </Button>
                    <Link to="/projects">
                      <Button size="sm" variant="secondary" className="h-7 text-xs px-2">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Phase Milestones */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Upcoming Academic Deadlines</h3>
            <p className="text-xs text-slate-400">Scheduled milestones for this semester</p>
          </div>
          <Link to="/phases" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Manage Phases
          </Link>
        </div>

        {upcomingPhases.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No upcoming phases.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingPhases.map((phase) => {
              const deadline = formatDeadline(phase.deadline);
              return (
                <div
                  key={phase.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900">{phase.name}</span>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {phase.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{formatDate(phase.deadline)}</span>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {deadline.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

