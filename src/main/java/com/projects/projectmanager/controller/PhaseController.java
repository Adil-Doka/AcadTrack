package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.CreatePhaseRequest;
import com.projects.projectmanager.dto.request.UpdatePhaseRequest;
import com.projects.projectmanager.dto.response.PhaseDeadlineHistoryResponse;
import com.projects.projectmanager.dto.response.PhaseResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.PhaseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/phases")
public class PhaseController {

    private final PhaseService phaseService;

    public PhaseController(PhaseService phaseService) {
        this.phaseService = phaseService;
    }

    @PostMapping
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<PhaseResponse> createPhase(@Valid @RequestBody CreatePhaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(phaseService.createPhase(request));
    }

    @PutMapping("/{phaseId}")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<PhaseResponse> updatePhase(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long phaseId,
            @Valid @RequestBody UpdatePhaseRequest request) {
        return ResponseEntity.ok(phaseService.updatePhase(currentUser, phaseId, request));
    }

    @GetMapping("/{phaseId}")
    public ResponseEntity<PhaseResponse> getPhase(@PathVariable Long phaseId) {
        return ResponseEntity.ok(phaseService.getPhase(phaseId));
    }

    @GetMapping
    public ResponseEntity<List<PhaseResponse>> getPhasesByCycle(@RequestParam Long cycleId) {
        return ResponseEntity.ok(phaseService.getPhasesByCycle(cycleId));
    }

    @GetMapping("/{phaseId}/deadline-history")
    public ResponseEntity<List<PhaseDeadlineHistoryResponse>> getDeadlineHistory(@PathVariable Long phaseId) {
        return ResponseEntity.ok(phaseService.getDeadlineHistory(phaseId));
    }
}

