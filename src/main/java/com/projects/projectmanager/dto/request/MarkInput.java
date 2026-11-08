package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record MarkInput(
        @NotNull(message = "Criterion ID is required")
        Long criterionId,

        @DecimalMin(value = "0.0", message = "Marks must be non-negative")
        BigDecimal marksAwarded,

        @Size(max = 1000, message = "Remarks must be at most 1000 characters")
        String remarks
) {}

