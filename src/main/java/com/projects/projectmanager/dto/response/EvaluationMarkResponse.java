package com.projects.projectmanager.dto.response;

import java.math.BigDecimal;

public record EvaluationMarkResponse(
        Long id,
        Long criterionId,
        String criterionName,
        String criterionType,
        BigDecimal maxMarks,
        BigDecimal marksAwarded,
        String remarks
) {}

