package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateProjectRequest;
import com.projects.projectmanager.dto.request.RejectProjectRequest;
import com.projects.projectmanager.dto.request.UpdateProjectRequest;
import com.projects.projectmanager.dto.response.ProjectResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ProjectServiceTest {

    @Autowired private ProjectService projectService;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    private User leader;
    private User member;
    private User outsider;
    private User coordinator;
    private AcademicCycle cycle;
    private Team approvedTeam;
    private Team draftTeam;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        leader = createUser("PNR100", "leader@example.com", "Leader", Role.STUDENT);
        member = createUser("PNR101", "member@example.com", "Member", Role.STUDENT);
        outsider = createUser("PNR102", "outsider@example.com", "Outsider", Role.STUDENT);
        coordinator = createUser("COORD1", "coord@example.com", "Coordinator", Role.COORDINATOR);

        // Create approved team
        approvedTeam = teamRepository.save(Team.builder()
                .name("Alpha Approved")
                .academicCycle(cycle)
                .status(TeamStatus.APPROVED)
                .createdBy(leader)
                .build());

        TeamMember tm1 = teamMemberRepository.save(TeamMember.builder()
                .team(approvedTeam)
                .user(leader)
                .academicCycle(cycle)
                .role(TeamRole.LEADER)
                .build());
        TeamMember tm2 = teamMemberRepository.save(TeamMember.builder()
                .team(approvedTeam)
                .user(member)
                .academicCycle(cycle)
                .role(TeamRole.MEMBER)
                .build());
        approvedTeam.getMembers().add(tm1);
        approvedTeam.getMembers().add(tm2);

        // Create draft team
        draftTeam = teamRepository.save(Team.builder()
                .name("Draft Team")
                .academicCycle(cycle)
                .status(TeamStatus.DRAFT)
                .createdBy(outsider)
                .build());
        TeamMember tm3 = teamMemberRepository.save(TeamMember.builder()
                .team(draftTeam)
                .user(outsider)
                .academicCycle(cycle)
                .role(TeamRole.LEADER)
                .build());
        draftTeam.getMembers().add(tm3);
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

    private CreateProjectRequest validCreateRequest() {
        return new CreateProjectRequest(
                approvedTeam.getId(),
                "AI Medical Diagnostics",
                "Machine learning diagnostics platform",
                "Healthcare",
                "https://github.com/example/ai-med"
        );
    }

    @Test
    void registerProject_success() {
        ProjectResponse res = projectService.registerProject(leader, validCreateRequest());

        assertNotNull(res.id());
        assertEquals("AI Medical Diagnostics", res.title());
        assertEquals("DRAFT", res.status());
        assertEquals("Alpha Approved", res.teamName());
    }

    @Test
    void registerProject_teamNotApproved_throwsBadRequest() {
        var req = new CreateProjectRequest(
                draftTeam.getId(), "Title", "Desc", "Domain", null);

        ApiException ex = assertThrows(ApiException.class,
                () -> projectService.registerProject(outsider, req));
        assertEquals("TEAM_NOT_APPROVED", ex.getCode());
    }

    @Test
    void registerProject_byNonLeader_throwsForbidden() {
        ApiException ex = assertThrows(ApiException.class,
                () -> projectService.registerProject(member, validCreateRequest()));
        assertEquals("NOT_TEAM_LEADER", ex.getCode());
    }

    @Test
    void registerProject_duplicateForTeam_throwsConflict() {
        projectService.registerProject(leader, validCreateRequest());

        ApiException ex = assertThrows(ApiException.class,
                () -> projectService.registerProject(leader, validCreateRequest()));
        assertEquals("PROJECT_EXISTS", ex.getCode());
    }

    @Test
    void projectWorkflow_fullCycle() {
        ProjectResponse created = projectService.registerProject(leader, validCreateRequest());

        // Update project
        ProjectResponse updated = projectService.updateProject(leader, created.id(),
                new UpdateProjectRequest("Updated Title", "Updated Desc", "Health", "https://github.com/example/repo"));
        assertEquals("Updated Title", updated.title());

        // Submit project
        ProjectResponse submitted = projectService.submitProject(leader, created.id());
        assertEquals("SUBMITTED", submitted.status());

        // Coordinator review
        ProjectResponse underReview = projectService.putUnderReview(created.id());
        assertEquals("UNDER_REVIEW", underReview.status());

        // Reject with reason
        ProjectResponse rejected = projectService.rejectProject(created.id(),
                new RejectProjectRequest("Scope is too broad"));
        assertEquals("REJECTED", rejected.status());
        assertEquals("Scope is too broad", rejected.rejectionReason());

        // Update and resubmit
        projectService.updateProject(leader, created.id(),
                new UpdateProjectRequest("Refined Title", "Narrowed scope", "Health", "https://github.com/example/repo"));
        ProjectResponse resubmitted = projectService.submitProject(leader, created.id());
        assertEquals("SUBMITTED", resubmitted.status());
        assertNull(resubmitted.rejectionReason());

        // Approve
        ProjectResponse approved = projectService.approveProject(created.id());
        assertEquals("APPROVED", approved.status());

        // Cannot update approved project
        ApiException ex = assertThrows(ApiException.class,
                () -> projectService.updateProject(leader, created.id(),
                        new UpdateProjectRequest("New Title", "Desc", "Health", null)));
        assertEquals("PROJECT_LOCKED", ex.getCode());
    }

    @Test
    void getProject_authorizationChecks() {
        ProjectResponse project = projectService.registerProject(leader, validCreateRequest());

        // Leader can view
        assertNotNull(projectService.getProject(leader, project.id()));

        // Member can view
        assertNotNull(projectService.getProject(member, project.id()));

        // Coordinator can view
        assertNotNull(projectService.getProject(coordinator, project.id()));

        // Outsider cannot view
        ApiException ex = assertThrows(ApiException.class,
                () -> projectService.getProject(outsider, project.id()));
        assertEquals("ACCESS_DENIED", ex.getCode());
    }
}
