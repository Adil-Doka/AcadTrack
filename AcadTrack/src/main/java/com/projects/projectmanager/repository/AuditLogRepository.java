package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTargetTypeAndTargetIdOrderByTimestampDesc(String targetType, Long targetId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}

