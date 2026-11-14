-- V2: Teams and team members
CREATE TABLE teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    academic_cycle_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    rejection_reason VARCHAR(1000),
    created_by_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_team_cycle FOREIGN KEY (academic_cycle_id) REFERENCES academic_cycles(id),
    CONSTRAINT fk_team_creator FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE team_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    academic_cycle_id BIGINT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_tm_cycle FOREIGN KEY (academic_cycle_id) REFERENCES academic_cycles(id),
    CONSTRAINT uk_tm_team_user UNIQUE (team_id, user_id),
    CONSTRAINT uk_tm_cycle_user UNIQUE (academic_cycle_id, user_id)
);

