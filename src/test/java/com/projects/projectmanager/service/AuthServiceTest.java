package com.projects.projectmanager.service;

import com.projects.projectmanager.TestDatabaseCleaner;
import com.projects.projectmanager.dto.request.LoginRequest;
import com.projects.projectmanager.dto.request.RegisterRequest;
import com.projects.projectmanager.dto.response.AuthResponse;
import com.projects.projectmanager.entity.Role;
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
class AuthServiceTest {

    @Autowired private AuthService authService;
    @Autowired private UserRepository userRepository;
    @Autowired private TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.clean();
    }

    private RegisterRequest validRegisterRequest() {
        return new RegisterRequest("PNR001", "test@example.com", "password123",
                "Test User", "CS", 3, "A");
    }

    @Test
    void register_success() {
        AuthResponse response = authService.register(validRegisterRequest());

        assertNotNull(response.token());
        assertEquals("PNR001", response.pnr());
        assertEquals("Test User", response.name());
        assertEquals("STUDENT", response.role());
        assertTrue(userRepository.existsByPnr("PNR001"));
    }

    @Test
    void register_duplicatePnr_throwsConflict() {
        authService.register(validRegisterRequest());

        var duplicate = new RegisterRequest("PNR001", "other@example.com", "password123",
                "Other User", "CS", 3, "A");

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(duplicate));
        assertEquals("PNR_EXISTS", ex.getCode());
        assertEquals(409, ex.getStatus().value());
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        authService.register(validRegisterRequest());

        var duplicate = new RegisterRequest("PNR002", "test@example.com", "password123",
                "Other User", "CS", 3, "A");

        ApiException ex = assertThrows(ApiException.class, () -> authService.register(duplicate));
        assertEquals("EMAIL_EXISTS", ex.getCode());
    }

    @Test
    void register_alwaysAssignsStudentRole() {
        AuthResponse response = authService.register(validRegisterRequest());
        assertEquals("STUDENT", response.role());

        var user = userRepository.findByPnr("PNR001").orElseThrow();
        assertEquals(Role.STUDENT, user.getRole());
    }

    @Test
    void register_passwordIsHashed() {
        authService.register(validRegisterRequest());
        var user = userRepository.findByPnr("PNR001").orElseThrow();
        assertNotEquals("password123", user.getPassword());
        assertTrue(user.getPassword().startsWith("$2"));
    }

    @Test
    void login_success() {
        authService.register(validRegisterRequest());

        AuthResponse response = authService.login(new LoginRequest("PNR001", "password123"));

        assertNotNull(response.token());
        assertEquals("PNR001", response.pnr());
        assertEquals("STUDENT", response.role());
    }

    @Test
    void login_wrongPnr_throwsUnauthorized() {
        authService.register(validRegisterRequest());

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("WRONG", "password123")));
        assertEquals("BAD_CREDENTIALS", ex.getCode());
        assertEquals(401, ex.getStatus().value());
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        authService.register(validRegisterRequest());

        ApiException ex = assertThrows(ApiException.class,
                () -> authService.login(new LoginRequest("PNR001", "wrongpass")));
        assertEquals("BAD_CREDENTIALS", ex.getCode());
    }
}
