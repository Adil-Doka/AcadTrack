package com.projects.projectmanager.service;

import com.projects.projectmanager.TestDatabaseCleaner;
import com.projects.projectmanager.dto.request.CreateCoordinatorRequest;
import com.projects.projectmanager.dto.response.UserResponse;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class CoordinatorProvisioningServiceTest {

    @Autowired private CoordinatorProvisioningService coordinatorService;
    @Autowired private UserRepository userRepository;
    @Autowired private TestDatabaseCleaner cleaner;

    private User adminCoordinator;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        adminCoordinator = userRepository.save(User.builder()
                .pnr("MAIN_COORD")
                .email("main@coord.edu")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Main Coordinator")
                .role(Role.COORDINATOR)
                .build());
    }

    @Test
    void provisionCoordinator_success() {
        var req = new CreateCoordinatorRequest(
                "COORD002",
                "newcoord@university.edu",
                "securePassword123",
                "Dr. John Doe",
                "Information Technology"
        );

        UserResponse res = coordinatorService.provisionCoordinator(adminCoordinator, req);

        assertNotNull(res.id());
        assertEquals("COORD002", res.pnr());
        assertEquals("newcoord@university.edu", res.email());
        assertEquals("COORDINATOR", res.role());

        User saved = userRepository.findByPnr("COORD002").orElseThrow();
        assertEquals(Role.COORDINATOR, saved.getRole());
        assertTrue(saved.getPassword().startsWith("$2"));
    }

    @Test
    void provisionCoordinator_duplicatePnr_throwsConflict() {
        var req = new CreateCoordinatorRequest(
                "MAIN_COORD", // already exists
                "other@coord.edu",
                "securePassword123",
                "Duplicate",
                "IT"
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> coordinatorService.provisionCoordinator(adminCoordinator, req));
        assertEquals("PNR_EXISTS", ex.getCode());
        assertEquals(409, ex.getStatus().value());
    }

    @Test
    void provisionCoordinator_duplicateEmail_throwsConflict() {
        var req = new CreateCoordinatorRequest(
                "COORD999",
                "main@coord.edu", // email already exists
                "securePassword123",
                "Duplicate",
                "IT"
        );

        ApiException ex = assertThrows(ApiException.class,
                () -> coordinatorService.provisionCoordinator(adminCoordinator, req));
        assertEquals("EMAIL_EXISTS", ex.getCode());
    }
}

