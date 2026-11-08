package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.CreateCriterionRequest;
import com.projects.projectmanager.dto.request.EvaluateSubmissionRequest;
import com.projects.projectmanager.dto.response.CriterionResponse;
import com.projects.projectmanager.dto.response.EvaluationResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.EvaluationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @PostMapping("/phases/{phaseId}/criteria")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<CriterionResponse> createCriterion(
            @PathVariable Long phaseId,
            @Valid @RequestBody CreateCriterionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationService.createCriterion(phaseId, request));
    }

    @GetMapping("/phases/{phaseId}/criteria")
    public ResponseEntity<List<CriterionResponse>> getCriteria(@PathVariable Long phaseId) {
        return ResponseEntity.ok(evaluationService.getCriteria(phaseId));
    }

    @PostMapping("/submissions/{submissionId}/evaluate")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<EvaluationResponse> evaluateSubmission(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long submissionId,
            @Valid @RequestBody EvaluateSubmissionRequest request) {
        return ResponseEntity.ok(evaluationService.evaluateSubmission(currentUser, submissionId, request));
    }

    @PostMapping("/evaluations/{evaluationId}/publish")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<EvaluationResponse> publishEvaluation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long evaluationId) {
        return ResponseEntity.ok(evaluationService.publishEvaluation(currentUser, evaluationId));
    }

    @GetMapping("/evaluations/{evaluationId}")
    public ResponseEntity<EvaluationResponse> getEvaluation(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long evaluationId) {
        return ResponseEntity.ok(evaluationService.getEvaluation(currentUser, evaluationId));
    }

    @GetMapping("/projects/{projectId}/evaluations")
    public ResponseEntity<List<EvaluationResponse>> getEvaluationsForProject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(evaluationService.getEvaluationsForProject(currentUser, projectId));
    }
}

