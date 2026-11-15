package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.EvaluationCriterion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationCriterionRepository extends JpaRepository<EvaluationCriterion, Long> {
    List<EvaluationCriterion> findByPhaseId(Long phaseId);
}

