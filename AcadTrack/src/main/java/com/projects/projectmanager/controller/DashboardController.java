package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.response.CoordinatorDashboardResponse;
import com.projects.projectmanager.dto.response.StudentDashboardResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/student")
    public ResponseEntity<StudentDashboardResponse> getStudentDashboard(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long cycleId) {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(currentUser, cycleId));
    }

    @GetMapping("/coordinator")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<CoordinatorDashboardResponse> getCoordinatorDashboard(
            @RequestParam(required = false) Long cycleId) {
        return ResponseEntity.ok(dashboardService.getCoordinatorDashboard(cycleId));
    }
}

