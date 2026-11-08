package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.SubmissionResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class SubmissionServiceTest {

    @Autowired private SubmissionService submissionService;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private PhaseRepository phaseRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    private User student1;
    private User outsider;
    private User coordinator;
    private AcademicCycle cycle;
    private Team team;
    private Project project;
    private Phase onTimePhase;
    private Phase expiredPhase;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        student1 = createUser("PNR201", "s1@example.com", "Student One", Role.STUDENT);
        outsider = createUser("PNR202", "outsider@example.com", "Outsider", Role.STUDENT);
        coordinator = createUser("COORD01", "coord@example.com", "Coordinator", Role.COORDINATOR);

        team = teamRepository.save(Team.builder()
                .name("Alpha Team")
                .academicCycle(cycle)
                .status(TeamStatus.APPROVED)
                .createdBy(student1)
                .build());

        TeamMember tm = teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .user(student1)
                .academicCycle(cycle)
                .role(TeamRole.LEADER)
                .build());
        team.getMembers().add(tm);

        project = projectRepository.save(Project.builder()
                .team(team)
                .academicCycle(cycle)
                .title("Smart Campus IoT")
                .status(ProjectStatus.APPROVED)
                .build());

        Instant now = Instant.now();

        // Phase with deadline in future
        onTimePhase = phaseRepository.save(Phase.builder()
                .academicCycle(cycle)
                .name("Synopsis")
                .openingDate(now.minus(2, ChronoUnit.DAYS))
                .deadline(now.plus(5, ChronoUnit.DAYS))
                .maxMarks(new BigDecimal("50.00"))
                .active(true)
                .build());

        // Phase with deadline in past
        expiredPhase = phaseRepository.save(Phase.builder()
                .academicCycle(cycle)
                .name("Early Checkpoint")
                .openingDate(now.minus(10, ChronoUnit.DAYS))
                .deadline(now.minus(2, ChronoUnit.DAYS))
                .maxMarks(new BigDecimal("20.00"))
                .active(true)
                .build());
    }

    private User createUser(String pnr, String email, String name, Role role) {
        return userRepository.save(User.builder()
                .pnr(pnr)
                .email(email)
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name(name)
                .department("CS")
                .year(3)
                .division("A")
                .role(role)
                .build());
    }

    private MockMultipartFile createPdfFile(String name) {
        return new MockMultipartFile(
                "files",
                name,
                "application/pdf",
                "Mock PDF content for testing".getBytes()
        );
    }

    @Test
    void submit_onTime_createsVersion1AndNotLate() {
        MockMultipartFile file = createPdfFile("report.pdf");

        SubmissionResponse res = submissionService.submit(
                student1, onTimePhase.getId(), project.getId(), "First submission", List.of(file));

        assertNotNull(res.id());
        assertEquals(1, res.version());
        assertFalse(res.late());
        assertEquals(1, res.documents().size());
        assertEquals("report.pdf", res.documents().get(0).fileName());
    }

    @Test
    void submit_afterDeadline_isMarkedLate() {
        MockMultipartFile file = createPdfFile("late_report.pdf");

        SubmissionResponse res = submissionService.submit(
                student1, expiredPhase.getId(), project.getId(), "Late submission", List.of(file));

        assertTrue(res.late());
        assertEquals(1, res.version());
    }

    @Test
    void submit_resubmission_incrementsVersionAndPreservesHistory() {
        MockMultipartFile file1 = createPdfFile("draft_report.pdf");
        SubmissionResponse sub1 = submissionService.submit(
                student1, onTimePhase.getId(), project.getId(), "v1 notes", List.of(file1));
        assertEquals(1, sub1.version());

        MockMultipartFile file2 = createPdfFile("final_report.pdf");
        SubmissionResponse sub2 = submissionService.submit(
                student1, onTimePhase.getId(), project.getId(), "v2 revised notes", List.of(file2));
        assertEquals(2, sub2.version());

        List<SubmissionResponse> history = submissionService.getSubmissionHistory(
                student1, project.getId(), onTimePhase.getId());
        assertEquals(2, history.size());
        assertEquals(2, history.get(0).version());
        assertEquals(1, history.get(1).version());
    }

    @Test
    void submit_disallowedFileType_throwsBadRequest() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "files",
                "malware.exe",
                "application/x-msdownload",
                "malicious bytes".getBytes()
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> submissionService.submit(
                        student1, onTimePhase.getId(), project.getId(), "notes", List.of(exeFile)));
        assertEquals("INVALID_FILE_TYPE", ex.getCode());
    }

    @Test
    void submit_byNonMember_throwsForbidden() {
        MockMultipartFile file = createPdfFile("report.pdf");

        ApiException ex = assertThrows(ApiException.class,
                () -> submissionService.submit(
                        outsider, onTimePhase.getId(), project.getId(), "notes", List.of(file)));
        assertEquals("NOT_TEAM_MEMBER", ex.getCode());
    }

    @Test
    void downloadDocument_byMemberAndCoordinator_success() {
        MockMultipartFile file = createPdfFile("report.pdf");
        SubmissionResponse sub = submissionService.submit(
                student1, onTimePhase.getId(), project.getId(), "notes", List.of(file));
        Long docId = sub.documents().get(0).id();

        // Student member can download
        var download1 = submissionService.loadDocument(student1, docId);
        assertNotNull(download1.resource());
        assertEquals("report.pdf", download1.filename());

        // Coordinator can download
        var download2 = submissionService.loadDocument(coordinator, docId);
        assertNotNull(download2.resource());

        // Outsider student cannot download
        ApiException ex = assertThrows(ApiException.class,
                () -> submissionService.loadDocument(outsider, docId));
        assertEquals("ACCESS_DENIED", ex.getCode());
    }
}
