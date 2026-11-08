package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.AddMemberRequest;
import com.projects.projectmanager.dto.request.CreateTeamRequest;
import com.projects.projectmanager.dto.request.RejectTeamRequest;
import com.projects.projectmanager.dto.response.TeamResponse;
import com.projects.projectmanager.entity.TeamStatus;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(currentUser, request));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<TeamResponse> addMember(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long teamId,
            @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(teamService.addMember(currentUser, teamId, request));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<TeamResponse> removeMember(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(teamService.removeMember(currentUser, teamId, userId));
    }

    @PostMapping("/{teamId}/submit")
    public ResponseEntity<TeamResponse> submitTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.submitTeam(currentUser, teamId));
    }

    @PostMapping("/{teamId}/review")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<TeamResponse> putUnderReview(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.putUnderReview(teamId));
    }

    @PostMapping("/{teamId}/approve")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<TeamResponse> approveTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.approveTeam(teamId));
    }

    @PostMapping("/{teamId}/reject")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<TeamResponse> rejectTeam(
            @PathVariable Long teamId,
            @Valid @RequestBody RejectTeamRequest request) {
        return ResponseEntity.ok(teamService.rejectTeam(teamId, request));
    }

    @PostMapping("/{teamId}/reopen")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<TeamResponse> reopenTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.reopenTeam(teamId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(currentUser, id));
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getTeams(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(required = false) TeamStatus status) {
        return ResponseEntity.ok(teamService.getTeams(currentUser, cycleId, status));
    }

    @GetMapping("/my-team")
    public ResponseEntity<TeamResponse> getMyTeam(
            @AuthenticationPrincipal User currentUser,
            @RequestParam Long cycleId) {
        return ResponseEntity.ok(teamService.getMyTeamForCycle(currentUser, cycleId));
    }
}

