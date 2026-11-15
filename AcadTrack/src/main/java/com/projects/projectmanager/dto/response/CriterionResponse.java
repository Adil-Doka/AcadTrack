package com.projects.projectmanager.dto.response;

import java.math.BigDecimal;

public record CriterionResponse(
        Long id,
        Long phaseId,
        String name,
        BigDecimal maxMarks,
        String criterionType,
        String description
) {}

