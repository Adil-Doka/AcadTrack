import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { phaseApi, submissionApi, cycleApi, teamApi, projectApi, evaluationApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate, formatDeadline, formatFileSize, getFileIcon } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Calendar,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Paperclip,
  Check,
  ChevronDown,
  Layers,
  Award,
} from 'lucide-react';

export const StudentPhasesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);

  // Active cycles
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

  // Phases for cycle
  const { data: phases, isLoading: isPhasesLoading } = useQuery({
    queryKey: ['phases', currentCycle?.id],
    queryFn: () => (currentCycle ? phaseApi.getByCycle(currentCycle.id) : Promise.resolve([])),
    enabled: !!currentCycle,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ phaseId, projId, files, notes }: { phaseId: number; projId: number; files: File[]; notes?: string }) =>
      submissionApi.submit(phaseId, projId, files, notes),
    onSuccess: () => {
      toast.success('Deliverables submitted successfully!');
      setIsSubmitModalOpen(false);
      setFiles([]);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Submission failed');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleOpenSubmit = (phaseId: number) => {
    setSelectedPhaseId(phaseId);
    setFiles([]);
    setNotes('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhaseId || !project) {
      toast.error('Approved project is required to submit deliverables');
      return;
    }
    if (files.length === 0) {
      toast.error('Please select at least one deliverable file');
      return;
    }
    uploadMutation.mutate({
      phaseId: selectedPhaseId,
      projId: project.id,
      files,
      notes: notes.trim() || undefined,
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
      toast.error('Failed to download file');
    }
  };

  if (isPhasesLoading) {
    return <PageLoading message="Loading project phases..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phases & Deliverables"
        subtitle="Track phase milestones, upload assignment artifacts, and review past submissions"
      />

      {!project && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Note: You must have an approved project to submit phase deliverables.</span>
        </div>
      )}

      {phases && phases.length > 0 ? (
        <div className="space-y-4">
          {phases.map((phase, index) => {
            const isExpanded = expandedPhaseId === phase.id;
            const deadline = formatDeadline(phase.deadline);

            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                index={index}
                isExpanded={isExpanded}
                deadline={deadline}
                projectId={project?.id}
                onToggle={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                onOpenSubmit={() => handleOpenSubmit(phase.id)}
                onDownload={handleDownload}
                canSubmit={!!project}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          title="No Phases Scheduled"
          description="The coordinator has not configured phases for this academic cycle yet."
        />
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Phase Deliverable"
        description="Upload reports, code archives, or presentations (PDF, DOCX, ZIP, PPTX max 10MB each)."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Select Files <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                multiple
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Click to browse files
              </label>
              <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, PPTX, ZIP, JPG, PNG</p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs text-slate-700"
                  >
                    <span className="truncate max-w-[80%]">{f.name}</span>
                    <span className="text-slate-400 text-[10px]">{formatFileSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Textarea
            label="Submission Notes (Optional)"
            placeholder="Add relevant comments, links, or notes for the coordinator..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={uploadMutation.isPending} icon={<Upload className="w-3.5 h-3.5" />}>
              Upload Deliverable
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Sub-component for individual phase item to query history independently
const PhaseCard: React.FC<{
  phase: any;
  index: number;
  isExpanded: boolean;
  deadline: any;
  projectId?: number;
  canSubmit: boolean;
  onToggle: () => void;
  onOpenSubmit: () => void;
  onDownload: (docId: number, filename: string) => void;
}> = ({
  phase,
  index,
  isExpanded,
  deadline,
  projectId,
  canSubmit,
  onToggle,
  onOpenSubmit,
  onDownload,
}) => {
  // Submissions for this phase
  const { data: submissions } = useQuery({
    queryKey: ['submissions', phase.id, projectId],
    queryFn: () => (projectId ? submissionApi.getHistory(phase.id, projectId) : Promise.resolve([])),
    enabled: !!projectId && isExpanded,
  });

  // Criteria for this phase
  const { data: criteria } = useQuery({
    queryKey: ['criteria', phase.id],
    queryFn: () => evaluationApi.getCriteria(phase.id),
    enabled: isExpanded,
  });

  const hasSubmitted = submissions && submissions.length > 0;

  return (
    <Card className="overflow-hidden border border-slate-200">
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{phase.name}</h3>
              {hasSubmitted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Submitted
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{phase.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                deadline.urgency === 'past'
                  ? 'bg-red-50 text-red-600'
                  : deadline.urgency === 'today'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {deadline.text}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Due {formatDate(phase.deadline)}</p>
          </div>

          {canSubmit && (
            <Button size="sm" variant="outline" onClick={onOpenSubmit} icon={<Upload className="w-3.5 h-3.5" />}>
              Submit
            </Button>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5"
          >
            {/* Criteria section */}
            {criteria && criteria.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Evaluation Criteria ({criteria.reduce((acc, c) => acc + c.maxMarks, 0)} Total Marks)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {criteria.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-slate-900">{c.name}</span>
                        <p className="text-[10px] text-slate-400">{c.criterionType}</p>
                      </div>
                      <Badge variant="blue">{c.maxMarks} pts</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission history section */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Submission History
              </h4>
              {submissions && submissions.length > 0 ? (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-800">
                            Submitted by {sub.submittedBy}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(sub.submittedAt, 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {sub.notes && <p className="text-xs text-slate-500 mt-1 italic">"{sub.notes}"</p>}

                        {/* Files */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sub.documents?.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => onDownload(doc.id, doc.filename)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs text-slate-700 transition-colors"
                            >
                              <span>{getFileIcon(doc.contentType)}</span>
                              <span className="font-mono">{doc.filename}</span>
                              <Download className="w-3 h-3 text-slate-400 ml-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No submission made yet for this phase.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

