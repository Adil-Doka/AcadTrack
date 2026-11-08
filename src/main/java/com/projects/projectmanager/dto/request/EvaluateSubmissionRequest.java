package com.projects.projectmanager.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record EvaluateSubmissionRequest(
        @Valid
        List<MarkInput> marks,

        @Size(max = 2000, message = "General remarks must be at most 2000 characters")
        String generalRemarks
) {}

