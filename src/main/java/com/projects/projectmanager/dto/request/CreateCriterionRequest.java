package com.projects.projectmanager.dto.request;

import com.projects.projectmanager.entity.CriterionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateCriterionRequest(
        @NotBlank(message = "Criterion name is required")
        @Size(max = 150, message = "Name must be at most 150 characters")
        String name,

        @NotNull(message = "Max marks is required")
        @DecimalMin(value = "0.0", message = "Max marks must be non-negative")
        BigDecimal maxMarks,

        CriterionType criterionType,

        @Size(max = 500, message = "Description must be at most 500 characters")
        String description
) {}

