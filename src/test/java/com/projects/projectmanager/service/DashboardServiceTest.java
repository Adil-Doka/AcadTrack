package com.projects.projectmanager.service;

import com.projects.projectmanager.TestDatabaseCleaner;
import com.projects.projectmanager.dto.response.CoordinatorDashboardResponse;
import com.projects.projectmanager.dto.response.StudentDashboardResponse;
import com.projects.projectmanager.entity.*;
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

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class DashboardServiceTest {

    @Autowired private DashboardService dashboardService;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private PhaseRepository phaseRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private EvaluationRepository evaluationRepository;
    @Autowired private TestDatabaseCleaner cleaner;

    private User student;
    private User coordinator;
    private AcademicCycle cycle;
    private Team team;
    private Project project;
    private Phase phase;

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
                .pnr("PNR501")
                .email("s501@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student 501")
                .role(Role.STUDENT)
                .build());

        coordinator = userRepository.save(User.builder()
                .pnr("COORD501")
                .email("c501@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Coordinator")
                .role(Role.COORDINATOR)
                .build());

        team = teamRepository.save(Team.builder()
                .name("Beta Team")
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
                .title("Autonomous Drone")
                .status(ProjectStatus.APPROVED)
                .build());

        Instant now = Instant.now();
        phase = phaseRepository.save(Phase.builder()
                .academicCycle(cycle)
                .name("Design Review")
                .openingDate(now.minus(2, ChronoUnit.DAYS))
                .deadline(now.plus(5, ChronoUnit.DAYS))
                .maxMarks(new BigDecimal("40.00"))
                .active(true)
                .build());
    }

    @Test
    void getStudentDashboard_returnsFullOverview() {
        StudentDashboardResponse db = dashboardService.getStudentDashboard(student, cycle.getId());

        assertNotNull(db.team());
        assertEquals("Beta Team", db.team().name());
        assertNotNull(db.project());
        assertEquals("Autonomous Drone", db.project().title());
        assertEquals(1, db.phases().size());
        assertEquals(0, db.submissions().size());
        assertEquals(0, db.releasedEvaluations().size());
    }

    @Test
    void getCoordinatorDashboard_returnsStatsAndOverview() {
        CoordinatorDashboardResponse db = dashboardService.getCoordinatorDashboard(cycle.getId());

        assertNotNull(db);
        assertEquals("Cycle 2026", db.cycleName());
        assertEquals(1, db.upcomingPhases().size());
        assertEquals(1L, db.stats().get("totalTeams"));
        assertEquals(1L, db.stats().get("approvedTeams"));
        assertEquals(1L, db.stats().get("totalProjects"));
        assertEquals(1L, db.stats().get("approvedProjects"));
    }
}

