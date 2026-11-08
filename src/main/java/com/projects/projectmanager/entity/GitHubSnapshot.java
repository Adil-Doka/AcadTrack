package com.projects.projectmanager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "github_snapshots")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GitHubSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "repo_url", nullable = false, length = 255)
    private String repoUrl;

    @Column(name = "owner_name", nullable = false, length = 100)
    private String ownerName;

    @Column(name = "repo_name", nullable = false, length = 100)
    private String repoName;

    @Column(name = "primary_language", length = 50)
    private String primaryLanguage;

    @Column(name = "stars_count")
    @Builder.Default
    private Integer starsCount = 0;

    @Column(name = "forks_count")
    @Builder.Default
    private Integer forksCount = 0;

    @Column(name = "open_issues_count")
    @Builder.Default
    private Integer openIssuesCount = 0;

    @Column(name = "commit_count")
    @Builder.Default
    private Integer commitCount = 0;

    @Column(name = "branches_count")
    @Builder.Default
    private Integer branchesCount = 0;

    @Column(name = "pull_requests_count")
    @Builder.Default
    private Integer pullRequestsCount = 0;

    @Column(name = "latest_activity_at")
    private Instant latestActivityAt;

    @Column(name = "contributors_json", length = 4000)
    private String contributorsJson;

    @Column(name = "recent_commits_json", length = 4000)
    private String recentCommitsJson;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "SUCCESS";

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "is_stale", nullable = false)
    @Builder.Default
    private boolean stale = false;

    @Column(name = "fetched_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant fetchedAt = Instant.now();
}

