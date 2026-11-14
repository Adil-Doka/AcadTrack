import axios from 'axios';
import type {
  AuthResponse,
  AcademicCycle,
  Team,
  Project,
  Phase,
  PhaseDeadlineHistory,
  Submission,
  Evaluation,
  EvaluationCriterion,
  Notification,
  GitHubRepo,
  StudentDashboard,
  CoordinatorDashboard,
  User,
} from '@/types';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────── AUTH ───────────────────────────
export const authApi = {
  login: (data: { pnr: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: {
    pnr: string;
    name: string;
    email: string;
    password: string;
    department: string;
    role: string;
  }) => api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
};

// ─────────────────────────── ACADEMIC CYCLES ───────────────────────────
export const cycleApi = {
  getAll: () => api.get<AcademicCycle[]>('/academic-cycles').then((r) => r.data),
  getActive: () => api.get<AcademicCycle[]>('/academic-cycles/active').then((r) => r.data),
  getById: (id: number) => api.get<AcademicCycle>(`/academic-cycles/${id}`).then((r) => r.data),
  create: (data: { name: string; academicYear: string; startDate: string; endDate: string }) =>
    api.post<AcademicCycle>('/academic-cycles', data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{ name: string; academicYear: string; startDate: string; endDate: string; active: boolean }>
  ) => api.put<AcademicCycle>(`/academic-cycles/${id}`, data).then((r) => r.data),
};

// ─────────────────────────── TEAMS ───────────────────────────
export const teamApi = {
  getAll: (params?: { cycleId?: number; status?: string }) =>
    api.get<Team[]>('/teams', { params }).then((r) => r.data),
  getById: (id: number) => api.get<Team>(`/teams/${id}`).then((r) => r.data),
  getMyTeam: (cycleId: number) =>
    api.get<Team>('/teams/my-team', { params: { cycleId } }).then((r) => r.data),
  create: (data: { name: string; cycleId: number }) =>
    api.post<Team>('/teams', data).then((r) => r.data),
  addMember: (teamId: number, data: { userPnr: string }) =>
    api.post<Team>(`/teams/${teamId}/members`, data).then((r) => r.data),
  removeMember: (teamId: number, userId: number) =>
    api.delete<Team>(`/teams/${teamId}/members/${userId}`).then((r) => r.data),
  submit: (teamId: number) => api.post<Team>(`/teams/${teamId}/submit`).then((r) => r.data),
  putUnderReview: (teamId: number) => api.post<Team>(`/teams/${teamId}/review`).then((r) => r.data),
  approve: (teamId: number) => api.post<Team>(`/teams/${teamId}/approve`).then((r) => r.data),
  reject: (teamId: number, data: { reason: string }) =>
    api.post<Team>(`/teams/${teamId}/reject`, data).then((r) => r.data),
  reopen: (teamId: number) => api.post<Team>(`/teams/${teamId}/reopen`).then((r) => r.data),
};

// ─────────────────────────── PROJECTS ───────────────────────────
export const projectApi = {
  getAll: (params?: { cycleId?: number; status?: string }) =>
    api.get<Project[]>('/projects', { params }).then((r) => r.data),
  getById: (id: number) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  getByTeam: (teamId: number) => api.get<Project>(`/projects/by-team/${teamId}`).then((r) => r.data),
  create: (data: {
    title: string;
    description: string;
    domain?: string;
    techStack?: string;
    githubRepoUrl?: string;
    githubUrl?: string;
    teamId: number;
    cycleId: number;
  }) => {
    const payload = {
      teamId: data.teamId,
      title: data.title,
      description: data.description,
      domain: data.domain || data.techStack || 'Computer Science',
      githubRepoUrl: data.githubRepoUrl || data.githubUrl || undefined,
    };
    return api.post<Project>('/projects', payload).then((r) => r.data);
  },
  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      domain?: string;
      techStack?: string;
      githubRepoUrl?: string;
      githubUrl?: string;
    }>
  ) => {
    const payload = {
      title: data.title,
      description: data.description,
      domain: data.domain || data.techStack || undefined,
      githubRepoUrl: data.githubRepoUrl || data.githubUrl || undefined,
    };
    return api.put<Project>(`/projects/${id}`, payload).then((r) => r.data);
  },
  submit: (id: number) => api.post<Project>(`/projects/${id}/submit`).then((r) => r.data),
  putUnderReview: (id: number) => api.post<Project>(`/projects/${id}/review`).then((r) => r.data),
  approve: (id: number) => api.post<Project>(`/projects/${id}/approve`).then((r) => r.data),
  reject: (id: number, data: { reason: string }) =>
    api.post<Project>(`/projects/${id}/reject`, data).then((r) => r.data),
};

// ─────────────────────────── PHASES ───────────────────────────
export const phaseApi = {
  getByCycle: (cycleId: number) =>
    api.get<Phase[]>('/phases', { params: { cycleId } }).then((r) => r.data),
  getById: (id: number) => api.get<Phase>(`/phases/${id}`).then((r) => r.data),
  getDeadlineHistory: (phaseId: number) =>
    api.get<PhaseDeadlineHistory[]>(`/phases/${phaseId}/deadline-history`).then((r) => r.data),
  create: (data: {
    name: string;
    description: string;
    openingDate?: string;
    deadline: string;
    requiredDocuments?: string;
    maxMarks?: number;
    sequenceOrder?: number;
    orderIndex?: number;
    cycleId: number;
  }) => {
    const opening = data.openingDate
      ? new Date(data.openingDate).toISOString()
      : new Date().toISOString();
    const deadlineIso = new Date(data.deadline).toISOString();
    const payload = {
      cycleId: data.cycleId,
      name: data.name,
      description: data.description,
      openingDate: opening,
      deadline: deadlineIso,
      requiredDocuments: data.requiredDocuments || 'PDF, Report, Code archive',
      maxMarks: data.maxMarks ?? 100,
      sequenceOrder: data.sequenceOrder || data.orderIndex || 1,
      active: true,
    };
    return api.post<Phase>('/phases', payload).then((r) => r.data);
  },
  update: (
    id: number,
    data: Partial<{
      name: string;
      description: string;
      deadline: string;
      reason?: string;
      maxMarks?: number;
    }>
  ) => {
    const payload: any = {
      name: data.name,
      description: data.description,
      reason: data.reason,
    };
    if (data.deadline) {
      payload.deadline = new Date(data.deadline).toISOString();
    }
    if (data.maxMarks !== undefined) {
      payload.maxMarks = data.maxMarks;
    }
    return api.put<Phase>(`/phases/${id}`, payload).then((r) => r.data);
  },
};

// ─────────────────────────── SUBMISSIONS ───────────────────────────
export const submissionApi = {
  submit: (phaseId: number, projectId: number, files: File[], notes?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (notes) formData.append('notes', notes);
    return api
      .post<Submission>(
        `/phases/${phaseId}/submissions?projectId=${projectId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((r) => r.data);
  },
  getHistory: (phaseId: number, projectId: number) =>
    api
      .get<Submission[]>(`/phases/${phaseId}/submissions`, { params: { projectId } })
      .then((r) => r.data),
  getById: (id: number) => api.get<Submission>(`/submissions/${id}`).then((r) => r.data),
  downloadDocument: (documentId: number) =>
    api
      .get(`/documents/${documentId}/download`, { responseType: 'blob' })
      .then((r) => r.data),
};

// ─────────────────────────── EVALUATIONS ───────────────────────────
export const evaluationApi = {
  getCriteria: (phaseId: number) =>
    api.get<EvaluationCriterion[]>(`/phases/${phaseId}/criteria`).then((r) => r.data),
  createCriterion: (
    phaseId: number,
    data: { name: string; description?: string; maxMarks: number; criterionType?: string }
  ) => {
    const payload = {
      name: data.name,
      description: data.description,
      maxMarks: data.maxMarks,
      criterionType: data.criterionType || 'MANUAL',
    };
    return api.post<EvaluationCriterion>(`/phases/${phaseId}/criteria`, payload).then((r) => r.data);
  },
  evaluateSubmission: (
    submissionId: number,
    data: {
      generalRemarks?: string;
      feedback?: string;
      marks: Array<{ criterionId: number; marksAwarded: number; remarks?: string; comments?: string }>;
    }
  ) => {
    const payload = {
      generalRemarks: data.generalRemarks || data.feedback || '',
      marks: data.marks.map((m) => ({
        criterionId: m.criterionId,
        marksAwarded: m.marksAwarded,
        remarks: m.remarks || m.comments || '',
      })),
    };
    return api.post<Evaluation>(`/submissions/${submissionId}/evaluate`, payload).then((r) => r.data);
  },
  publishEvaluation: (evaluationId: number) =>
    api.post<Evaluation>(`/evaluations/${evaluationId}/publish`).then((r) => r.data),
  getById: (evaluationId: number) =>
    api.get<Evaluation>(`/evaluations/${evaluationId}`).then((r) => r.data),
  getForProject: (projectId: number) =>
    api.get<Evaluation[]>(`/projects/${projectId}/evaluations`).then((r) => r.data),
};

// ─────────────────────────── NOTIFICATIONS ───────────────────────────
export const notificationApi = {
  getAll: (unreadOnly?: boolean) =>
    api.get<Notification[]>('/notifications', { params: { unreadOnly } }).then((r) => r.data),
  markAsRead: (id: number) =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => api.post('/notifications/mark-all-read').then((r) => r.data),
};

// ─────────────────────────── GITHUB ───────────────────────────
export const githubApi = {
  getData: (projectId: number) =>
    api.get<GitHubRepo>(`/projects/${projectId}/github`).then((r) => r.data),
  refresh: (projectId: number) =>
    api.post<GitHubRepo>(`/projects/${projectId}/github/refresh`).then((r) => r.data),
  getHistory: (projectId: number) =>
    api.get<GitHubRepo[]>(`/projects/${projectId}/github/history`).then((r) => r.data),
};

// ─────────────────────────── DASHBOARD ───────────────────────────
export const dashboardApi = {
  getStudent: (cycleId?: number) =>
    api.get<StudentDashboard>('/dashboard/student', { params: { cycleId } }).then((r) => r.data),
  getCoordinator: (cycleId?: number) =>
    api.get<CoordinatorDashboard>('/dashboard/coordinator', { params: { cycleId } }).then((r) => r.data),
};

// ─────────────────────────── ADMIN ───────────────────────────
export const adminApi = {
  createCoordinator: (data: {
    pnr: string;
    name: string;
    email: string;
    password: string;
    department: string;
  }) => api.post<User>('/admin/coordinators', data).then((r) => r.data),
};

export default api;
