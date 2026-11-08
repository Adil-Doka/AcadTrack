package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    List<Evaluation> findByProjectId(Long projectId);

    List<Evaluation> findByProjectIdAndPublishedTrue(Long projectId);

    Optional<Evaluation> findBySubmissionId(Long submissionId);

    List<Evaluation> findByPhaseId(Long phaseId);
}

