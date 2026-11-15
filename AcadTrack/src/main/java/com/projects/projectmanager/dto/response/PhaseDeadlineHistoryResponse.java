package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record PhaseDeadlineHistoryResponse(
        Long id,
        Long phaseId,
        Instant previousDeadline,
        Instant newDeadline,
        Long changedById,
        String changedByName,
        String reason,
        Instant changedAt
) {}

