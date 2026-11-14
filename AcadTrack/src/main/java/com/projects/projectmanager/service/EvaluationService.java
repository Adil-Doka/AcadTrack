package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateCriterionRequest;
import com.projects.projectmanager.dto.request.EvaluateSubmissionRequest;
import com.projects.projectmanager.dto.request.MarkInput;
import com.projects.projectmanager.dto.response.CriterionResponse;
import com.projects.projectmanager.dto.response.EvaluationMarkResponse;
import com.projects.projectmanager.dto.response.EvaluationResponse;
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
public class EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final EvaluationMarkRepository evaluationMarkRepository;
    private final EvaluationCriterionRepository criterionRepository;
    private final SubmissionRepository submissionRepository;
    private final PhaseRepository phaseRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public EvaluationService(EvaluationRepository evaluationRepository,
                             EvaluationMarkRepository evaluationMarkRepository,
                             EvaluationCriterionRepository criterionRepository,
                             SubmissionRepository submissionRepository,
                             PhaseRepository phaseRepository,
                             ProjectRepository projectRepository,
                             AuditService auditService,
                             NotificationService notificationService) {
        this.evaluationRepository = evaluationRepository;
        this.evaluationMarkRepository = evaluationMarkRepository;
        this.criterionRepository = criterionRepository;
        this.submissionRepository = submissionRepository;
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public CriterionResponse createCriterion(Long phaseId, CreateCriterionRequest request) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND",
                        "Phase not found with id: " + phaseId));

        EvaluationCriterion criterion = EvaluationCriterion.builder()
                .phase(phase)
                .name(request.name())
                .maxMarks(request.maxMarks())
                .criterionType(request.criterionType() != null ? request.criterionType() : CriterionType.MANUAL)
                .description(request.description())
                .build();

        criterion = criterionRepository.save(criterion);
        return toCriterionResponse(criterion);
    }

    @Transactional(readOnly = true)
    public List<CriterionResponse> getCriteria(Long phaseId) {
        return criterionRepository.findByPhaseId(phaseId).stream()
                .map(this::toCriterionResponse)
                .toList();
    }

    @Transactional
    public EvaluationResponse evaluateSubmission(User evaluator, Long submissionId, EvaluateSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SUBMISSION_NOT_FOUND",
                        "Submission not found with id: " + submissionId));

        Phase phase = submission.getPhase();
        Project project = submission.getProject();
        List<EvaluationCriterion> criteria = criterionRepository.findByPhaseId(phase.getId());

        Map<Long, MarkInput> manualMarksMap = new HashMap<>();
        if (request.marks() != null) {
            for (MarkInput mi : request.marks()) {
                manualMarksMap.put(mi.criterionId(), mi);
            }
        }

        // Find existing evaluation or create new
        Evaluation evaluation = evaluationRepository.findBySubmissionId(submissionId)
                .orElseGet(() -> Evaluation.builder()
                        .submission(submission)
                        .project(project)
                        .phase(phase)
                        .evaluator(evaluator)
                        .build());

        evaluation.setEvaluator(evaluator);
        evaluation.setGeneralRemarks(request.generalRemarks());
        evaluation.setEvaluatedAt(Instant.now());

        // Clear existing marks if revising
        if (evaluation.getId() != null) {
            evaluationMarkRepository.deleteAll(evaluation.getMarks());
            evaluation.getMarks().clear();
        }

        evaluation = evaluationRepository.save(evaluation);

        BigDecimal total = BigDecimal.ZERO;
        List<EvaluationMark> savedMarks = new ArrayList<>();

        for (EvaluationCriterion criterion : criteria) {
            BigDecimal marksAwarded;
            String remarks = null;

            if (criterion.getCriterionType() == CriterionType.AUTOMATIC_TIMELINESS) {
                marksAwarded = submission.isLate() ? BigDecimal.ZERO : criterion.getMaxMarks();
                remarks = submission.isLate() ? "Late submission (0 marks)" : "On-time submission";
            } else if (criterion.getCriterionType() == CriterionType.AUTOMATIC_COMPLETION) {
                boolean hasDocs = submission.getDocuments() != null && !submission.getDocuments().isEmpty();
                marksAwarded = hasDocs ? criterion.getMaxMarks() : BigDecimal.ZERO;
                remarks = hasDocs ? "Submission complete with required documents" : "Missing documents";
            } else {
                // MANUAL
                MarkInput input = manualMarksMap.get(criterion.getId());
                if (input != null && input.marksAwarded() != null) {
                    if (input.marksAwarded().compareTo(criterion.getMaxMarks()) > 0) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "MARK_EXCEEDS_MAX",
                                "Mark awarded (" + input.marksAwarded() + ") for '" + criterion.getName() +
                                        "' exceeds maximum allowed (" + criterion.getMaxMarks() + ")");
                    }
                    marksAwarded = input.marksAwarded();
                    remarks = input.remarks();
                } else {
                    marksAwarded = BigDecimal.ZERO;
                }
            }

            total = total.add(marksAwarded);

            EvaluationMark em = EvaluationMark.builder()
                    .evaluation(evaluation)
                    .criterion(criterion)
                    .marksAwarded(marksAwarded)
                    .remarks(remarks)
                    .build();

            savedMarks.add(evaluationMarkRepository.save(em));
        }

        if (total.compareTo(phase.getMaxMarks()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TOTAL_EXCEEDS_PHASE_MAX",
                    "Total awarded marks (" + total + ") exceeds phase maximum (" + phase.getMaxMarks() + ")");
        }

        evaluation.setTotalMarks(total);
        evaluation.setMarks(savedMarks);
        submission.setStatus("EVALUATED");
        submissionRepository.save(submission);

        return toEvaluationResponse(evaluationRepository.save(evaluation));
    }

    @Transactional
    public EvaluationResponse publishEvaluation(User coordinator, Long evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVALUATION_NOT_FOUND",
                        "Evaluation not found with id: " + evaluationId));

        evaluation.setPublished(true);
        evaluation.setPublishedAt(Instant.now());
        evaluation.setPublishedBy(coordinator);
        evaluation = evaluationRepository.save(evaluation);

        auditService.log(coordinator, "RESULTS_PUBLISHED", "EVALUATION", evaluation.getId(),
                "Evaluation published for project " + evaluation.getProject().getTitle() + ", phase " + evaluation.getPhase().getName());

        for (TeamMember m : evaluation.getProject().getTeam().getMembers()) {
            notificationService.notify(m.getUser(), "RESULT_PUBLICATION", "Evaluation Results Published",
                    "Results for phase '" + evaluation.getPhase().getName() + "' have been published. Awarded: " +
                            evaluation.getTotalMarks() + " / " + evaluation.getPhase().getMaxMarks(),
                    "/projects/" + evaluation.getProject().getId());
        }

        return toEvaluationResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public EvaluationResponse getEvaluation(User currentUser, Long evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVALUATION_NOT_FOUND",
                        "Evaluation not found with id: " + evaluationId));

        assertCanViewEvaluation(currentUser, evaluation);
        return toEvaluationResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getEvaluationsForProject(User currentUser, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "Project not found with id: " + projectId));

        if (currentUser.getRole() == Role.COORDINATOR) {
            return evaluationRepository.findByProjectId(projectId).stream()
                    .map(this::toEvaluationResponse)
                    .toList();
        } else {
            assertTeamMember(currentUser, project);
            // Students can view results only when they have been released/published
            return evaluationRepository.findByProjectIdAndPublishedTrue(projectId).stream()
                    .map(this::toEvaluationResponse)
                    .toList();
        }
    }

    private void assertCanViewEvaluation(User currentUser, Evaluation evaluation) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            return;
        }
        assertTeamMember(currentUser, evaluation.getProject());
        if (!evaluation.isPublished()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "RESULTS_NOT_PUBLISHED",
                    "Evaluation results have not yet been published for this submission");
        }
    }

    private void assertTeamMember(User currentUser, Project project) {
        boolean isMember = project.getTeam().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have permission to view evaluations for this project");
        }
    }

    public CriterionResponse toCriterionResponse(EvaluationCriterion criterion) {
        return new CriterionResponse(
                criterion.getId(),
                criterion.getPhase().getId(),
                criterion.getName(),
                criterion.getMaxMarks(),
                criterion.getCriterionType().name(),
                criterion.getDescription()
        );
    }

    public EvaluationResponse toEvaluationResponse(Evaluation evaluation) {
        List<EvaluationMarkResponse> markResponses = evaluation.getMarks().stream()
                .map(m -> new EvaluationMarkResponse(
                        m.getId(),
                        m.getCriterion().getId(),
                        m.getCriterion().getName(),
                        m.getCriterion().getCriterionType().name(),
                        m.getCriterion().getMaxMarks(),
                        m.getMarksAwarded(),
                        m.getRemarks()
                ))
                .toList();

        return new EvaluationResponse(
                evaluation.getId(),
                evaluation.getSubmission().getId(),
                evaluation.getProject().getId(),
                evaluation.getProject().getTitle(),
                evaluation.getPhase().getId(),
                evaluation.getPhase().getName(),
                evaluation.getEvaluator().getId(),
                evaluation.getEvaluator().getName(),
                evaluation.getTotalMarks(),
                evaluation.getPhase().getMaxMarks(),
                evaluation.getGeneralRemarks(),
                evaluation.isPublished(),
                evaluation.getPublishedAt(),
                markResponses,
                evaluation.getEvaluatedAt(),
                evaluation.getCreatedAt(),
                evaluation.getUpdatedAt()
        );
    }
}

