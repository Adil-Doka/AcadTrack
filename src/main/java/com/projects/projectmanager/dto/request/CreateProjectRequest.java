package com.projects.projectmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotNull(message = "Team ID is required")
        Long teamId,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @Size(max = 100, message = "Domain must be at most 100 characters")
        String domain,

        @Size(max = 255, message = "GitHub repo URL must be at most 255 characters")
        String githubRepoUrl
) {}

