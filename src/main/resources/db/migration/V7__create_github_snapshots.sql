-- V7: GitHub snapshots table
CREATE TABLE github_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    repo_url VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    repo_name VARCHAR(100) NOT NULL,
    primary_language VARCHAR(50),
    stars_count INT DEFAULT 0,
    forks_count INT DEFAULT 0,
    open_issues_count INT DEFAULT 0,
    commit_count INT DEFAULT 0,
    branches_count INT DEFAULT 0,
    pull_requests_count INT DEFAULT 0,
    latest_activity_at TIMESTAMP NULL,
    contributors_json VARCHAR(4000),
    recent_commits_json VARCHAR(4000),
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    error_message VARCHAR(1000),
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gh_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

