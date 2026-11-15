package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findBySubmissionId(Long submissionId);
}

