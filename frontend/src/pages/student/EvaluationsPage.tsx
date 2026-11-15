import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { evaluationApi, teamApi, projectApi, cycleApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate, percentageOf } from '@/lib/utils';
import {
  Award,
  CheckCircle,
  MessageSquare,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';

export const StudentEvaluationsPage: React.FC = () => {
  // Get active cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: cycleApi.getActive,
  });
  const currentCycle = cycles && cycles.length > 0 ? cycles[0] : null;

  // Student team
  const { data: team } = useQuery({
    queryKey: ['my-team', currentCycle?.id],
    queryFn: () => (currentCycle ? teamApi.getMyTeam(currentCycle.id) : Promise.reject('No cycle')),
    enabled: !!currentCycle,
    retry: false,
  });

  // Student project
  const { data: project } = useQuery({
    queryKey: ['my-project', team?.id],
    queryFn: () => (team ? projectApi.getByTeam(team.id) : Promise.reject('No team')),
    enabled: !!team,
    retry: false,
  });

  // Project evaluations
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ['evaluations', project?.id],
    queryFn: () => (project?.id ? evaluationApi.getForProject(project.id) : Promise.resolve([])),
    enabled: !!project?.id,
  });

  if (isLoading) {
    return <PageLoading message="Fetching evaluations..." />;
  }

  // Filter published evaluations only
  const publishedEvaluations = evaluations?.filter((e) => e.published) || [];

  const totalAwarded = publishedEvaluations.reduce(
    (acc, e) => acc + (e.totalMarks ?? e.totalMarksAwarded ?? 0),
    0
  );
  const totalPossible = publishedEvaluations.reduce(
    (acc, e) => acc + (e.phaseMaxMarks ?? e.totalPossibleMarks ?? 100),
    0
  );
  const totalPercent = percentageOf(totalAwarded, totalPossible);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations & Grades"
        subtitle="Review official assessment feedback and criteria-wise marks awarded by coordinators"
      />

      {/* Summary Score Card */}
      {publishedEvaluations.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-indigo-900 to-slate-900 text-white border-0 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-xs uppercase font-semibold text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Aggregate Score
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold">{totalAwarded}</span>
                <span className="text-sm text-indigo-200">/ {totalPossible} Total Points</span>
                <span className="text-lg font-semibold text-indigo-300">({totalPercent}%)</span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Calculated across {publishedEvaluations.length} evaluated phase
                {publishedEvaluations.length > 1 ? 's' : ''}.
              </p>
            </div>

            <div className="w-full sm:w-48 bg-white/10 rounded-full h-3 p-0.5 overflow-hidden border border-white/10">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {publishedEvaluations.length === 0 ? (
        <EmptyState
          icon={<Award className="w-10 h-10" />}
          title="No Published Evaluations"
          description="Your submissions are either undergoing review or have not been officially published by the coordinator yet."
        />
      ) : (
        <div className="space-y-6">
          {publishedEvaluations.map((evaluation) => {
            const awarded = evaluation.totalMarks ?? evaluation.totalMarksAwarded ?? 0;
            const max = evaluation.phaseMaxMarks ?? evaluation.totalPossibleMarks ?? 100;
            const phasePercent = percentageOf(awarded, max);

            return (
              <motion.div
                key={evaluation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 border border-slate-200 space-y-6">
                  {/* Evaluation Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{evaluation.phaseName}</h3>
                        <Badge variant="green" className="text-xs">
                          Published
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Evaluated by {evaluation.evaluatorName || evaluation.evaluatedBy}</span>
                        <span>·</span>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(evaluation.evaluatedAt)}</span>
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100">
                      <span className="text-lg font-bold text-indigo-700">
                        {awarded}
                      </span>
                      <span className="text-xs text-indigo-500">
                        / {max} pts ({phasePercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Criteria Breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Rubric Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {evaluation.marks?.map((mark) => (
                        <div
                          key={mark.id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              {mark.criterionName}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {mark.marksAwarded} / {mark.maxMarks}
                            </span>
                          </div>
                          {(mark.remarks || mark.comments) && (
                            <p className="text-xs text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-100">
                              {mark.remarks || mark.comments}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  {(evaluation.generalRemarks || evaluation.feedback) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Coordinator Overall Remarks</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{evaluation.generalRemarks || evaluation.feedback}"
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

