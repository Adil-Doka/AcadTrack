package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.AddMemberRequest;
import com.projects.projectmanager.dto.request.CreateTeamRequest;
import com.projects.projectmanager.dto.request.RejectTeamRequest;
import com.projects.projectmanager.dto.response.TeamResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.AcademicCycleRepository;
import com.projects.projectmanager.repository.TeamMemberRepository;
import com.projects.projectmanager.repository.TeamRepository;
import com.projects.projectmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class TeamServiceTest {

    @Autowired private TeamService teamService;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    private User student1;
    private User student2;
    private User student3;
    private User student4;
    private User student5;
    private User coordinator;
    private AcademicCycle cycle;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        student1 = createUser("PNR001", "s1@example.com", "Student One", Role.STUDENT);
        student2 = createUser("PNR002", "s2@example.com", "Student Two", Role.STUDENT);
        student3 = createUser("PNR003", "s3@example.com", "Student Three", Role.STUDENT);
        student4 = createUser("PNR004", "s4@example.com", "Student Four", Role.STUDENT);
        student5 = createUser("PNR005", "s5@example.com", "Student Five", Role.STUDENT);
        coordinator = createUser("COORD01", "coord@example.com", "Coordinator", Role.COORDINATOR);
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

    @Test
    void createTeam_success() {
        TeamResponse res = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        assertNotNull(res.id());
        assertEquals("Alpha Team", res.name());
        assertEquals("DRAFT", res.status());
        assertEquals(1, res.members().size());
        assertEquals("LEADER", res.members().get(0).role());
        assertEquals("PNR001", res.members().get(0).pnr());
    }

    @Test
    void createTeam_inactiveCycle_throwsBadRequest() {
        cycle.setActive(false);
        cycleRepository.save(cycle);

        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId())));
        assertEquals("CYCLE_INACTIVE", ex.getCode());
    }

    @Test
    void createTeam_alreadyInTeamForCycle_throwsConflict() {
        teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.createTeam(student1, new CreateTeamRequest("Beta Team", cycle.getId())));
        assertEquals("ALREADY_IN_TEAM", ex.getCode());
    }

    @Test
    void addMember_success() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        TeamResponse updated = teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));

        assertEquals(2, updated.members().size());
        assertTrue(updated.members().stream().anyMatch(m -> m.pnr().equals("PNR002") && m.role().equals("MEMBER")));
    }

    @Test
    void addMember_nonExistentStudent_throwsNotFound() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.addMember(student1, team.id(), new AddMemberRequest("NON_EXISTENT")));
        assertEquals("STUDENT_NOT_FOUND", ex.getCode());
    }

    @Test
    void addMember_studentAlreadyInAnotherTeam_throwsConflict() {
        teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        TeamResponse team2 = teamService.createTeam(student3, new CreateTeamRequest("Beta Team", cycle.getId()));

        // Try adding student1 (who is in Alpha) to Beta
        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.addMember(student3, team2.id(), new AddMemberRequest("PNR001")));
        assertEquals("ALREADY_IN_TEAM", ex.getCode());
    }

    @Test
    void addMember_byNonLeader_throwsForbidden() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));

        // student2 tries to add student3
        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.addMember(student2, team.id(), new AddMemberRequest("PNR003")));
        assertEquals("NOT_TEAM_LEADER", ex.getCode());
    }

    @Test
    void addMember_exceedsMaxSize_throwsBadRequest() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR003"));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR004")); // now 4 members (max)

        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.addMember(student1, team.id(), new AddMemberRequest("PNR005")));
        assertEquals("TEAM_FULL", ex.getCode());
    }

    @Test
    void removeMember_success() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));

        TeamResponse updated = teamService.removeMember(student1, team.id(), student2.getId());
        assertEquals(1, updated.members().size());
    }

    @Test
    void removeMember_cannotRemoveLeader_throwsBadRequest() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.removeMember(student1, team.id(), student1.getId()));
        assertEquals("CANNOT_REMOVE_LEADER", ex.getCode());
    }

    @Test
    void submitTeam_belowMinSize_throwsBadRequest() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        // min size is 2, currently only 1 member
        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.submitTeam(student1, team.id()));
        assertEquals("TEAM_TOO_SMALL", ex.getCode());
    }

    @Test
    void submitTeam_validSize_changesStatusToSubmitted() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));

        TeamResponse submitted = teamService.submitTeam(student1, team.id());
        assertEquals("SUBMITTED", submitted.status());
    }

    @Test
    void approvalWorkflow_fullCycle() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));
        teamService.addMember(student1, team.id(), new AddMemberRequest("PNR002"));
        teamService.submitTeam(student1, team.id());

        // Under review
        TeamResponse underReview = teamService.putUnderReview(team.id());
        assertEquals("UNDER_REVIEW", underReview.status());

        // Reject with reason
        TeamResponse rejected = teamService.rejectTeam(team.id(), new RejectTeamRequest("Topic duplicate"));
        assertEquals("REJECTED", rejected.status());
        assertEquals("Topic duplicate", rejected.rejectionReason());

        // Resubmit from REJECTED
        TeamResponse resubmitted = teamService.submitTeam(student1, team.id());
        assertEquals("SUBMITTED", resubmitted.status());
        assertNull(resubmitted.rejectionReason());

        // Approve
        TeamResponse approved = teamService.approveTeam(team.id());
        assertEquals("APPROVED", approved.status());

        // Cannot modify approved team
        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.addMember(student1, team.id(), new AddMemberRequest("PNR003")));
        assertEquals("TEAM_LOCKED", ex.getCode());

        // Coordinator reopens
        TeamResponse reopened = teamService.reopenTeam(team.id());
        assertEquals("DRAFT", reopened.status());

        // Now can add member again
        TeamResponse modified = teamService.addMember(student1, team.id(), new AddMemberRequest("PNR003"));
        assertEquals(3, modified.members().size());
    }

    @Test
    void getTeam_authorizationRules() {
        TeamResponse team = teamService.createTeam(student1, new CreateTeamRequest("Alpha Team", cycle.getId()));

        // Member can view
        assertNotNull(teamService.getTeam(student1, team.id()));

        // Coordinator can view
        assertNotNull(teamService.getTeam(coordinator, team.id()));

        // Unrelated student cannot view
        ApiException ex = assertThrows(ApiException.class,
                () -> teamService.getTeam(student3, team.id()));
        assertEquals("ACCESS_DENIED", ex.getCode());
    }
}
