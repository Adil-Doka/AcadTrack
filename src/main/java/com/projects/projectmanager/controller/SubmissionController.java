package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.response.SubmissionResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.SubmissionService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping(value = "/phases/{phaseId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SubmissionResponse> submitDeliverable(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long phaseId,
            @RequestParam Long projectId,
            @RequestParam(required = false) String notes,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submissionService.submit(currentUser, phaseId, projectId, notes, files));
    }

    @GetMapping("/phases/{phaseId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> getSubmissionHistory(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long phaseId,
            @RequestParam Long projectId) {
        return ResponseEntity.ok(submissionService.getSubmissionHistory(currentUser, projectId, phaseId));
    }

    @GetMapping("/submissions/{submissionId}")
    public ResponseEntity<SubmissionResponse> getSubmission(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long submissionId) {
        return ResponseEntity.ok(submissionService.getSubmission(currentUser, submissionId));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long documentId) {
        SubmissionService.DocumentDownload download = submissionService.loadDocument(currentUser, documentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.filename() + "\"")
                .body(download.resource());
    }
}

