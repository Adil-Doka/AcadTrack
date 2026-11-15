package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record ProjectResponse(
        Long id,
        Long teamId,
        String teamName,
        Long cycleId,
        String cycleName,
        String title,
        String description,
        String domain,
        String githubRepoUrl,
        String status,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {}

