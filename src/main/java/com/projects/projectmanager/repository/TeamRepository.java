package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Team;
import com.projects.projectmanager.entity.TeamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByAcademicCycleId(Long academicCycleId);

    List<Team> findByStatus(TeamStatus status);

    List<Team> findByAcademicCycleIdAndStatus(Long academicCycleId, TeamStatus status);

    @Query("SELECT tm.team FROM TeamMember tm WHERE tm.user.id = :userId AND tm.academicCycle.id = :cycleId")
    Optional<Team> findByUserIdAndAcademicCycleId(@Param("userId") Long userId, @Param("cycleId") Long cycleId);

    @Query("SELECT tm.team FROM TeamMember tm WHERE tm.user.id = :userId")
    List<Team> findAllByUserId(@Param("userId") Long userId);
}

