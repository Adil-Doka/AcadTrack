package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateCriterionRequest;
import com.projects.projectmanager.dto.request.EvaluateSubmissionRequest;
import com.projects.projectmanager.dto.request.MarkInput;
import com.projects.projectmanager.dto.response.CriterionResponse;
import com.projects.projectmanager.dto.response.EvaluationResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class EvaluationServiceTest {

    @Autowired private EvaluationService evaluationService;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private PhaseRepository phaseRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private EvaluationCriterionRepository criterionRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    private User student;
    private User coordinator;
    private AcademicCycle cycle;
    private Team team;
    private Project project;
    private Phase phase;
    private Submission submission;
    private EvaluationCriterion timelinessCriterion;
    private EvaluationCriterion qualityCriterion;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        student = userRepository.save(User.builder()
                .pnr("PNR301")
                .email("student@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student")
                .role(Role.STUDENT)
                .build());

        coordinator = userRepository.save(User.builder()
                .pnr("COORD01")
                .email("coord@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Coordinator")
                .role(Role.COORDINATOR)
                .build());

        team = teamRepository.save(Team.builder()
                .name("Alpha")
                .academicCycle(cycle)
                .status(TeamStatus.APPROVED)
                .createdBy(student)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .user(student)
                .academicCycle(cycle)
                .role(TeamRole.LEADER)
                .build());

        project = projectRepository.save(Project.builder()
                .team(team)
                .academicCycle(cycle)
                .title("IoT Project")
                .status(ProjectStatus.APPROVED)
                .build());

        Instant now = Instant.now();
        phase = phaseRepository.save(Phase.builder()
                .academicCycle(cycle)
                .name("Phase 1")
                .openingDate(now.minus(2, ChronoUnit.DAYS))
                .deadline(now.plus(5, ChronoUnit.DAYS))
                .maxMarks(new BigDecimal("50.00"))
                .active(true)
                .build());

        submission = submissionRepository.save(Submission.builder()
                .project(project)
                .phase(phase)
                .submittedBy(student)
                .version(1)
                .submittedAt(now)
                .late(false)
                .status("SUBMITTED")
                .build());

        documentRepository.save(Document.builder()
                .submission(submission)
                .fileName("report.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .storagePath("some/path/report.pdf")
                .build());

        // Criteria
        timelinessCriterion = criterionRepository.save(EvaluationCriterion.builder()
                .phase(phase)
                .name("Timeliness")
                .maxMarks(new BigDecimal("10.00"))
                .criterionType(CriterionType.AUTOMATIC_TIMELINESS)
                .description("Automated marks for on-time submission")
                .build());

        qualityCriterion = criterionRepository.save(EvaluationCriterion.builder()
                .phase(phase)
                .name("Report Quality")
                .maxMarks(new BigDecimal("40.00"))
                .criterionType(CriterionType.MANUAL)
                .description("Manual assessment of report content")
                .build());
    }

    @Test
    void evaluateSubmission_automaticAndManualCombined() {
        var markInputs = List.of(
                new MarkInput(qualityCriterion.getId(), new BigDecimal("35.00"), "Excellent documentation")
        );
        var req = new EvaluateSubmissionRequest(markInputs, "Overall solid work");

        EvaluationResponse res = evaluationService.evaluateSubmission(coordinator, submission.getId(), req);

        assertNotNull(res.id());
        assertFalse(res.published());
        // 10 (auto on-time) + 35 (manual) = 45.00
        assertEquals(new BigDecimal("45.00"), res.totalMarks());
        assertEquals("Overall solid work", res.generalRemarks());
        assertEquals(2, res.marks().size());
    }

    @Test
    void evaluateSubmission_lateSubmission_zeroAutomaticMarks() {
        submission.setLate(true);
        submissionRepository.save(submission);

        var markInputs = List.of(
                new MarkInput(qualityCriterion.getId(), new BigDecimal("30.00"), "Good")
        );
        var req = new EvaluateSubmissionRequest(markInputs, "Good work but late");

        EvaluationResponse res = evaluationService.evaluateSubmission(coordinator, submission.getId(), req);
        // 0 (auto late) + 30 (manual) = 30.00
        assertEquals(new BigDecimal("30.00"), res.totalMarks());
    }

    @Test
    void evaluateSubmission_markExceedsCriterionMax_throwsBadRequest() {
        var markInputs = List.of(
                new MarkInput(qualityCriterion.getId(), new BigDecimal("45.00"), "Exceeds max 40")
        );
        var req = new EvaluateSubmissionRequest(markInputs, "remarks");

        ApiException ex = assertThrows(ApiException.class,
                () -> evaluationService.evaluateSubmission(coordinator, submission.getId(), req));
        assertEquals("MARK_EXCEEDS_MAX", ex.getCode());
    }

    @Test
    void publication_controlsStudentVisibility() {
        var markInputs = List.of(
                new MarkInput(qualityCriterion.getId(), new BigDecimal("35.00"), "Good")
        );
        EvaluationResponse eval = evaluationService.evaluateSubmission(
                coordinator, submission.getId(), new EvaluateSubmissionRequest(markInputs, "remarks"));

        // Coordinator can view immediately
        assertNotNull(evaluationService.getEvaluation(coordinator, eval.id()));

        // Student cannot view unpublished evaluation
        ApiException ex = assertThrows(ApiException.class,
                () -> evaluationService.getEvaluation(student, eval.id()));
        assertEquals("RESULTS_NOT_PUBLISHED", ex.getCode());

        // Publish
        evaluationService.publishEvaluation(coordinator, eval.id());

        // Now student can view
        EvaluationResponse publishedEval = evaluationService.getEvaluation(student, eval.id());
        assertNotNull(publishedEval);
        assertTrue(publishedEval.published());
        assertEquals(new BigDecimal("45.00"), publishedEval.totalMarks());
    }
}
