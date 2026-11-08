package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.PhaseDeadlineHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseDeadlineHistoryRepository extends JpaRepository<PhaseDeadlineHistory, Long> {
    List<PhaseDeadlineHistory> findByPhaseIdOrderByChangedAtDesc(Long phaseId);
}

