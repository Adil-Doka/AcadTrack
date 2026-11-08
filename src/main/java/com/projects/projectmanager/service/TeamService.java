package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.AddMemberRequest;
import com.projects.projectmanager.dto.request.CreateTeamRequest;
import com.projects.projectmanager.dto.request.RejectTeamRequest;
import com.projects.projectmanager.dto.response.TeamMemberResponse;
import com.projects.projectmanager.dto.response.TeamResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.AcademicCycleRepository;
import com.projects.projectmanager.repository.TeamMemberRepository;
import com.projects.projectmanager.repository.TeamRepository;
import com.projects.projectmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final AcademicCycleRepository cycleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Value("${app.team.min-size:2}")
    private int minTeamSize;

    @Value("${app.team.max-size:4}")
    private int maxTeamSize;

    public TeamService(TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       AcademicCycleRepository cycleRepository,
                       UserRepository userRepository,
                       AuditService auditService,
                       NotificationService notificationService) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.cycleRepository = cycleRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public TeamResponse createTeam(User currentUser, CreateTeamRequest request) {
        AcademicCycle cycle = cycleRepository.findById(request.cycleId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                        "Academic cycle not found with id: " + request.cycleId()));

        if (!cycle.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CYCLE_INACTIVE",
                    "Cannot create a team in an inactive academic cycle");
        }

        if (teamMemberRepository.existsByAcademicCycleIdAndUserId(cycle.getId(), currentUser.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_IN_TEAM",
                    "You are already a member of a team in this academic cycle");
        }

        Team team = Team.builder()
                .name(request.name())
                .academicCycle(cycle)
                .status(TeamStatus.DRAFT)
                .createdBy(currentUser)
                .build();

        team = teamRepository.save(team);

        TeamMember leaderMember = TeamMember.builder()
                .team(team)
                .user(currentUser)
                .academicCycle(cycle)
                .role(TeamRole.LEADER)
                .build();

        team.getMembers().add(leaderMember);
        teamMemberRepository.save(leaderMember);

        return toResponse(team);
    }

    @Transactional
    public TeamResponse addMember(User currentUser, Long teamId, AddMemberRequest request) {
        Team team = getTeamOrThrow(teamId);
        assertCanModifyTeam(currentUser, team);

        if (team.getMembers().size() >= maxTeamSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TEAM_FULL",
                    "Team has reached maximum capacity of " + maxTeamSize + " members");
        }

        User student = userRepository.findByPnr(request.pnr())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "STUDENT_NOT_FOUND",
                        "Student not found with PNR: " + request.pnr()));

        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_MEMBER_ROLE",
                    "Only students can be added as team members");
        }

        if (teamMemberRepository.existsByAcademicCycleIdAndUserId(team.getAcademicCycle().getId(), student.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_IN_TEAM",
                    "Student with PNR " + request.pnr() + " is already in a team for this academic cycle");
        }

        TeamMember member = TeamMember.builder()
                .team(team)
                .user(student)
                .academicCycle(team.getAcademicCycle())
                .role(TeamRole.MEMBER)
                .build();

        team.getMembers().add(member);
        teamMemberRepository.save(member);

        return toResponse(team);
    }

    @Transactional
    public TeamResponse removeMember(User currentUser, Long teamId, Long memberUserId) {
        Team team = getTeamOrThrow(teamId);
        assertCanModifyTeam(currentUser, team);

        if (currentUser.getId().equals(memberUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_REMOVE_LEADER",
                    "Team leader cannot be removed from the team");
        }

        TeamMember memberToRemove = team.getMembers().stream()
                .filter(m -> m.getUser().getId().equals(memberUserId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND",
                        "User is not a member of this team"));

        team.getMembers().remove(memberToRemove);
        teamMemberRepository.delete(memberToRemove);

        return toResponse(team);
    }

    @Transactional
    public TeamResponse submitTeam(User currentUser, Long teamId) {
        Team team = getTeamOrThrow(teamId);
        assertLeader(currentUser, team);

        if (team.getStatus() != TeamStatus.DRAFT && team.getStatus() != TeamStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only teams in DRAFT or REJECTED status can be submitted");
        }

        if (team.getMembers().size() < minTeamSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TEAM_TOO_SMALL",
                    "Team must have at least " + minTeamSize + " members to submit");
        }

        if (team.getMembers().size() > maxTeamSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TEAM_TOO_LARGE",
                    "Team exceeds maximum size of " + maxTeamSize + " members");
        }

        team.setStatus(TeamStatus.SUBMITTED);
        team.setRejectionReason(null);
        team = teamRepository.save(team);

        auditService.log(currentUser, "TEAM_SUBMITTED", "TEAM", team.getId(), "Team submitted for coordinator approval");
        return toResponse(team);
    }

    @Transactional
    public TeamResponse putUnderReview(Long teamId) {
        Team team = getTeamOrThrow(teamId);
        if (team.getStatus() != TeamStatus.SUBMITTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED teams can be moved to UNDER_REVIEW");
        }
        team.setStatus(TeamStatus.UNDER_REVIEW);
        team = teamRepository.save(team);
        auditService.log(null, "TEAM_UNDER_REVIEW", "TEAM", team.getId(), "Team moved to under review");
        return toResponse(team);
    }

    @Transactional
    public TeamResponse approveTeam(Long teamId) {
        Team team = getTeamOrThrow(teamId);
        if (team.getStatus() != TeamStatus.SUBMITTED && team.getStatus() != TeamStatus.UNDER_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED or UNDER_REVIEW teams can be approved");
        }
        team.setStatus(TeamStatus.APPROVED);
        team.setRejectionReason(null);
        team = teamRepository.save(team);

        auditService.log(null, "TEAM_APPROVED", "TEAM", team.getId(), "Team approved by coordinator");
        for (TeamMember m : team.getMembers()) {
            notificationService.notify(m.getUser(), "TEAM_DECISION", "Team Approved",
                    "Your team '" + team.getName() + "' has been approved by the coordinator", "/teams/" + team.getId());
        }
        return toResponse(team);
    }

    @Transactional
    public TeamResponse rejectTeam(Long teamId, RejectTeamRequest request) {
        Team team = getTeamOrThrow(teamId);
        if (team.getStatus() != TeamStatus.SUBMITTED && team.getStatus() != TeamStatus.UNDER_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED or UNDER_REVIEW teams can be rejected");
        }
        team.setStatus(TeamStatus.REJECTED);
        team.setRejectionReason(request.reason());
        team = teamRepository.save(team);

        auditService.log(null, "TEAM_REJECTED", "TEAM", team.getId(), "Team rejected: " + request.reason());
        for (TeamMember m : team.getMembers()) {
            notificationService.notify(m.getUser(), "TEAM_DECISION", "Team Rejected",
                    "Your team '" + team.getName() + "' was rejected. Reason: " + request.reason(), "/teams/" + team.getId());
        }
        return toResponse(team);
    }

    @Transactional
    public TeamResponse reopenTeam(Long teamId) {
        Team team = getTeamOrThrow(teamId);
        if (team.getStatus() != TeamStatus.APPROVED && team.getStatus() != TeamStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only APPROVED or REJECTED teams can be reopened");
        }
        team.setStatus(TeamStatus.DRAFT);
        team = teamRepository.save(team);

        auditService.log(null, "TEAM_REOPENED", "TEAM", team.getId(), "Team reopened for editing");
        for (TeamMember m : team.getMembers()) {
            notificationService.notify(m.getUser(), "TEAM_DECISION", "Team Reopened",
                    "Your team '" + team.getName() + "' has been reopened for editing", "/teams/" + team.getId());
        }
        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeam(User currentUser, Long teamId) {
        Team team = getTeamOrThrow(teamId);
        if (currentUser.getRole() != Role.COORDINATOR && !isMember(currentUser, team)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have permission to view this team");
        }
        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeams(User currentUser, Long cycleId, TeamStatus status) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            List<Team> teams;
            if (cycleId != null && status != null) {
                teams = teamRepository.findByAcademicCycleIdAndStatus(cycleId, status);
            } else if (cycleId != null) {
                teams = teamRepository.findByAcademicCycleId(cycleId);
            } else if (status != null) {
                teams = teamRepository.findByStatus(status);
            } else {
                teams = teamRepository.findAll();
            }
            return teams.stream().map(this::toResponse).toList();
        } else {
            // Student sees only their teams
            return teamRepository.findAllByUserId(currentUser.getId()).stream()
                    .filter(t -> cycleId == null || t.getAcademicCycle().getId().equals(cycleId))
                    .filter(t -> status == null || t.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
    }

    @Transactional(readOnly = true)
    public TeamResponse getMyTeamForCycle(User currentUser, Long cycleId) {
        Team team = teamRepository.findByUserIdAndAcademicCycleId(currentUser.getId(), cycleId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND",
                        "You do not belong to any team in this academic cycle"));
        return toResponse(team);
    }

    private Team getTeamOrThrow(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND",
                        "Team not found with id: " + teamId));
    }

    private void assertLeader(User currentUser, Team team) {
        boolean isLeader = team.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()) && m.getRole() == TeamRole.LEADER);
        if (!isLeader) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_TEAM_LEADER",
                    "Only the team leader can perform this operation");
        }
    }

    private void assertCanModifyTeam(User currentUser, Team team) {
        assertLeader(currentUser, team);
        if (team.getStatus() != TeamStatus.DRAFT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TEAM_LOCKED",
                    "Team cannot be modified in " + team.getStatus() + " status");
        }
    }

    private boolean isMember(User currentUser, Team team) {
        return team.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
    }

    public TeamResponse toResponse(Team team) {
        List<TeamMemberResponse> memberResponses = team.getMembers().stream()
                .map(m -> new TeamMemberResponse(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getPnr(),
                        m.getUser().getName(),
                        m.getUser().getEmail(),
                        m.getUser().getDepartment(),
                        m.getRole().name(),
                        m.getJoinedAt()
                ))
                .toList();

        return new TeamResponse(
                team.getId(),
                team.getName(),
                team.getAcademicCycle().getId(),
                team.getAcademicCycle().getName(),
                team.getStatus().name(),
                team.getRejectionReason(),
                team.getCreatedBy().getId(),
                team.getCreatedBy().getName(),
                memberResponses,
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }
}

