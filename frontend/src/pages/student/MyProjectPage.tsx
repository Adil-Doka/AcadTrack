import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { projectApi, teamApi, cycleApi, githubApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FolderOpen,
  Edit3,
  Send,
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Code2,
  Calendar,
  Layers,
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const MyProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
  });

  // Get active cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: cycleApi.getActive,
  });
  const currentCycle = cycles && cycles.length > 0 ? cycles[0] : null;

  // Get user's team
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['my-team', currentCycle?.id],
    queryFn: () => (currentCycle ? teamApi.getMyTeam(currentCycle.id) : Promise.reject('No cycle')),
    enabled: !!currentCycle,
    retry: false,
  });

  // Get project by team
  const {
    data: project,
    isLoading: isProjectLoading,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ['my-project', team?.id],
    queryFn: () => (team ? projectApi.getByTeam(team.id) : Promise.reject('No team')),
    enabled: !!team,
    retry: false,
  });

  // Get GitHub Stats
  const {
    data: githubData,
    isLoading: isGithubLoading,
    refetch: refetchGithub,
  } = useQuery({
    queryKey: ['project-github', project?.id],
    queryFn: () => (project?.id ? githubApi.getData(project.id) : Promise.reject('No project')),
    enabled: !!project?.id && !!project?.githubUrl,
    retry: false,
  });

  // Refresh GitHub Mutation
  const refreshGithubMutation = useMutation({
    mutationFn: (projectId: number) => githubApi.refresh(projectId),
    onSuccess: () => {
      toast.success('GitHub metrics refreshed!');
      refetchGithub();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to refresh GitHub data');
    },
  });

  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: (data) => {
      toast.success('Project proposition registered!');
      setIsEditModalOpen(false);
      refetchProject();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to register project');
    },
  });

  // Update Project Mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => projectApi.update(id, data),
    onSuccess: () => {
      toast.success('Project details updated!');
      setIsEditModalOpen(false);
      refetchProject();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update project');
    },
  });

  // Submit Project Mutation
  const submitProjectMutation = useMutation({
    mutationFn: (projectId: number) => projectApi.submit(projectId),
    onSuccess: () => {
      toast.success('Project submitted for coordinator approval!');
      refetchProject();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit project');
    },
  });

  if (isTeamLoading || (team && isProjectLoading && !project)) {
    return <PageLoading message="Loading project information..." />;
  }

  const isLeader = team?.members?.some(
    (m: any) => m.userId === user?.id && (m.teamRole === 'LEADER' || m.role === 'LEADER')
  );
  const canEdit = isLeader && (!project || project.status === 'DRAFT' || project.status === 'REJECTED');

  const openForm = () => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        githubUrl: project.githubUrl || '',
      });
    } else {
      setFormData({ title: '', description: '', techStack: '', githubUrl: '' });
    }
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (project) {
      updateProjectMutation.mutate({ id: project.id, data: formData });
    } else if (team && currentCycle) {
      createProjectMutation.mutate({
        ...formData,
        teamId: team.id,
        cycleId: currentCycle.id,
      });
    }
  };

  if (!currentCycle && !cycles?.length && !isTeamLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Overview"
          subtitle="Manage your capstone proposal, tech stack, and GitHub repository integration"
        />
        <Card className="p-8">
          <EmptyState
            icon={<Calendar className="w-12 h-12 text-slate-400" />}
            title="No Active Academic Cycle"
            description="There is no active academic project cycle in session. Contact your coordinator to activate one."
          />
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Overview"
          subtitle="Manage your capstone proposal, tech stack, and GitHub repository integration"
        />
        <Card className="p-8">
          <EmptyState
            icon={<FolderOpen className="w-12 h-12 text-slate-400" />}
            title="Team Required First"
            description="You need to form or join an approved team before creating or viewing a project proposal."
            action={{
              label: 'Go to Team Page',
              onClick: () => navigate('/team'),
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Overview"
        subtitle="Manage your capstone proposal, tech stack, and GitHub repository integration"
      />

      {!project ? (
        <Card className="p-8">
          {team.status !== 'APPROVED' ? (
            <EmptyState
              icon={<FolderOpen className="w-12 h-12 text-amber-500" />}
              title="Team Pending Approval"
              description={`Your team (${team.name}) is currently ${team.status.toLowerCase().replace('_', ' ')}. You can register a project proposal once your coordinator approves the team.`}
              action={{
                label: 'Check Team Status',
                onClick: () => navigate('/team'),
              }}
            />
          ) : (
            <EmptyState
              icon={<FolderOpen className="w-12 h-12 text-indigo-500" />}
              title="No Project Proposal Yet"
              description={
                isLeader
                  ? "Your team is approved! Define your project title, abstract, tech stack, and GitHub repository to begin."
                  : "Your team is approved! Your team leader can now register and submit the project proposal."
              }
              action={
                isLeader
                  ? {
                      label: 'Propose Project',
                      onClick: openForm,
                    }
                  : undefined
              }
            />
          )}
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Project Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{project.title}</h2>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Team:{' '}
                    <span className="font-medium text-slate-700">{project.teamName}</span>
                    <span>·</span>
                    <Calendar className="w-3.5 h-3.5" /> Created {formatDate(project.createdAt)}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={openForm}
                    >
                      Edit
                    </Button>
                    {project.status !== 'SUBMITTED' && project.status !== 'APPROVED' && (
                      <Button
                        size="sm"
                        icon={<Send className="w-3.5 h-3.5" />}
                        loading={submitProjectMutation.isPending}
                        onClick={() => submitProjectMutation.mutate(project.id)}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Rejection Notice */}
              {project.status === 'REJECTED' && project.rejectionReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-red-800">Proposal Needs Revision</h4>
                    <p className="text-xs text-red-700 mt-0.5">{project.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Project Description
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {project.description}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.split(',').map((tech, idx) => (
                    <Badge key={idx} variant="purple" className="px-3 py-1 text-xs">
                      <Code2 className="w-3 h-3 mr-1" />
                      {tech.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* GitHub / Repository Side Card */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GithubIcon className="w-5 h-5 text-slate-900" />
                  <h3 className="text-sm font-semibold text-slate-900">Repository Insights</h3>
                </div>
                {project.githubUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    loading={refreshGithubMutation.isPending}
                    onClick={() => refreshGithubMutation.mutate(project.id)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {project.githubUrl ? (
                <div className="pt-4 space-y-4">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors text-xs text-indigo-600 font-medium group"
                  >
                    <span className="truncate">{project.githubUrl.replace('https://github.com/', '')}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1 text-slate-400 group-hover:text-indigo-600" />
                  </a>

                  {isGithubLoading ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading GitHub statistics...</div>
                  ) : githubData ? (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[11px] text-slate-400">Stars</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-slate-800">{githubData.stars}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[11px] text-slate-400">Forks</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <GitFork className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-sm font-bold text-slate-800">{githubData.forks}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[11px] text-slate-400">Commits</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-sm font-bold text-slate-800">{githubData.commitCount}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[11px] text-slate-400">Contributors</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-sm font-bold text-slate-800">{githubData.contributorCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Language: {githubData.language || 'Multi'}</span>
                        <span>Updated: {formatDate(githubData.snapshotAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                      Click refresh to sync the latest repository snapshots.
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-6 text-center text-xs text-slate-400">
                  <GithubIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No GitHub repository connected yet.
                  {canEdit && (
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={openForm}>
                        Connect Repo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </motion.div>
      )}

      {/* Modal: Propose / Edit Project */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={project ? 'Update Project Proposal' : 'Propose New Capstone Project'}
        description="Provide a concise title, problem description, stack, and GitHub URL."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <Input
            label="Project Title"
            placeholder="e.g. Distributed Task Scheduling Platform"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />
          <Textarea
            label="Abstract / Description"
            placeholder="Explain the background, core problem, methodology, and expected outcomes..."
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Input
            label="Technology Stack"
            placeholder="e.g. React, Spring Boot, MySQL, Docker, Redis"
            hint="Comma separated values"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            required
          />
          <Input
            label="GitHub Repository URL"
            placeholder="https://github.com/organization/repo"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {project ? 'Save Changes' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

