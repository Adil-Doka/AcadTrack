package com.projects.projectmanager.dto.response;

public record UserResponse(
        Long id,
        String pnr,
        String email,
        String name,
        String department,
        Integer year,
        String division,
        String role
) {}

