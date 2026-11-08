package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdatePhaseRequest(
        @NotBlank(message = "Phase name is required")
        @Size(max = 150, message = "Phase name must be at most 150 characters")
        String name,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @NotNull(message = "Opening date is required")
        Instant openingDate,

        @NotNull(message = "Deadline is required")
        Instant deadline,

        @Size(max = 500, message = "Required documents description must be at most 500 characters")
        String requiredDocuments,

        @NotNull(message = "Max marks is required")
        @DecimalMin(value = "0.0", message = "Max marks must be non-negative")
        BigDecimal maxMarks,

        Integer sequenceOrder,
        Boolean active,

        @Size(max = 500, message = "Deadline change reason must be at most 500 characters")
        String deadlineChangeReason
) {}

