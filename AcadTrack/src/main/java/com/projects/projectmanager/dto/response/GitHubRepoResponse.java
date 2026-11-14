package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record GitHubRepoResponse(
        Long snapshotId,
        Long projectId,
        String repoUrl,
        String owner,
        String repo,
        String primaryLanguage,
        int starsCount,
        int forksCount,
        int openIssuesCount,
        int commitCount,
        int branchesCount,
        int pullRequestsCount,
        Instant latestActivityAt,
        String status,
        String errorMessage,
        boolean stale,
        Instant fetchedAt,
        String contributorsJson,
        String recentCommitsJson
) {}

