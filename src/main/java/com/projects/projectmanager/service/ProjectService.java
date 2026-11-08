package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateProjectRequest;
import com.projects.projectmanager.dto.request.RejectProjectRequest;
import com.projects.projectmanager.dto.request.UpdateProjectRequest;
import com.projects.projectmanager.dto.response.ProjectResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.ProjectRepository;
import com.projects.projectmanager.repository.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository,
                          TeamRepository teamRepository,
                          AuditService auditService,
                          NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.teamRepository = teamRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ProjectResponse registerProject(User currentUser, CreateProjectRequest request) {
        Team team = teamRepository.findById(request.teamId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TEAM_NOT_FOUND",
                        "Team not found with id: " + request.teamId()));

        assertTeamLeader(currentUser, team);

        if (team.getStatus() != TeamStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TEAM_NOT_APPROVED",
                    "Only approved teams can register a project");
        }

        if (projectRepository.existsByTeamId(team.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "PROJECT_EXISTS",
                    "A project has already been registered for this team");
        }

        Project project = Project.builder()
                .team(team)
                .academicCycle(team.getAcademicCycle())
                .title(request.title())
                .description(request.description())
                .domain(request.domain())
                .githubRepoUrl(request.githubRepoUrl())
                .status(ProjectStatus.DRAFT)
                .build();

        project = projectRepository.save(project);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(User currentUser, Long projectId, UpdateProjectRequest request) {
        Project project = getProjectOrThrow(projectId);
        assertTeamLeader(currentUser, project.getTeam());

        if (project.getStatus() != ProjectStatus.DRAFT && project.getStatus() != ProjectStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PROJECT_LOCKED",
                    "Project cannot be updated in " + project.getStatus() + " status");
        }

        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setDomain(request.domain());
        project.setGithubRepoUrl(request.githubRepoUrl());

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse submitProject(User currentUser, Long projectId) {
        Project project = getProjectOrThrow(projectId);
        assertTeamLeader(currentUser, project.getTeam());

        if (project.getStatus() != ProjectStatus.DRAFT && project.getStatus() != ProjectStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only DRAFT or REJECTED projects can be submitted");
        }

        project.setStatus(ProjectStatus.SUBMITTED);
        project.setRejectionReason(null);
        project = projectRepository.save(project);

        auditService.log(currentUser, "PROJECT_SUBMITTED", "PROJECT", project.getId(), "Project submitted for coordinator review");
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse putUnderReview(Long projectId) {
        Project project = getProjectOrThrow(projectId);
        if (project.getStatus() != ProjectStatus.SUBMITTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED projects can be moved to UNDER_REVIEW");
        }
        project.setStatus(ProjectStatus.UNDER_REVIEW);
        project = projectRepository.save(project);
        auditService.log(null, "PROJECT_UNDER_REVIEW", "PROJECT", project.getId(), "Project moved to under review");
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse approveProject(Long projectId) {
        Project project = getProjectOrThrow(projectId);
        if (project.getStatus() != ProjectStatus.SUBMITTED && project.getStatus() != ProjectStatus.UNDER_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED or UNDER_REVIEW projects can be approved");
        }
        project.setStatus(ProjectStatus.APPROVED);
        project.setRejectionReason(null);
        project = projectRepository.save(project);

        auditService.log(null, "PROJECT_APPROVED", "PROJECT", project.getId(), "Project approved by coordinator");
        for (TeamMember m : project.getTeam().getMembers()) {
            notificationService.notify(m.getUser(), "PROJECT_DECISION", "Project Approved",
                    "Your project '" + project.getTitle() + "' has been approved by the coordinator", "/projects/" + project.getId());
        }
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse rejectProject(Long projectId, RejectProjectRequest request) {
        Project project = getProjectOrThrow(projectId);
        if (project.getStatus() != ProjectStatus.SUBMITTED && project.getStatus() != ProjectStatus.UNDER_REVIEW) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_STATE_TRANSITION",
                    "Only SUBMITTED or UNDER_REVIEW projects can be rejected");
        }
        project.setStatus(ProjectStatus.REJECTED);
        project.setRejectionReason(request.reason());
        project = projectRepository.save(project);

        auditService.log(null, "PROJECT_REJECTED", "PROJECT", project.getId(), "Project rejected: " + request.reason());
        for (TeamMember m : project.getTeam().getMembers()) {
            notificationService.notify(m.getUser(), "PROJECT_DECISION", "Project Rejected",
                    "Your project '" + project.getTitle() + "' was rejected. Reason: " + request.reason(), "/projects/" + project.getId());
        }
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(User currentUser, Long projectId) {
        Project project = getProjectOrThrow(projectId);
        assertCanViewProject(currentUser, project);
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectByTeam(User currentUser, Long teamId) {
        Project project = projectRepository.findByTeamId(teamId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "No project found for team id: " + teamId));
        assertCanViewProject(currentUser, project);
        return toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(User currentUser, Long cycleId, ProjectStatus status) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            List<Project> list;
            if (cycleId != null && status != null) {
                list = projectRepository.findByAcademicCycleIdAndStatus(cycleId, status);
            } else if (cycleId != null) {
                list = projectRepository.findByAcademicCycleId(cycleId);
            } else if (status != null) {
                list = projectRepository.findByStatus(status);
            } else {
                list = projectRepository.findAll();
            }
            return list.stream().map(this::toResponse).toList();
        } else {
            return projectRepository.findAllByUserId(currentUser.getId()).stream()
                    .filter(p -> cycleId == null || p.getAcademicCycle().getId().equals(cycleId))
                    .filter(p -> status == null || p.getStatus() == status)
                    .map(this::toResponse)
                    .toList();
        }
    }

    private Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "Project not found with id: " + projectId));
    }

    private void assertTeamLeader(User currentUser, Team team) {
        boolean isLeader = team.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()) && m.getRole() == TeamRole.LEADER);
        if (!isLeader) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_TEAM_LEADER",
                    "Only the team leader can perform this operation on the project");
        }
    }

    private void assertCanViewProject(User currentUser, Project project) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            return;
        }
        boolean isMember = project.getTeam().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have permission to view this project");
        }
    }

    public ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getTeam().getId(),
                project.getTeam().getName(),
                project.getAcademicCycle().getId(),
                project.getAcademicCycle().getName(),
                project.getTitle(),
                project.getDescription(),
                project.getDomain(),
                project.getGithubRepoUrl(),
                project.getStatus().name(),
                project.getRejectionReason(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}

