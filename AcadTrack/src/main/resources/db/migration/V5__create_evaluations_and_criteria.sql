-- V5: Evaluation criteria, evaluations and marks
CREATE TABLE evaluation_criteria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phase_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL,
    criterion_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    description VARCHAR(500),
    CONSTRAINT fk_ec_phase FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);

CREATE TABLE evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    phase_id BIGINT NOT NULL,
    evaluator_id BIGINT NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    general_remarks VARCHAR(2000),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    published_by_id BIGINT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_submission FOREIGN KEY (submission_id) REFERENCES submissions(id),
    CONSTRAINT fk_eval_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_phase FOREIGN KEY (phase_id) REFERENCES phases(id),
    CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id),
    CONSTRAINT fk_eval_published_by FOREIGN KEY (published_by_id) REFERENCES users(id)
);

CREATE TABLE evaluation_marks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id BIGINT NOT NULL,
    criterion_id BIGINT NOT NULL,
    marks_awarded DECIMAL(5, 2) NOT NULL,
    remarks VARCHAR(1000),
    CONSTRAINT fk_em_eval FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE,
    CONSTRAINT fk_em_criterion FOREIGN KEY (criterion_id) REFERENCES evaluation_criteria(id)
);

