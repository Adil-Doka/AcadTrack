package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.CreateAcademicCycleRequest;
import com.projects.projectmanager.dto.request.UpdateAcademicCycleRequest;
import com.projects.projectmanager.dto.response.AcademicCycleResponse;
import com.projects.projectmanager.service.AcademicCycleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academic-cycles")
public class AcademicCycleController {

    private final AcademicCycleService cycleService;

    public AcademicCycleController(AcademicCycleService cycleService) {
        this.cycleService = cycleService;
    }

    @PostMapping
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<AcademicCycleResponse> createCycle(@Valid @RequestBody CreateAcademicCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cycleService.createCycle(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<AcademicCycleResponse> updateCycle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAcademicCycleRequest request) {
        return ResponseEntity.ok(cycleService.updateCycle(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicCycleResponse> getCycle(@PathVariable Long id) {
        return ResponseEntity.ok(cycleService.getCycle(id));
    }

    @GetMapping
    public ResponseEntity<List<AcademicCycleResponse>> getAllCycles() {
        return ResponseEntity.ok(cycleService.getAllCycles());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AcademicCycleResponse>> getActiveCycles() {
        return ResponseEntity.ok(cycleService.getActiveCycles());
    }
}

