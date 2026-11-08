package com.projects.projectmanager.service;

import com.projects.projectmanager.TestDatabaseCleaner;
import com.projects.projectmanager.dto.response.GitHubRepoResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class GitHubServiceTest {

    @Autowired private GitHubService gitHubService;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private GitHubSnapshotRepository snapshotRepository;
    @Autowired private TestDatabaseCleaner cleaner;

    @MockitoBean
    private GitHubClient gitHubClient;

    private User student;
    private User outsider;
    private User coordinator;
    private Project project;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        AcademicCycle cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        student = userRepository.save(User.builder()
                .pnr("PNR601")
                .email("s601@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student 601")
                .role(Role.STUDENT)
                .build());

        outsider = userRepository.save(User.builder()
                .pnr("PNR602")
                .email("s602@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student 602")
                .role(Role.STUDENT)
                .build());

        coordinator = userRepository.save(User.builder()
                .pnr("COORD601")
                .email("c601@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Coordinator")
                .role(Role.COORDINATOR)
                .build());

        Team team = teamRepository.save(Team.builder()
                .name("Gamma Team")
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
                .title("Distributed Database")
                .status(ProjectStatus.APPROVED)
                .githubRepoUrl("https://github.com/octocat/Hello-World")
                .build());
    }

    @Test
    void parseRepoUrl_variousFormats() {
        var c1 = gitHubService.parseRepoUrl("https://github.com/octocat/Hello-World");
        assertNotNull(c1);
        assertEquals("octocat", c1.owner());
        assertEquals("Hello-World", c1.repo());

        var c2 = gitHubService.parseRepoUrl("https://github.com/octocat/Hello-World.git");
        assertNotNull(c2);
        assertEquals("octocat", c2.owner());
        assertEquals("Hello-World", c2.repo());

        var c3 = gitHubService.parseRepoUrl("https://github.com/octocat/Hello-World/");
        assertNotNull(c3);
        assertEquals("octocat", c3.owner());
        assertEquals("Hello-World", c3.repo());

        assertNull(gitHubService.parseRepoUrl("https://gitlab.com/user/repo"));
        assertNull(gitHubService.parseRepoUrl("invalid-url"));
    }

    @Test
    void refreshRepoData_success_recordsSnapshot() {
        when(gitHubClient.fetchRepositoryData("octocat", "Hello-World"))
                .thenReturn(new GitHubClient.RepoData(
                        "SUCCESS", null, "Java", 120, 45, 3, 50, 4, 12, Instant.now()
                ));

        GitHubRepoResponse res = gitHubService.refreshRepoData(student, project.getId());

        assertNotNull(res.snapshotId());
        assertEquals("SUCCESS", res.status());
        assertEquals("Java", res.primaryLanguage());
        assertEquals(120, res.starsCount());
        assertEquals(45, res.forksCount());
        assertFalse(res.stale());
    }

    @Test
    void refreshRepoData_apiFailure_gracefulDegradation() {
        when(gitHubClient.fetchRepositoryData(anyString(), anyString()))
                .thenReturn(GitHubClient.RepoData.failure("UNAVAILABLE", "Cannot connect to GitHub: network error or outage"));

        GitHubRepoResponse res = gitHubService.refreshRepoData(student, project.getId());

        assertNotNull(res.snapshotId());
        assertEquals("UNAVAILABLE", res.status());
        assertEquals("Cannot connect to GitHub: network error or outage", res.errorMessage());
        // Core operations are not broken!
    }

    @Test
    void refreshRepoData_staleMarking() {
        when(gitHubClient.fetchRepositoryData("octocat", "Hello-World"))
                .thenReturn(new GitHubClient.RepoData(
                        "SUCCESS", null, "Java", 10, 5, 1, 10, 2, 3, Instant.now()
                ));

        GitHubRepoResponse first = gitHubService.refreshRepoData(student, project.getId());
        assertFalse(first.stale());

        // Refresh again
        GitHubRepoResponse second = gitHubService.refreshRepoData(student, project.getId());
        assertFalse(second.stale());

        List<GitHubRepoResponse> history = gitHubService.getSnapshotHistory(student, project.getId());
        assertEquals(2, history.size());
        assertFalse(history.get(0).stale());
        assertTrue(history.get(1).stale());
    }

    @Test
    void getLatestSnapshot_authorizationChecks() {
        when(gitHubClient.fetchRepositoryData(anyString(), anyString()))
                .thenReturn(new GitHubClient.RepoData(
                        "SUCCESS", null, "Java", 1, 1, 0, 1, 1, 0, Instant.now()
                ));

        // Member can view
        assertNotNull(gitHubService.getLatestSnapshot(student, project.getId()));

        // Coordinator can view
        assertNotNull(gitHubService.getLatestSnapshot(coordinator, project.getId()));

        // Outsider cannot view
        ApiException ex = assertThrows(ApiException.class,
                () -> gitHubService.getLatestSnapshot(outsider, project.getId()));
        assertEquals("ACCESS_DENIED", ex.getCode());
    }
}

