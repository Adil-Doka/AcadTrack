package com.projects.projectmanager.controller;

import com.projects.projectmanager.dto.request.CreateCoordinatorRequest;
import com.projects.projectmanager.dto.response.UserResponse;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.service.CoordinatorProvisioningService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final CoordinatorProvisioningService coordinatorService;

    public AdminController(CoordinatorProvisioningService coordinatorService) {
        this.coordinatorService = coordinatorService;
    }

    @PostMapping("/coordinators")
    @PreAuthorize("hasRole('COORDINATOR')")
    public ResponseEntity<UserResponse> provisionCoordinator(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateCoordinatorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(coordinatorService.provisionCoordinator(currentUser, request));
    }
}

