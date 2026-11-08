package com.projects.projectmanager.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String code,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp
) {
    public ApiError(int status, String code, String message) {
        this(status, code, message, null, Instant.now());
    }

    public ApiError(int status, String code, String message, Map<String, String> fieldErrors) {
        this(status, code, message, fieldErrors, Instant.now());
    }
}

