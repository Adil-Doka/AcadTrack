package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTeamRequest(
        @NotBlank(message = "Team name is required")
        @Size(max = 150, message = "Team name must be at most 150 characters")
        String name,

        @NotNull(message = "Academic cycle ID is required")
        Long cycleId
) {}

