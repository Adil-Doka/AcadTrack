package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.CreateProjectRequest;
import com.projects.projectmanager.dto.request.RejectProjectRequest;
import com.projects.projectmanager.dto.request.UpdateProjectRequest;
import com.projects.projectmanager.dto.response.ProjectResponse;
import com.projects.projectmanager.entity.ProjectStatus;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> registerProject(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.registerProject(currentUser, request));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(currentUser, projectId, request));
    }

    @PostMapping("/{projectId}/submit")
    public ResponseEntity<ProjectResponse> submitProject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.submitProject(currentUser, projectId));
    }

    @PostMapping("/{projectId}/review")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ProjectResponse> putUnderReview(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.putUnderReview(projectId));
    }

    @PostMapping("/{projectId}/approve")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ProjectResponse> approveProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.approveProject(projectId));
    }

    @PostMapping("/{projectId}/reject")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<ProjectResponse> rejectProject(
            @PathVariable Long projectId,
            @Valid @RequestBody RejectProjectRequest request) {
        return ResponseEntity.ok(projectService.rejectProject(projectId, request));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProject(currentUser, projectId));
    }

    @GetMapping("/by-team/{teamId}")
    public ResponseEntity<ProjectResponse> getProjectByTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long teamId) {
        return ResponseEntity.ok(projectService.getProjectByTeam(currentUser, teamId));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) ProjectStatus status) {
        return ResponseEntity.ok(projectService.getProjects(currentUser, cycleId, status));
    }
}

