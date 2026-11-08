package com.projects.projectmanager.dto.response;

import java.time.Instant;
import java.util.List;

public record SubmissionResponse(
        Long id,
        Long projectId,
        String projectTitle,
        Long phaseId,
        String phaseName,
        Long submittedById,
        String submittedByName,
        Integer version,
        Instant submittedAt,
        boolean late,
        String notes,
        String status,
        List<DocumentResponse> documents,
        Instant createdAt
) {}

