package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record TeamMemberResponse(
        Long id,
        Long userId,
        String pnr,
        String name,
        String email,
        String department,
        String role,
        Instant joinedAt
) {}

