package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.AuditLogResponse;
import com.projects.projectmanager.entity.AuditLog;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog log(User actor, String action, String targetType, Long targetId, String details) {
        AuditLog auditLog = AuditLog.builder()
                .actor(actor)
                .actorPnr(actor != null ? actor.getPnr() : "SYSTEM")
                .actorName(actor != null ? actor.getName() : "System")
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .details(details)
                .build();
        return auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsForTarget(String targetType, Long targetId) {
        return auditLogRepository.findByTargetTypeAndTargetIdOrderByTimestampDesc(targetType, targetId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActor() != null ? log.getActor().getId() : null,
                log.getActorPnr(),
                log.getActorName(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getDetails(),
                log.getTimestamp()
        );
    }
}

