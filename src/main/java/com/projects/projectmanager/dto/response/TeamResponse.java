package com.projects.projectmanager.dto.response;

import java.time.Instant;
import java.util.List;

public record TeamResponse(
        Long id,
        String name,
        Long cycleId,
        String cycleName,
        String status,
        String rejectionReason,
        Long createdById,
        String createdByName,
        List<TeamMemberResponse> members,
        Instant createdAt,
        Instant updatedAt
) {}

