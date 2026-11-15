package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(
        @NotBlank(message = "Student PNR is required")
        String pnr
) {}

