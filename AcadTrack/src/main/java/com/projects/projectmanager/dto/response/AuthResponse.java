package com.projects.projectmanager.dto.response;

public record AuthResponse(
        String token,
        String pnr,
        String name,
        String email,
        String role
) {}

