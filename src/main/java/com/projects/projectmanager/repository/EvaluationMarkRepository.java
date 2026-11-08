package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.EvaluationMark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationMarkRepository extends JpaRepository<EvaluationMark, Long> {
    List<EvaluationMark> findByEvaluationId(Long evaluationId);
}

