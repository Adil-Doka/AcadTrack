package com.projects.projectmanager.service;

import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Order(2)
public class SampleDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataInitializer.class);

    private final UserRepository userRepository;
    private final AcademicCycleRepository academicCycleRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final PhaseRepository phaseRepository;
    private final EvaluationCriterionRepository evaluationCriterionRepository;
    private final SubmissionRepository submissionRepository;
    private final EvaluationRepository evaluationRepository;
    private final EvaluationMarkRepository evaluationMarkRepository;
    private final DocumentRepository documentRepository;
    private final GitHubSnapshotRepository gitHubSnapshotRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.sample-data.seed.enabled:true}")
    private boolean sampleSeedEnabled;

    public SampleDataInitializer(
            UserRepository userRepository,
            AcademicCycleRepository academicCycleRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository,
            ProjectRepository projectRepository,
            PhaseRepository phaseRepository,
            EvaluationCriterionRepository evaluationCriterionRepository,
            SubmissionRepository submissionRepository,
            EvaluationRepository evaluationRepository,
            EvaluationMarkRepository evaluationMarkRepository,
            DocumentRepository documentRepository,
            GitHubSnapshotRepository gitHubSnapshotRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.academicCycleRepository = academicCycleRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.projectRepository = projectRepository;
        this.phaseRepository = phaseRepository;
        this.evaluationCriterionRepository = evaluationCriterionRepository;
        this.submissionRepository = submissionRepository;
        this.evaluationRepository = evaluationRepository;
        this.evaluationMarkRepository = evaluationMarkRepository;
        this.documentRepository = documentRepository;
        this.gitHubSnapshotRepository = gitHubSnapshotRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!sampleSeedEnabled) {
            return;
        }

        // Idempotency check: if sample demo users already exist, skip seeding
        if (userRepository.existsByPnr("STU2026001")) {
            log.info("Sample demo data already exists in database. Skipping sample data seed.");
            return;
        }

        log.info("Seeding realistic sample data for HOD demonstration...");

        // 1. Academic Cycle
        AcademicCycle cycle = academicCycleRepository.findByName("2026-2027 Capstone Projects")
                .orElseGet(() -> academicCycleRepository.save(
                        AcademicCycle.builder()
                                .name("2026-2027 Capstone Projects")
                                .description("Annual final-year engineering capstone project cycle for B.Tech Computer Science")
                                .startDate(LocalDate.now().minusMonths(2))
                                .endDate(LocalDate.now().plusMonths(6))
                                .active(true)
                                .build()
                ));

        // 2. Sample Faculty Guides / Evaluators
        User guide1 = getOrCreateUser("FAC001", "faculty1@university.edu", "Dr. Sunita Deshmukh",
                "Computer Science", null, null, Role.COORDINATOR);
        User guide2 = getOrCreateUser("FAC002", "faculty2@university.edu", "Prof. Amit Verma",
                "Computer Science", null, null, Role.COORDINATOR);

        // 3. Sample Students
        User student1 = getOrCreateUser("STU2026001", "aarav.patel@student.university.edu", "Aarav Patel",
                "Computer Science", 4, "A", Role.STUDENT);
        User student2 = getOrCreateUser("STU2026002", "ananya.iyer@student.university.edu", "Ananya Iyer",
                "Computer Science", 4, "A", Role.STUDENT);
        User student3 = getOrCreateUser("STU2026003", "rohan.kulkarni@student.university.edu", "Rohan Kulkarni",
                "Computer Science", 4, "A", Role.STUDENT);

        User student4 = getOrCreateUser("STU2026004", "sneha.nair@student.university.edu", "Sneha Nair",
                "Computer Science", 4, "B", Role.STUDENT);
        User student5 = getOrCreateUser("STU2026005", "vikram.joshi@student.university.edu", "Vikram Joshi",
                "Computer Science", 4, "B", Role.STUDENT);
        User student6 = getOrCreateUser("STU2026006", "priya.rao@student.university.edu", "Priya Rao",
                "Computer Science", 4, "B", Role.STUDENT);

        // 4. Sample Teams
        Team team1 = teamRepository.save(
                Team.builder()
                        .name("NexusCore")
                        .academicCycle(cycle)
                        .status(TeamStatus.APPROVED)
                        .createdBy(student1)
                        .build()
        );

        teamMemberRepository.save(TeamMember.builder().team(team1).user(student1).academicCycle(cycle).role(TeamRole.LEADER).build());
        teamMemberRepository.save(TeamMember.builder().team(team1).user(student2).academicCycle(cycle).role(TeamRole.MEMBER).build());
        teamMemberRepository.save(TeamMember.builder().team(team1).user(student3).academicCycle(cycle).role(TeamRole.MEMBER).build());

        Team team2 = teamRepository.save(
                Team.builder()
                        .name("CloudPulse")
                        .academicCycle(cycle)
                        .status(TeamStatus.APPROVED)
                        .createdBy(student4)
                        .build()
        );

        teamMemberRepository.save(TeamMember.builder().team(team2).user(student4).academicCycle(cycle).role(TeamRole.LEADER).build());
        teamMemberRepository.save(TeamMember.builder().team(team2).user(student5).academicCycle(cycle).role(TeamRole.MEMBER).build());
        teamMemberRepository.save(TeamMember.builder().team(team2).user(student6).academicCycle(cycle).role(TeamRole.MEMBER).build());

        // 5. Sample Projects
        Project project1 = projectRepository.save(
                Project.builder()
                        .team(team1)
                        .academicCycle(cycle)
                        .title("Distributed Multi-Agent Task Orchestration Engine")
                        .description("An autonomous multi-agent task execution and workflow orchestration system featuring event-driven architecture, resilient dead-letter job queues, real-time telemetry streaming, and automated fault recovery for high-throughput academic research and distributed microservices.")
                        .domain("Distributed Systems & Cloud Computing (Java 24, Spring Boot 4, Apache Kafka, React, Redis)")
                        .githubRepoUrl("https://github.com/adil/nexus-agent-engine")
                        .status(ProjectStatus.APPROVED)
                        .build()
        );

        Project project2 = projectRepository.save(
                Project.builder()
                        .team(team2)
                        .academicCycle(cycle)
                        .title("AI-Powered Automated Observability & Anomaly Detection")
                        .description("Cloud-native observability dashboard that captures real-time OpenTelemetry trace spans, logs, and system metrics. Employs lightweight LSTM autoencoders to detect latency anomalies and resource bottlenecks in microservices.")
                        .domain("Artificial Intelligence & DevOps (Python, FastAPI, Prometheus, Grafana, React, PyTorch)")
                        .githubRepoUrl("https://github.com/adil/cloud-pulse-telemetry")
                        .status(ProjectStatus.UNDER_REVIEW)
                        .build()
        );

        // 6. Milestone Phases
        Phase phase1 = phaseRepository.save(
                Phase.builder()
                        .academicCycle(cycle)
                        .name("Phase 1: Synopsis & Feasibility Defense")
                        .description("Problem definition, literature survey, architectural blueprint, and technical feasibility presentation.")
                        .sequenceOrder(1)
                        .openingDate(Instant.now().minus(45, ChronoUnit.DAYS))
                        .deadline(Instant.now().minus(15, ChronoUnit.DAYS))
                        .maxMarks(new BigDecimal("50.00"))
                        .requiredDocuments("Synopsis Report (PDF), Slides (PPTX)")
                        .active(true)
                        .build()
        );

        Phase phase2 = phaseRepository.save(
                Phase.builder()
                        .academicCycle(cycle)
                        .name("Phase 2: Mid-Term Architecture & Prototype Review")
                        .description("Working prototype demonstration, database schema implementation, core API endpoints, and sprint roadmap.")
                        .sequenceOrder(2)
                        .openingDate(Instant.now().minus(14, ChronoUnit.DAYS))
                        .deadline(Instant.now().plus(20, ChronoUnit.DAYS))
                        .maxMarks(new BigDecimal("50.00"))
                        .requiredDocuments("Design Document (PDF), Code Repository, Demo Recording")
                        .active(true)
                        .build()
        );

        Phase phase3 = phaseRepository.save(
                Phase.builder()
                        .academicCycle(cycle)
                        .name("Phase 3: Final Defense & Honors Demonstration")
                        .description("Production deployment, end-to-end integration testing, final capstone project report, and external committee defense.")
                        .sequenceOrder(3)
                        .openingDate(Instant.now().plus(21, ChronoUnit.DAYS))
                        .deadline(Instant.now().plus(60, ChronoUnit.DAYS))
                        .maxMarks(new BigDecimal("100.00"))
                        .requiredDocuments("Final Project Report (PDF), Source Code (ZIP), User Manual")
                        .active(true)
                        .build()
        );

        // 7. Phase Evaluation Criteria (Rubrics)
        EvaluationCriterion c1 = evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase1)
                        .name("Problem Formulation & Research Depth")
                        .description("Clarity of project objectives, literature review rigor, and novelty")
                        .maxMarks(new BigDecimal("20.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );

        EvaluationCriterion c2 = evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase1)
                        .name("System Architecture & Feasibility")
                        .description("Architecture robustness, data flow, tech stack justification, and risk mitigation")
                        .maxMarks(new BigDecimal("15.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );

        EvaluationCriterion c3 = evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase1)
                        .name("Presentation & Viva Defense")
                        .description("Technical presentation delivery, Q&A mastery, and team member participation")
                        .maxMarks(new BigDecimal("15.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );

        // Phase 2 Criteria
        evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase2)
                        .name("Prototype Functionality & API Completeness")
                        .description("Demonstration of core workflows and working endpoints")
                        .maxMarks(new BigDecimal("25.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );
        evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase2)
                        .name("Database Design & Schema Optimization")
                        .description("Normalization, indexing, migrations, and referential integrity")
                        .maxMarks(new BigDecimal("15.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );
        evaluationCriterionRepository.save(
                EvaluationCriterion.builder()
                        .phase(phase2)
                        .name("Progress Verification & Milestone Adherence")
                        .description("Sprint velocity, commit history, and milestone timeliness")
                        .maxMarks(new BigDecimal("10.00"))
                        .criterionType(CriterionType.MANUAL)
                        .build()
        );

        // 8. Submission for Project 1 on Phase 1
        Submission submission1 = submissionRepository.save(
                Submission.builder()
                        .project(project1)
                        .phase(phase1)
                        .submittedBy(student1)
                        .version(1)
                        .submittedAt(Instant.now().minus(20, ChronoUnit.DAYS))
                        .late(false)
                        .notes("Comprehensive synopsis report covering distributed actor patterns, Kafka event flow, and prototype milestones.")
                        .status("EVALUATED")
                        .build()
        );

        documentRepository.save(
                Document.builder()
                        .submission(submission1)
                        .fileName("Synopsis_Distributed_MultiAgent_NexusCore.pdf")
                        .contentType("application/pdf")
                        .fileSize(2485760L)
                        .storagePath("./uploads/sample_synopsis_nexuscore.pdf")
                        .uploadedAt(Instant.now().minus(20, ChronoUnit.DAYS))
                        .build()
        );

        // 9. Published Evaluation for Project 1
        User coordinator = userRepository.findByPnr("COORD001").orElse(guide1);
        Evaluation evaluation1 = evaluationRepository.save(
                Evaluation.builder()
                        .submission(submission1)
                        .project(project1)
                        .phase(phase1)
                        .evaluator(guide1)
                        .totalMarks(new BigDecimal("47.50"))
                        .generalRemarks("Outstanding problem formulation and comprehensive architectural blueprint. The distributed multi-agent delegation model is well conceived and technically sound. Highly approved for prototype development.")
                        .published(true)
                        .publishedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                        .publishedBy(coordinator)
                        .evaluatedAt(Instant.now().minus(12, ChronoUnit.DAYS))
                        .build()
        );

        evaluationMarkRepository.save(
                EvaluationMark.builder()
                        .evaluation(evaluation1)
                        .criterion(c1)
                        .marksAwarded(new BigDecimal("19.00"))
                        .remarks("Exceptional survey of multi-agent protocols and clear formulation.")
                        .build()
        );
        evaluationMarkRepository.save(
                EvaluationMark.builder()
                        .evaluation(evaluation1)
                        .criterion(c2)
                        .marksAwarded(new BigDecimal("14.50"))
                        .remarks("Thorough architecture diagram; good failure recovery design.")
                        .build()
        );
        evaluationMarkRepository.save(
                EvaluationMark.builder()
                        .evaluation(evaluation1)
                        .criterion(c3)
                        .marksAwarded(new BigDecimal("14.00"))
                        .remarks("Confident answers during defense; all team members were engaged.")
                        .build()
        );

        // 10. Sample GitHub Snapshots for Analytics
        gitHubSnapshotRepository.save(
                GitHubSnapshot.builder()
                        .project(project1)
                        .repoUrl("https://github.com/adil/nexus-agent-engine")
                        .ownerName("adil")
                        .repoName("nexus-agent-engine")
                        .primaryLanguage("Java")
                        .starsCount(18)
                        .forksCount(4)
                        .openIssuesCount(2)
                        .commitCount(64)
                        .branchesCount(6)
                        .pullRequestsCount(11)
                        .latestActivityAt(Instant.now().minus(2, ChronoUnit.HOURS))
                        .build()
        );

        gitHubSnapshotRepository.save(
                GitHubSnapshot.builder()
                        .project(project2)
                        .repoUrl("https://github.com/adil/cloud-pulse-telemetry")
                        .ownerName("adil")
                        .repoName("cloud-pulse-telemetry")
                        .primaryLanguage("Python")
                        .starsCount(9)
                        .forksCount(2)
                        .openIssuesCount(1)
                        .commitCount(38)
                        .branchesCount(4)
                        .pullRequestsCount(5)
                        .latestActivityAt(Instant.now().minus(1, ChronoUnit.DAYS))
                        .build()
        );

        auditService.log(null, "SAMPLE_DATA_SEEDED", "SYSTEM", 1L,
                "Seeded demo academic cycle, teams (NexusCore, CloudPulse), projects, phases, and evaluations for HOD review.");

        log.info("Sample data initialization completed successfully! 2 teams, 2 projects, 3 phases, and full evaluation marks are ready.");
    }

    private User getOrCreateUser(String pnr, String email, String name, String department,
                                 Integer year, String division, Role role) {
        return userRepository.findByPnr(pnr)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .pnr(pnr)
                                .email(email)
                                .name(name)
                                .password(passwordEncoder.encode("Password@123"))
                                .department(department)
                                .year(year)
                                .division(division)
                                .role(role)
                                .build()
                ));
    }
}
