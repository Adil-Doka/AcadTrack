-- V3: Projects table
CREATE TABLE projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL UNIQUE,
    academic_cycle_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    domain VARCHAR(100),
    github_repo_url VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    rejection_reason VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_cycle FOREIGN KEY (academic_cycle_id) REFERENCES academic_cycles(id)
);

