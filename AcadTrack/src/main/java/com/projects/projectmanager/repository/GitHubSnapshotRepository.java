package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.GitHubSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GitHubSnapshotRepository extends JpaRepository<GitHubSnapshot, Long> {
    List<GitHubSnapshot> findByProjectIdOrderByFetchedAtDesc(Long projectId);
    Optional<GitHubSnapshot> findFirstByProjectIdOrderByFetchedAtDesc(Long projectId);
}

