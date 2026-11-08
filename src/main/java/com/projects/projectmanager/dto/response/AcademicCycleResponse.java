package com.projects.projectmanager.dto.response;

import java.time.Instant;
import java.time.LocalDate;

public record AcademicCycleResponse(
        Long id,
        String name,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {}

