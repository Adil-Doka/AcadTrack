package com.projects.projectmanager.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record EvaluationResponse(
        Long id,
        Long submissionId,
        Long projectId,
        String projectTitle,
        Long phaseId,
        String phaseName,
        Long evaluatorId,
        String evaluatorName,
        BigDecimal totalMarks,
        BigDecimal phaseMaxMarks,
        String generalRemarks,
        boolean published,
        Instant publishedAt,
        List<EvaluationMarkResponse> marks,
        Instant evaluatedAt,
        Instant createdAt,
        Instant updatedAt
) {}

