import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  phaseApi,
  cycleApi,
  projectApi,
  submissionApi,
  evaluationApi,
} from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate, getFileIcon, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  Download,
  Share2,
  CheckCircle,
  FileText,
  Star,
  Award,
} from 'lucide-react';

export const EvaluationsManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);

  // Evaluating Submission state
  const [evaluatingSubmission, setEvaluatingSubmission] = useState<any | null>(null);
  const [marksState, setMarksState] = useState<Record<number, { marksAwarded: number; comments: string }>>({});
  const [feedback, setFeedback] = useState('');

  // Active cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles'],
    queryFn: cycleApi.getAll,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Phases for cycle
  const { data: phases } = useQuery({
    queryKey: ['phases', activeCycleId],
    queryFn: () => (activeCycleId ? phaseApi.getByCycle(activeCycleId) : Promise.resolve([])),
    enabled: !!activeCycleId,
  });

  const activePhaseId = selectedPhaseId || (phases && phases.length > 0 ? phases[0].id : undefined);

  // Approved projects for cycle
  const { data: projects } = useQuery({
    queryKey: ['projects', activeCycleId],
    queryFn: () => (activeCycleId ? projectApi.getAll({ cycleId: activeCycleId, status: 'APPROVED' }) : Promise.resolve([])),
    enabled: !!activeCycleId,
  });

  const activeProjectId = selectedProjectId || (projects && projects.length > 0 ? projects[0].id : undefined);

  // Submissions for this phase & project
  const { data: submissions, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ['submissions', activePhaseId, activeProjectId],
    queryFn: () =>
      activePhaseId && activeProjectId
        ? submissionApi.getHistory(activePhaseId, activeProjectId)
        : Promise.resolve([]),
    enabled: !!activePhaseId && !!activeProjectId,
  });

  // Criteria for active phase
  const { data: criteria } = useQuery({
    queryKey: ['criteria', activePhaseId],
    queryFn: () => (activePhaseId ? evaluationApi.getCriteria(activePhaseId) : Promise.resolve([])),
    enabled: !!activePhaseId,
  });

  // Project evaluations to check if already evaluated
  const { data: projectEvaluations } = useQuery({
    queryKey: ['evaluations', activeProjectId],
    queryFn: () => (activeProjectId ? evaluationApi.getForProject(activeProjectId) : Promise.resolve([])),
    enabled: !!activeProjectId,
  });

  // Evaluate Mutation
  const evaluateMutation = useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: number; data: any }) =>
      evaluationApi.evaluateSubmission(submissionId, data),
    onSuccess: () => {
      toast.success('Evaluation saved successfully!');
      setEvaluatingSubmission(null);
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Evaluation failed'),
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: (evaluationId: number) => evaluationApi.publishEvaluation(evaluationId),
    onSuccess: () => {
      toast.success('Evaluation published to students!');
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Publishing failed'),
  });

  const handleStartEvaluate = (sub: any) => {
    setEvaluatingSubmission(sub);
    setFeedback('');
    const initialMarks: Record<number, { marksAwarded: number; comments: string }> = {};
    criteria?.forEach((c) => {
      initialMarks[c.id] = { marksAwarded: c.maxMarks, comments: '' };
    });
    setMarksState(initialMarks);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingSubmission) return;

    const marks = Object.entries(marksState).map(([criterionId, val]) => ({
      criterionId: Number(criterionId),
      marksAwarded: val.marksAwarded,
      comments: val.comments.trim() || undefined,
    }));

    evaluateMutation.mutate({
      submissionId: evaluatingSubmission.id,
      data: {
        feedback: feedback.trim() || undefined,
        marks,
      },
    });
  };

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const blob = await submissionApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment & Grading Console"
        subtitle="Review uploaded artifacts, score criteria against rubrics, and publish official marks"
      />

      {/* Selector Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cycles && (
          <Select
            label="Cycle"
            value={activeCycleId || ''}
            onChange={(e) => setSelectedCycleId(Number(e.target.value))}
            options={cycles.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}

        {phases && (
          <Select
            label="Phase Milestone"
            value={activePhaseId || ''}
            onChange={(e) => setSelectedPhaseId(Number(e.target.value))}
            options={phases.map((p) => ({ value: p.id, label: p.name }))}
          />
        )}

        {projects && (
          <Select
            label="Approved Project"
            value={activeProjectId || ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            options={projects.map((p) => ({ value: p.id, label: `${p.title} (${p.teamName})` }))}
          />
        )}
      </div>

      {/* Submissions Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Submissions for Selected Target</h3>

        {isSubmissionsLoading ? (
          <PageLoading message="Fetching deliverable submissions..." />
        ) : submissions && submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const matchingEval = projectEvaluations?.find((e) => e.submissionId === sub.id);

              return (
                <Card key={sub.id} className="p-5 border border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Submission #{sub.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          by {sub.submittedBy} on {formatDate(sub.submittedAt, 'MMM d, yyyy h:mm a')}
                        </span>
                        {matchingEval && (
                          <Badge variant={matchingEval.published ? 'green' : 'amber'}>
                            {matchingEval.published ? 'Published' : 'Evaluated (Draft)'}
                          </Badge>
                        )}
                      </div>

                      {sub.notes && (
                        <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded border border-slate-100">
                          Notes: "{sub.notes}"
                        </p>
                      )}

                      {/* Documents list */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {sub.documents?.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleDownload(doc.id, doc.filename)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 font-mono transition-colors"
                          >
                            <span>{getFileIcon(doc.contentType)}</span>
                            <span>{doc.filename}</span>
                            <span className="text-slate-400 text-[10px]">({formatFileSize(doc.size)})</span>
                            <Download className="w-3 h-3 text-slate-400 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!matchingEval ? (
                        <Button
                          size="sm"
                          icon={<ClipboardCheck className="w-4 h-4" />}
                          onClick={() => handleStartEvaluate(sub)}
                        >
                          Grade Deliverable
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                            Score: {matchingEval.totalMarksAwarded} / {matchingEval.totalPossibleMarks}
                          </span>
                          {!matchingEval.published && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="text-xs h-8"
                              loading={publishMutation.isPending}
                              onClick={() => publishMutation.mutate(matchingEval.id)}
                              icon={<Share2 className="w-3.5 h-3.5" />}
                            >
                              Publish Marks
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No Submissions Yet"
            description="The selected project team has not submitted deliverables for this phase milestone yet."
          />
        )}
      </div>

      {/* Evaluate Modal */}
      <Modal
        isOpen={evaluatingSubmission !== null}
        onClose={() => setEvaluatingSubmission(null)}
        title="Grade Phase Deliverable"
        description="Enter marks for each rubric item and provide constructive feedback."
        size="lg"
      >
        <form onSubmit={handleSaveEvaluation} className="space-y-5 pt-2">
          {criteria && criteria.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Rubric Criteria Marks
              </h4>

              {criteria.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      <p className="text-[10px] text-slate-400">{c.description || c.criterionType}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">Max: {c.maxMarks}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Input
                      type="number"
                      max={c.maxMarks}
                      min={0}
                      label="Marks Awarded"
                      value={marksState[c.id]?.marksAwarded ?? c.maxMarks}
                      onChange={(e) =>
                        setMarksState({
                          ...marksState,
                          [c.id]: {
                            ...marksState[c.id],
                            marksAwarded: Number(e.target.value),
                          },
                        })
                      }
                      required
                    />
                    <div className="col-span-2">
                      <Input
                        label="Criterion Remark (Optional)"
                        placeholder="e.g. Good documentation, needs more test coverage"
                        value={marksState[c.id]?.comments || ''}
                        onChange={(e) =>
                          setMarksState({
                            ...marksState,
                            [c.id]: {
                              ...marksState[c.id],
                              comments: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Textarea
                label="Overall Assessment Feedback"
                placeholder="Summarize positive accomplishments and required areas of improvement..."
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded">
              Warning: No criteria configured for this phase! Please add evaluation criteria on the Phases page first.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEvaluatingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={evaluateMutation.isPending}
              disabled={!criteria || criteria.length === 0}
            >
              Submit Evaluation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

