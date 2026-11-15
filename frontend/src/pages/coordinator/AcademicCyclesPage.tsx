import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cycleApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const AcademicCyclesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycleId, setEditingCycleId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    active: true,
  });

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['academic-cycles'],
    queryFn: cycleApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: cycleApi.create,
    onSuccess: () => {
      toast.success('Academic cycle created!');
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['academic-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Creation failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cycleApi.update(id, data),
    onSuccess: () => {
      toast.success('Academic cycle updated!');
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['academic-cycles'] });
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const resetForm = () => {
    setEditingCycleId(null);
    setFormData({ name: '', academicYear: '', startDate: '', endDate: '', active: true });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cycle: any) => {
    setEditingCycleId(cycle.id);
    setFormData({
      name: cycle.name,
      academicYear: cycle.academicYear,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      active: cycle.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCycleId) {
      updateMutation.mutate({ id: editingCycleId, data: formData });
    } else {
      createMutation.mutate({
        name: formData.name,
        academicYear: formData.academicYear,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
    }
  };

  if (isLoading) return <PageLoading message="Loading academic cycles..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Academic Cycles"
          subtitle="Configure semesters, timelines, and active evaluation periods"
        />
        <Button onClick={handleOpenCreate} icon={<Plus className="w-4 h-4" />}>
          New Cycle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cycles?.map((cycle) => (
          <Card key={cycle.id} className="p-5 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {cycle.academicYear}
                </span>
                <Badge variant={cycle.active ? 'green' : 'default'}>
                  {cycle.active ? 'Active Period' : 'Archived'}
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900">{cycle.name}</h3>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Start: {formatDate(cycle.startDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>End: {formatDate(cycle.endDate)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-600 hover:text-indigo-600"
                onClick={() => handleOpenEdit(cycle)}
                icon={<Edit2 className="w-3 h-3" />}
              >
                Configure
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Cycle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCycleId ? 'Configure Academic Cycle' : 'Create Academic Cycle'}
        description="Specify semester duration, academic year, and active status."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Cycle Name"
            placeholder="e.g. Fall 2026 Capstone / 2026 Final Semester"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Academic Year"
            placeholder="e.g. 2026-2027"
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          {editingCycleId && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="active-toggle"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="active-toggle" className="text-xs font-medium text-slate-700">
                Mark this cycle as active (visible to students)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCycleId ? 'Save Changes' : 'Create Cycle'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

