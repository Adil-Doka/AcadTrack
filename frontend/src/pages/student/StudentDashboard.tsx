import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { dashboardApi, cycleApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';
import { formatDate, formatDeadline, percentageOf } from '@/lib/utils';
import {
  Users, FolderOpen, Calendar, TrendingUp, CheckCircle2,
  Clock, Star, AlertCircle, ChevronRight, Upload, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const StudentDashboard: React.FC = () => {
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);

  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: cycleApi.getActive,
  });

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', 'student', selectedCycleId],
    queryFn: () => dashboardApi.getStudent(selectedCycleId),
  });

  if (isLoading) return <PageLoading />;

  const marks = dashboard?.totalMarksAwarded ?? 0;
  const totalMarks = dashboard?.totalPossibleMarks ?? 0;
  const scorePercent = percentageOf(marks, totalMarks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your project progress at a glance</p>
        </div>
        {cycles && cycles.length > 0 && (
          <Select
            options={cycles.map(c => ({ value: c.id, label: c.name }))}
            value={selectedCycleId ?? ''}
            onChange={(e) => setSelectedCycleId(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="All Cycles"
            className="w-48"
          />
        )}
      </div>

      {/* Stats Row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: 'Team Status',
            value: dashboard?.team?.status ?? 'No Team',
            icon: <Users className="w-5 h-5" />,
            color: 'bg-blue-50 text-blue-600',
            sub: dashboard?.team?.name,
          },
          {
            label: 'Project Status',
            value: dashboard?.project?.status ?? 'No Project',
            icon: <FolderOpen className="w-5 h-5" />,
            color: 'bg-violet-50 text-violet-600',
            sub: dashboard?.project?.title,
          },
          {
            label: 'Submissions',
            value: dashboard?.submissions?.length ?? 0,
            icon: <Upload className="w-5 h-5" />,
            color: 'bg-amber-50 text-amber-600',
            sub: `of ${dashboard?.phases?.length ?? 0} phases`,
          },
          {
            label: 'Score',
            value: `${scorePercent}%`,
            icon: <Award className="w-5 h-5" />,
            color: 'bg-emerald-50 text-emerald-600',
            sub: `${marks} / ${totalMarks} marks`,
          },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{String(stat.value)}</p>
              {stat.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{stat.sub}</p>}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Phase Timeline */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Phase Timeline</h2>
              <Link to="/phases" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              {dashboard?.phases && dashboard.phases.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.phases.map((phase, index) => {
                    const hasSubmission = dashboard.submissions?.some(s => s.phaseId === phase.id);
                    const deadline = formatDeadline(phase.deadline);
                    return (
                      <div key={phase.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            hasSubmission
                              ? 'bg-emerald-100 text-emerald-600'
                              : deadline.urgency === 'past'
                              ? 'bg-red-100 text-red-500'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {hasSubmission ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span className="text-xs font-semibold">{index + 1}</span>
                            )}
                          </div>
                          {index < (dashboard.phases?.length ?? 0) - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-2 min-h-[16px]" />
                          )}
                        </div>
                        <div className="pb-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 truncate">{phase.name}</p>
                            <span className={`text-xs whitespace-nowrap font-medium ${
                              deadline.urgency === 'past' ? 'text-red-600' :
                              deadline.urgency === 'today' ? 'text-amber-600' :
                              deadline.urgency === 'soon' ? 'text-orange-500' : 'text-slate-400'
                            }`}>
                              {deadline.text}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{phase.description}</p>
                          {hasSubmission && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> Submitted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <Calendar className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No phases defined yet</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Team Card */}
          <motion.div variants={item} initial="hidden" animate="show" style={{ animationDelay: '100ms' }}>
            <Card>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">My Team</h2>
                <Link to="/team" className="text-xs text-indigo-600 hover:text-indigo-700">View</Link>
              </div>
              <div className="p-4">
                {dashboard?.team ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-900">{dashboard.team.name}</span>
                      <StatusBadge status={dashboard.team.status} size="sm" />
                    </div>
                    <div className="flex -space-x-2">
                      {dashboard.team.members?.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center ring-2 ring-white"
                          title={member.name}
                        >
                          {member.name.charAt(0)}
                        </div>
                      ))}
                      {(dashboard.team.members?.length ?? 0) > 4 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center justify-center ring-2 ring-white">
                          +{dashboard.team.members.length - 4}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {dashboard.team.members?.length ?? 0} members
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No team yet</p>
                    <Link to="/team" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">Create team →</Link>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Score Card */}
          {dashboard?.releasedEvaluations && dashboard.releasedEvaluations.length > 0 && (
            <motion.div variants={item} initial="hidden" animate="show" style={{ animationDelay: '200ms' }}>
              <Card>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">My Score</h2>
                  <Link to="/evaluations" className="text-xs text-indigo-600 hover:text-indigo-700">Details</Link>
                </div>
                <div className="p-4">
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-slate-900">{scorePercent}%</span>
                    <span className="text-sm text-slate-500 pb-1">{marks}/{totalMarks} pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-indigo-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {dashboard.releasedEvaluations.slice(0, 3).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 truncate">{ev.phaseName}</span>
                        <span className="text-slate-900 font-medium ml-2 shrink-0">
                          {ev.totalMarks ?? ev.totalMarksAwarded ?? 0}/{ev.phaseMaxMarks ?? ev.totalPossibleMarks ?? 100}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

