import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { AppLayout } from '@/components/layout/AppLayout';

// Landing Page
import { HomePage } from '@/pages/HomePage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Student Pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { MyTeamPage } from '@/pages/student/MyTeamPage';
import { MyProjectPage } from '@/pages/student/MyProjectPage';
import { StudentPhasesPage } from '@/pages/student/PhasesPage';
import { StudentEvaluationsPage } from '@/pages/student/EvaluationsPage';

// Coordinator Pages
import { CoordinatorDashboard } from '@/pages/coordinator/CoordinatorDashboard';
import { AcademicCyclesPage } from '@/pages/coordinator/AcademicCyclesPage';
import { TeamsManagePage } from '@/pages/coordinator/TeamsManagePage';
import { ProjectsManagePage } from '@/pages/coordinator/ProjectsManagePage';
import { PhasesManagePage } from '@/pages/coordinator/PhasesManagePage';
import { EvaluationsManagePage } from '@/pages/coordinator/EvaluationsManagePage';

// Shared Pages
import { NotificationsPage } from '@/pages/NotificationsPage';

export const App: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isCoordinator = user?.role === 'COORDINATOR';

  return (
    <Routes>
      {/* Public Home Landing Page matching reference image */}
      <Route path="/" element={<HomePage />} />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />

      {/* Authenticated Dashboard & Shell */}
      <Route element={<AppLayout />}>
        {/* Dynamic Dashboard based on role */}
        <Route
          path="/dashboard"
          element={isCoordinator ? <CoordinatorDashboard /> : <StudentDashboard />}
        />

        {/* Student Specific Routes */}
        <Route path="/team" element={<MyTeamPage />} />
        <Route path="/project" element={isCoordinator ? <Navigate to="/projects" replace /> : <MyProjectPage />} />

        {/* Role Adaptive Routes */}
        <Route
          path="/phases"
          element={isCoordinator ? <PhasesManagePage /> : <StudentPhasesPage />}
        />
        <Route
          path="/evaluations"
          element={isCoordinator ? <EvaluationsManagePage /> : <StudentEvaluationsPage />}
        />

        {/* Coordinator Specific Routes */}
        <Route
          path="/cycles"
          element={isCoordinator ? <AcademicCyclesPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/teams"
          element={isCoordinator ? <TeamsManagePage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/projects"
          element={isCoordinator ? <ProjectsManagePage /> : <Navigate to="/project" replace />}
        />

        {/* Shared Routes */}
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
