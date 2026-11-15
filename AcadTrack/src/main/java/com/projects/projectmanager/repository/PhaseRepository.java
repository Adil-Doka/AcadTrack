package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Phase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {
    List<Phase> findByAcademicCycleIdOrderBySequenceOrderAsc(Long cycleId);
    List<Phase> findByAcademicCycleIdAndActiveTrueOrderBySequenceOrderAsc(Long cycleId);
}

