package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        Long actorId,
        String actorPnr,
        String actorName,
        String action,
        String targetType,
        Long targetId,
        String details,
        Instant timestamp
) {}

