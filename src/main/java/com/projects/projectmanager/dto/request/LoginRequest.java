package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "PNR is required")
        String pnr,

        @NotBlank(message = "Password is required")
        String password
) {}

