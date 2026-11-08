package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.response.AuditLogResponse;
import com.projects.projectmanager.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-logs")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId) {
        if (targetType != null && targetId != null) {
            return ResponseEntity.ok(auditService.getLogsForTarget(targetType, targetId));
        }
        return ResponseEntity.ok(auditService.getAllLogs());
    }
}

