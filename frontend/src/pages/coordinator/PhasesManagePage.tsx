import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phaseApi, cycleApi, evaluationApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Calendar,
  Plus,
  Edit2,
  Clock,
  History,
  CheckCircle2,
  ListPlus,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const PhasesManagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>(undefined);

  // Phase modal
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [phaseForm, setPhaseForm] = useState({
    name: '',
    description: '',
    deadline: '',
    orderIndex: 1,
    reason: '',
  });

  // Criterion modal
  const [activePhaseForCriterion, setActivePhaseForCriterion] = useState<number | null>(null);
  const [criterionForm, setCriterionForm] = useState({
    name: '',
    description: '',
    maxMarks: 20,
    criterionType: 'TECHNICAL',
  });

  // Deadline history modal
  const [historyPhaseId, setHistoryPhaseId] = useState<number | null>(null);

  // Cycles
  const { data: cycles } = useQuery({
    queryKey: ['cycles'],
    queryFn: cycleApi.getAll,
  });

  const activeCycleId = selectedCycleId || (cycles && cycles.length > 0 ? cycles[0].id : undefined);

  // Phases
  const { data: phases, isLoading } = useQuery({
    queryKey: ['phases', activeCycleId],
    queryFn: () => (activeCycleId ? phaseApi.getByCycle(activeCycleId) : Promise.resolve([])),
    enabled: !!activeCycleId,
  });

  // Deadline History Query
  const { data: deadlineHistory } = useQuery({
    queryKey: ['deadline-history', historyPhaseId],
    queryFn: () => (historyPhaseId ? phaseApi.getDeadlineHistory(historyPhaseId) : Promise.resolve([])),
    enabled: !!historyPhaseId,
  });

  // Create Phase Mutation
  const createPhaseMutation = useMutation({
    mutationFn: phaseApi.create,
    onSuccess: () => {
      toast.success('Phase created!');
      setIsPhaseModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['phases'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create phase'),
  });

  // Update Phase Mutation
  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => phaseApi.update(id, data),
    onSuccess: () => {
      toast.success('Phase updated!');
      setIsPhaseModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['phases'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update phase'),
  });

  // Create Criterion Mutation
  const createCriterionMutation = useMutation({
    mutationFn: ({ phaseId, data }: { phaseId: number; data: any }) =>
      evaluationApi.createCriterion(phaseId, data),
    onSuccess: () => {
      toast.success('Evaluation criterion added!');
      setActivePhaseForCriterion(null);
      setCriterionForm({ name: '', description: '', maxMarks: 20, criterionType: 'TECHNICAL' });
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to add criterion'),
  });

  const handleOpenCreatePhase = () => {
    setEditingPhaseId(null);
    setPhaseForm({
      name: '',
      description: '',
      deadline: '',
      orderIndex: (phases?.length || 0) + 1,
      reason: '',
    });
    setIsPhaseModalOpen(true);
  };

  const handleOpenEditPhase = (p: any) => {
    setEditingPhaseId(p.id);
    setPhaseForm({
      name: p.name,
      description: p.description,
      deadline: p.deadline.slice(0, 16), // datetime-local format
      orderIndex: p.orderIndex,
      reason: '',
    });
    setIsPhaseModalOpen(true);
  };

  const handleSavePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhaseId) {
      updatePhaseMutation.mutate({
        id: editingPhaseId,
        data: {
          name: phaseForm.name,
          description: phaseForm.description,
          deadline: phaseForm.deadline,
          reason: phaseForm.reason || undefined,
        },
      });
    } else if (activeCycleId) {
      createPhaseMutation.mutate({
        name: phaseForm.name,
        description: phaseForm.description,
        deadline: phaseForm.deadline,
        orderIndex: phaseForm.orderIndex,
        cycleId: activeCycleId,
      });
    }
  };

  if (isLoading) return <PageLoading message="Loading phases schedule..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Project Phases & Deadlines"
          subtitle="Define submission checkpoints, manage deadlines, and set grading criteria"
        />

        <div className="flex items-center gap-2">
          {cycles && (
            <Select
              className="w-44 text-xs h-9"
              value={activeCycleId || ''}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              options={cycles.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}

          <Button size="sm" onClick={handleOpenCreatePhase} icon={<Plus className="w-4 h-4" />}>
            New Phase
          </Button>
        </div>
      </div>

      {phases && phases.length > 0 ? (
        <div className="space-y-4">
          {phases.map((phase) => (
            <PhaseDetailCard
              key={phase.id}
              phase={phase}
              onEdit={() => handleOpenEditPhase(phase)}
              onAddCriterion={() => setActivePhaseForCriterion(phase.id)}
              onViewHistory={() => setHistoryPhaseId(phase.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          title="No Phases Configured"
          description="Create the first phase milestone (e.g. Synopsis, SRS, Mid-Term Presentation) for this cycle."
          action={{
            label: 'Add Phase',
            onClick: handleOpenCreatePhase,
          }}
        />
      )}

      {/* Phase Modal */}
      <Modal
        isOpen={isPhaseModalOpen}
        onClose={() => setIsPhaseModalOpen(false)}
        title={editingPhaseId ? 'Update Phase Details' : 'Create New Phase'}
        description="Specify the milestone title, expected deliverable scope, and strict deadline."
      >
        <form onSubmit={handleSavePhase} className="space-y-4 pt-2">
          <Input
            label="Phase Name"
            placeholder="e.g. Synopsis Submission / Final Prototype Demonstration"
            value={phaseForm.name}
            onChange={(e) => setPhaseForm({ ...phaseForm, name: e.target.value })}
            required
            autoFocus
          />
          <Textarea
            label="Description & Instructions"
            placeholder="Specify what students need to include in their deliverables..."
            rows={3}
            value={phaseForm.description}
            onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Submission Deadline"
              value={phaseForm.deadline}
              onChange={(e) => setPhaseForm({ ...phaseForm, deadline: e.target.value })}
              required
            />
            {!editingPhaseId && (
              <Input
                type="number"
                label="Sequence Index"
                value={phaseForm.orderIndex}
                onChange={(e) => setPhaseForm({ ...phaseForm, orderIndex: Number(e.target.value) })}
                required
              />
            )}
          </div>

          {editingPhaseId && (
            <Input
              label="Reason for Deadline Shift (Optional)"
              placeholder="e.g. Extended due to university examination week..."
              hint="Will be recorded in the audit deadline history"
              value={phaseForm.reason}
              onChange={(e) => setPhaseForm({ ...phaseForm, reason: e.target.value })}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsPhaseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createPhaseMutation.isPending || updatePhaseMutation.isPending}
            >
              {editingPhaseId ? 'Save Changes' : 'Create Phase'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Criterion Modal */}
      <Modal
        isOpen={activePhaseForCriterion !== null}
        onClose={() => setActivePhaseForCriterion(null)}
        title="Add Evaluation Criterion"
        description="Add a grading parameter to this phase's rubric."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activePhaseForCriterion) {
              createCriterionMutation.mutate({
                phaseId: activePhaseForCriterion,
                data: criterionForm,
              });
            }
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Criterion Name"
            placeholder="e.g. System Architecture & Feasibility"
            value={criterionForm.name}
            onChange={(e) => setCriterionForm({ ...criterionForm, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Description (Optional)"
            placeholder="e.g. Evaluates database schema design and scalability"
            value={criterionForm.description}
            onChange={(e) => setCriterionForm({ ...criterionForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Max Marks"
              value={criterionForm.maxMarks}
              onChange={(e) => setCriterionForm({ ...criterionForm, maxMarks: Number(e.target.value) })}
              required
            />
            <Select
              label="Criterion Type"
              value={criterionForm.criterionType}
              onChange={(e) => setCriterionForm({ ...criterionForm, criterionType: e.target.value })}
              options={[
                { value: 'TECHNICAL', label: 'Technical Depth' },
                { value: 'INNOVATION', label: 'Innovation' },
                { value: 'DOCUMENTATION', label: 'Documentation' },
                { value: 'PRESENTATION', label: 'Presentation & Q&A' },
                { value: 'TEAMWORK', label: 'Teamwork & Git Flow' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setActivePhaseForCriterion(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={createCriterionMutation.isPending}>
              Add Criterion
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deadline History Modal */}
      <Modal
        isOpen={historyPhaseId !== null}
        onClose={() => setHistoryPhaseId(null)}
        title="Deadline Shift History"
        description="Audit record of changes made to the deadline for this phase."
      >
        <div className="space-y-3 pt-2">
          {deadlineHistory && deadlineHistory.length > 0 ? (
            deadlineHistory.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>Shifted to: {formatDate(item.newDeadline, 'MMM d, yyyy h:mm a')}</span>
                  <span className="text-slate-400 font-normal">by {item.changedBy}</span>
                </div>
                <p className="text-slate-500 mt-1">Previous: {formatDate(item.oldDeadline, 'MMM d, yyyy h:mm a')}</p>
                {item.reason && <p className="text-slate-600 mt-1 italic">Reason: "{item.reason}"</p>}
                <p className="text-[10px] text-slate-400 mt-1">Recorded: {formatDate(item.changedAt)}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No deadline adjustments recorded.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Sub-component for individual phase card with criterion query
const PhaseDetailCard: React.FC<{
  phase: any;
  onEdit: () => void;
  onAddCriterion: () => void;
  onViewHistory: () => void;
}> = ({ phase, onEdit, onAddCriterion, onViewHistory }) => {
  const { data: criteria } = useQuery({
    queryKey: ['criteria', phase.id],
    queryFn: () => evaluationApi.getCriteria(phase.id),
  });

  const totalMaxMarks = criteria?.reduce((acc, c) => acc + c.maxMarks, 0) || 0;

  return (
    <Card className="p-5 border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-100">
            {phase.orderIndex}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{phase.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Deadline: <strong className="text-slate-700">{formatDate(phase.deadline, 'MMM d, yyyy h:mm a')}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-slate-500"
            onClick={onViewHistory}
            icon={<History className="w-3.5 h-3.5" />}
          >
            History
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-8"
            onClick={onEdit}
            icon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            className="text-xs h-8"
            onClick={onAddCriterion}
            icon={<ListPlus className="w-3.5 h-3.5" />}
          >
            Add Criterion
          </Button>
        </div>
      </div>

      {/* Criteria listing */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Grading Criteria ({totalMaxMarks} Total Marks)
          </h4>
        </div>

        {criteria && criteria.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {criteria.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-medium text-slate-800">{c.name}</span>
                  <p className="text-[10px] text-slate-400">{c.criterionType}</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {c.maxMarks}m
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-1 italic">
            No grading rubric added yet. Click "Add Criterion" to define parameters.
          </p>
        )}
      </div>
    </Card>
  );
};

