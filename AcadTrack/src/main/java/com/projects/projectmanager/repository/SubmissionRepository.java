package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByProjectIdAndPhaseIdOrderByVersionDesc(Long projectId, Long phaseId);

    Optional<Submission> findFirstByProjectIdAndPhaseIdOrderByVersionDesc(Long projectId, Long phaseId);

    @Query("SELECT COALESCE(MAX(s.version), 0) FROM Submission s WHERE s.project.id = :projectId AND s.phase.id = :phaseId")
    int findMaxVersion(@Param("projectId") Long projectId, @Param("phaseId") Long phaseId);

    List<Submission> findByProjectId(Long projectId);
}

