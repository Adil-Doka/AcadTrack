package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank(message = "PNR is required")
        @Size(max = 50, message = "PNR must be at most 50 characters")
        String pnr,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @NotBlank(message = "Name is required")
        String name,

        String department,
        Integer year,
        String division
) {}

