package com.projects.projectmanager;

import com.projects.projectmanager.repository.*;
import org.springframework.stereotype.Component;

@Component
public class TestDatabaseCleaner {

    private final EvaluationMarkRepository evaluationMarkRepository;
    private final EvaluationRepository evaluationRepository;
    private final EvaluationCriterionRepository criterionRepository;
    private final DocumentRepository documentRepository;
    private final SubmissionRepository submissionRepository;
    private final PhaseDeadlineHistoryRepository deadlineHistoryRepository;
    private final PhaseRepository phaseRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final AcademicCycleRepository cycleRepository;

    private final com.projects.projectmanager.repository.NotificationRepository notificationRepository;
    private final com.projects.projectmanager.repository.AuditLogRepository auditLogRepository;

    private final com.projects.projectmanager.repository.GitHubSnapshotRepository gitHubSnapshotRepository;

    public TestDatabaseCleaner(
            com.projects.projectmanager.repository.GitHubSnapshotRepository gitHubSnapshotRepository,
            com.projects.projectmanager.repository.NotificationRepository notificationRepository,
            com.projects.projectmanager.repository.AuditLogRepository auditLogRepository,
            EvaluationMarkRepository evaluationMarkRepository,
            EvaluationRepository evaluationRepository,
            EvaluationCriterionRepository criterionRepository,
            DocumentRepository documentRepository,
            SubmissionRepository submissionRepository,
            PhaseDeadlineHistoryRepository deadlineHistoryRepository,
            PhaseRepository phaseRepository,
            ProjectRepository projectRepository,
            TeamMemberRepository teamMemberRepository,
            TeamRepository teamRepository,
            UserRepository userRepository,
            AcademicCycleRepository cycleRepository) {
        this.gitHubSnapshotRepository = gitHubSnapshotRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.evaluationMarkRepository = evaluationMarkRepository;
        this.evaluationRepository = evaluationRepository;
        this.criterionRepository = criterionRepository;
        this.documentRepository = documentRepository;
        this.submissionRepository = submissionRepository;
        this.deadlineHistoryRepository = deadlineHistoryRepository;
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.cycleRepository = cycleRepository;
    }

    public void clean() {
        gitHubSnapshotRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        evaluationMarkRepository.deleteAll();
        evaluationRepository.deleteAll();
        criterionRepository.deleteAll();
        documentRepository.deleteAll();
        submissionRepository.deleteAll();
        deadlineHistoryRepository.deleteAll();
        phaseRepository.deleteAll();
        projectRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();
        cycleRepository.deleteAll();
    }
}
