-- V4: Phases, deadline history, submissions and documents
CREATE TABLE phases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    academic_cycle_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(2000),
    opening_date TIMESTAMP NOT NULL,
    deadline TIMESTAMP NOT NULL,
    required_documents VARCHAR(500),
    max_marks DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    sequence_order INT NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_phase_cycle FOREIGN KEY (academic_cycle_id) REFERENCES academic_cycles(id)
);

CREATE TABLE phase_deadline_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phase_id BIGINT NOT NULL,
    previous_deadline TIMESTAMP NOT NULL,
    new_deadline TIMESTAMP NOT NULL,
    changed_by_id BIGINT NOT NULL,
    reason VARCHAR(500),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pdh_phase FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    CONSTRAINT fk_pdh_user FOREIGN KEY (changed_by_id) REFERENCES users(id)
);

CREATE TABLE submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    phase_id BIGINT NOT NULL,
    submitted_by_id BIGINT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    notes VARCHAR(2000),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_phase FOREIGN KEY (phase_id) REFERENCES phases(id),
    CONSTRAINT fk_sub_user FOREIGN KEY (submitted_by_id) REFERENCES users(id)
);

CREATE TABLE documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);

