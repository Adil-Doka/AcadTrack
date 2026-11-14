package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreatePhaseRequest;
import com.projects.projectmanager.dto.request.UpdatePhaseRequest;
import com.projects.projectmanager.dto.response.PhaseDeadlineHistoryResponse;
import com.projects.projectmanager.dto.response.PhaseResponse;
import com.projects.projectmanager.entity.AcademicCycle;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class PhaseServiceTest {

    @Autowired private PhaseService phaseService;
    @Autowired private PhaseRepository phaseRepository;
    @Autowired private PhaseDeadlineHistoryRepository deadlineHistoryRepository;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    private AcademicCycle cycle;
    private User coordinator;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        cycle = cycleRepository.save(AcademicCycle.builder()
                .name("Cycle 2026")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(6))
                .active(true)
                .build());

        coordinator = userRepository.save(User.builder()
                .pnr("COORD001")
                .email("coord@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Coordinator")
                .role(Role.COORDINATOR)
                .build());
    }

    private CreatePhaseRequest validCreateRequest(String name) {
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        return new CreatePhaseRequest(
                cycle.getId(),
                name,
                "Phase description",
                now.minus(1, ChronoUnit.DAYS),
                now.plus(14, ChronoUnit.DAYS),
                "PDF Report",
                new BigDecimal("50.00"),
                1,
                true
        );
    }

    @Test
    void createPhase_success() {
        PhaseResponse res = phaseService.createPhase(validCreateRequest("Synopsis Review"));

        assertNotNull(res.id());
        assertEquals("Synopsis Review", res.name());
        assertEquals(new BigDecimal("50.00"), res.maxMarks());
        assertTrue(res.active());
        assertTrue(res.open());
    }

    @Test
    void createPhase_deadlineBeforeOpening_throwsBadRequest() {
        Instant now = Instant.now();
        var req = new CreatePhaseRequest(
                cycle.getId(),
                "Bad Phase",
                "desc",
                now.plus(5, ChronoUnit.DAYS),
                now.plus(2, ChronoUnit.DAYS),
                "PDF",
                new BigDecimal("20.00"),
                1,
                true
        );

        ApiException ex = assertThrows(ApiException.class, () -> phaseService.createPhase(req));
        assertEquals("INVALID_DATES", ex.getCode());
    }

    @Test
    void updatePhase_changesDeadline_recordsHistory() {
        PhaseResponse created = phaseService.createPhase(validCreateRequest("Phase 1"));

        Instant newDeadline = Instant.now().plus(20, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        var updateReq = new UpdatePhaseRequest(
                "Phase 1 Extended",
                "Updated description",
                created.openingDate(),
                newDeadline,
                "PDF Report, Code ZIP",
                new BigDecimal("50.00"),
                1,
                true,
                "Extended due to holidays"
        );

        PhaseResponse updated = phaseService.updatePhase(coordinator, created.id(), updateReq);
        assertEquals("Phase 1 Extended", updated.name());
        assertEquals(newDeadline, updated.deadline());

        List<PhaseDeadlineHistoryResponse> history = phaseService.getDeadlineHistory(created.id());
        assertEquals(1, history.size());
        assertEquals(created.deadline(), history.get(0).previousDeadline());
        assertEquals(newDeadline, history.get(0).newDeadline());
        assertEquals("Extended due to holidays", history.get(0).reason());
        assertEquals(coordinator.getId(), history.get(0).changedById());
    }
}
