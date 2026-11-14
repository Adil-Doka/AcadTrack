package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.response.GitHubRepoResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.GitHubService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/github")
public class GitHubController {

    private final GitHubService gitHubService;

    public GitHubController(GitHubService gitHubService) {
        this.gitHubService = gitHubService;
    }

    @GetMapping
    public ResponseEntity<GitHubRepoResponse> getGitHubData(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(gitHubService.getLatestSnapshot(currentUser, projectId));
    }

    @PostMapping("/refresh")
    public ResponseEntity<GitHubRepoResponse> refreshGitHubData(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(gitHubService.refreshRepoData(currentUser, projectId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<GitHubRepoResponse>> getGitHubHistory(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(gitHubService.getSnapshotHistory(currentUser, projectId));
    }
}

