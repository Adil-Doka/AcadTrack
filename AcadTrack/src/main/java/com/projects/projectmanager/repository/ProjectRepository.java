package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Project;
import com.projects.projectmanager.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByTeamId(Long teamId);

    boolean existsByTeamId(Long teamId);

    List<Project> findByAcademicCycleId(Long cycleId);

    List<Project> findByAcademicCycleIdAndStatus(Long cycleId, ProjectStatus status);

    List<Project> findByStatus(ProjectStatus status);

    @Query("SELECT p FROM Project p JOIN p.team.members m WHERE m.user.id = :userId")
    List<Project> findAllByUserId(@Param("userId") Long userId);
}

