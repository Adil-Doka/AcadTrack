package com.projects.projectmanager.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PhaseResponse(
        Long id,
        Long cycleId,
        String cycleName,
        String name,
        String description,
        Instant openingDate,
        Instant deadline,
        String requiredDocuments,
        BigDecimal maxMarks,
        Integer sequenceOrder,
        boolean active,
        boolean open,
        Instant createdAt,
        Instant updatedAt
) {}

