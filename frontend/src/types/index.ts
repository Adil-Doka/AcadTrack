export interface User {
  id: number;
  pnr: string;
  name: string;
  email: string;
  department: string;
  role: 'STUDENT' | 'COORDINATOR';
}

export interface AuthResponse {
  token: string;
  pnr?: string;
  name?: string;
  email?: string;
  role?: 'STUDENT' | 'COORDINATOR';
  department?: string;
  user?: User;
}

export interface AcademicCycle {
  id: number;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  name: string;
  pnr: string;
  email: string;
  department: string;
  teamRole?: 'LEADER' | 'MEMBER';
  role?: 'LEADER' | 'MEMBER';
  joinedAt: string;
}

export interface Team {
  id: number;
  name: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  cycleId: number;
  cycleName: string;
  members: TeamMember[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  domain?: string;
  techStack?: string;
  githubRepoUrl?: string;
  githubUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  teamId: number;
  teamName: string;
  cycleId: number;
  cycleName: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase {
  id: number;
  name: string;
  description: string;
  openingDate?: string;
  deadline: string;
  requiredDocuments?: string;
  maxMarks?: number;
  sequenceOrder?: number;
  orderIndex?: number;
  cycleId: number;
  cycleName: string;
  active?: boolean;
  open?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseDeadlineHistory {
  id: number;
  phaseId: number;
  oldDeadline: string;
  newDeadline: string;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface Document {
  id: number;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface Submission {
  id: number;
  phaseId: number;
  phaseName: string;
  projectId: number;
  projectTitle: string;
  notes?: string;
  documents: Document[];
  submittedBy: string;
  submittedAt: string;
  evaluationId?: number;
}

export interface EvaluationMark {
  id: number;
  criterionId: number;
  criterionName: string;
  criterionType: string;
  marksAwarded: number;
  maxMarks: number;
  remarks?: string;
  comments?: string;
}

export interface Evaluation {
  id: number;
  submissionId: number;
  projectId?: number;
  projectTitle: string;
  phaseId?: number;
  phaseName: string;
  evaluatedBy?: string;
  evaluatorName?: string;
  totalMarks?: number;
  totalMarksAwarded?: number;
  phaseMaxMarks?: number;
  totalPossibleMarks?: number;
  generalRemarks?: string;
  feedback?: string;
  published: boolean;
  marks: EvaluationMark[];
  evaluatedAt: string;
  publishedAt?: string;
}

export interface EvaluationCriterion {
  id: number;
  phaseId: number;
  name: string;
  description?: string;
  maxMarks: number;
  criterionType: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface GitHubRepo {
  id: number;
  projectId: number;
  repoUrl: string;
  repoName: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommitAt: string;
  language: string;
  commitCount: number;
  contributorCount: number;
  snapshotAt: string;
}

export interface StudentDashboard {
  team?: Team;
  project?: Project;
  phases: Phase[];
  submissions: Submission[];
  releasedEvaluations: Evaluation[];
  totalMarksAwarded: number;
  totalPossibleMarks: number;
}

export interface CoordinatorDashboard {
  cycleId: number;
  cycleName: string;
  teamsAwaitingReview: Team[];
  projectsAwaitingReview: Project[];
  upcomingPhases: Phase[];
  pendingEvaluationsCount: number;
  stats: Record<string, number>;
}

export interface AuditLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  performedBy: string;
  details: string;
  createdAt: string;
}

export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type TeamStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}
