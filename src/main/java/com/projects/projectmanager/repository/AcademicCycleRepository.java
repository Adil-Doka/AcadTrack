package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.AcademicCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicCycleRepository extends JpaRepository<AcademicCycle, Long> {
    List<AcademicCycle> findByActiveTrue();
    Optional<AcademicCycle> findByName(String name);
    boolean existsByName(String name);
}

