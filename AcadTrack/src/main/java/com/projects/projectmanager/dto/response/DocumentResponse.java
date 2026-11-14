package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record DocumentResponse(
        Long id,
        String fileName,
        String contentType,
        Long fileSize,
        Instant uploadedAt
) {}

