package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.*;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class DashboardService {

    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final PhaseRepository phaseRepository;
    private final SubmissionRepository submissionRepository;
    private final EvaluationRepository evaluationRepository;
    private final AcademicCycleRepository cycleRepository;
    private final TeamService teamService;
    private final ProjectService projectService;
    private final PhaseService phaseService;
    private final SubmissionService submissionService;
    private final EvaluationService evaluationService;

    public DashboardService(TeamRepository teamRepository,
                            ProjectRepository projectRepository,
                            PhaseRepository phaseRepository,
                            SubmissionRepository submissionRepository,
                            EvaluationRepository evaluationRepository,
                            AcademicCycleRepository cycleRepository,
                            TeamService teamService,
                            ProjectService projectService,
                            PhaseService phaseService,
                            SubmissionService submissionService,
                            EvaluationService evaluationService) {
        this.teamRepository = teamRepository;
        this.projectRepository = projectRepository;
        this.phaseRepository = phaseRepository;
        this.submissionRepository = submissionRepository;
        this.evaluationRepository = evaluationRepository;
        this.cycleRepository = cycleRepository;
        this.teamService = teamService;
        this.projectService = projectService;
        this.phaseService = phaseService;
        this.submissionService = submissionService;
        this.evaluationService = evaluationService;
    }

    @Transactional(readOnly = true)
    public StudentDashboardResponse getStudentDashboard(User student, Long cycleId) {
        AcademicCycle cycle = resolveCycle(cycleId);
        Long targetCycleId = cycle.getId();

        Optional<Team> teamOpt = teamRepository.findByUserIdAndAcademicCycleId(student.getId(), targetCycleId);
        TeamResponse teamResponse = teamOpt.map(teamService::toResponse).orElse(null);

        ProjectResponse projectResponse = null;
        List<SubmissionResponse> submissions = List.of();
        List<EvaluationResponse> releasedEvaluations = List.of();
        BigDecimal totalMarksAwarded = BigDecimal.ZERO;
        BigDecimal totalPossibleMarks = BigDecimal.ZERO;

        if (teamOpt.isPresent()) {
            Optional<Project> projOpt = projectRepository.findByTeamId(teamOpt.get().getId());
            if (projOpt.isPresent()) {
                Project project = projOpt.get();
                projectResponse = projectService.toResponse(project);

                submissions = submissionRepository.findByProjectId(project.getId()).stream()
                        .map(submissionService::toResponse)
                        .toList();

                List<Evaluation> evals = evaluationRepository.findByProjectIdAndPublishedTrue(project.getId());
                releasedEvaluations = evals.stream()
                        .map(evaluationService::toEvaluationResponse)
                        .toList();

                for (Evaluation e : evals) {
                    totalMarksAwarded = totalMarksAwarded.add(e.getTotalMarks());
                    totalPossibleMarks = totalPossibleMarks.add(e.getPhase().getMaxMarks());
                }
            }
        }

        List<PhaseResponse> phases = phaseService.getPhasesByCycle(targetCycleId);

        return new StudentDashboardResponse(
                teamResponse,
                projectResponse,
                phases,
                submissions,
                releasedEvaluations,
                totalMarksAwarded,
                totalPossibleMarks
        );
    }

    @Transactional(readOnly = true)
    public CoordinatorDashboardResponse getCoordinatorDashboard(Long cycleId) {
        AcademicCycle cycle = resolveCycle(cycleId);
        Long targetCycleId = cycle.getId();

        List<TeamResponse> teamsAwaitingReview = new ArrayList<>();
        teamRepository.findByAcademicCycleIdAndStatus(targetCycleId, TeamStatus.SUBMITTED).stream()
                .map(teamService::toResponse).forEach(teamsAwaitingReview::add);
        teamRepository.findByAcademicCycleIdAndStatus(targetCycleId, TeamStatus.UNDER_REVIEW).stream()
                .map(teamService::toResponse).forEach(teamsAwaitingReview::add);

        List<ProjectResponse> projectsAwaitingReview = new ArrayList<>();
        projectRepository.findByAcademicCycleIdAndStatus(targetCycleId, ProjectStatus.SUBMITTED).stream()
                .map(projectService::toResponse).forEach(projectsAwaitingReview::add);
        projectRepository.findByAcademicCycleIdAndStatus(targetCycleId, ProjectStatus.UNDER_REVIEW).stream()
                .map(projectService::toResponse).forEach(projectsAwaitingReview::add);

        List<PhaseResponse> phases = phaseService.getPhasesByCycle(targetCycleId);
        Instant now = Instant.now();
        List<PhaseResponse> upcomingPhases = phases.stream()
                .filter(p -> p.deadline().isAfter(now))
                .toList();

        List<Project> allCycleProjects = projectRepository.findByAcademicCycleId(targetCycleId);
        long pendingEvaluations = 0;
        long totalSubmissions = 0;

        for (Project proj : allCycleProjects) {
            List<Submission> projectSubs = submissionRepository.findByProjectId(proj.getId());
            totalSubmissions += projectSubs.size();
            for (Submission s : projectSubs) {
                Optional<Evaluation> evalOpt = evaluationRepository.findBySubmissionId(s.getId());
                if (evalOpt.isEmpty() || !evalOpt.get().isPublished()) {
                    pendingEvaluations++;
                }
            }
        }

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("totalTeams", (long) teamRepository.findByAcademicCycleId(targetCycleId).size());
        stats.put("approvedTeams", (long) teamRepository.findByAcademicCycleIdAndStatus(targetCycleId, TeamStatus.APPROVED).size());
        stats.put("totalProjects", (long) allCycleProjects.size());
        stats.put("approvedProjects", (long) projectRepository.findByAcademicCycleIdAndStatus(targetCycleId, ProjectStatus.APPROVED).size());
        stats.put("totalSubmissions", totalSubmissions);

        return new CoordinatorDashboardResponse(
                targetCycleId,
                cycle.getName(),
                teamsAwaitingReview,
                projectsAwaitingReview,
                upcomingPhases,
                pendingEvaluations,
                stats
        );
    }

    private AcademicCycle resolveCycle(Long cycleId) {
        if (cycleId != null) {
            return cycleRepository.findById(cycleId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                            "Academic cycle not found with id: " + cycleId));
        }
        List<AcademicCycle> active = cycleRepository.findByActiveTrue();
        if (!active.isEmpty()) {
            return active.get(0);
        }
        return cycleRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                        "No academic cycles found"));
    }
}

