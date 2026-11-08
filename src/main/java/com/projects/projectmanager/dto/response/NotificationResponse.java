package com.projects.projectmanager.dto.response;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        boolean read,
        String type,
        String link,
        Instant createdAt
) {}

