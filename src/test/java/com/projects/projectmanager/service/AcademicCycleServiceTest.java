package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateAcademicCycleRequest;
import com.projects.projectmanager.dto.request.UpdateAcademicCycleRequest;
import com.projects.projectmanager.dto.response.AcademicCycleResponse;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.AcademicCycleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class AcademicCycleServiceTest {

    @Autowired private AcademicCycleService cycleService;
    @Autowired private AcademicCycleRepository cycleRepository;
    @Autowired private com.projects.projectmanager.TestDatabaseCleaner cleaner;

    @BeforeEach
    void setUp() {
        cleaner.clean();
    }

    private CreateAcademicCycleRequest validRequest(String name) {
        return new CreateAcademicCycleRequest(
                name,
                "Test cycle description",
                LocalDate.now(),
                LocalDate.now().plusMonths(6),
                true
        );
    }

    @Test
    void createCycle_success() {
        AcademicCycleResponse response = cycleService.createCycle(validRequest("AY-2026-2027"));

        assertNotNull(response.id());
        assertEquals("AY-2026-2027", response.name());
        assertTrue(response.active());
        assertTrue(cycleRepository.existsByName("AY-2026-2027"));
    }

    @Test
    void createCycle_duplicateName_throwsConflict() {
        cycleService.createCycle(validRequest("AY-2026-2027"));

        ApiException ex = assertThrows(ApiException.class,
                () -> cycleService.createCycle(validRequest("AY-2026-2027")));
        assertEquals("CYCLE_EXISTS", ex.getCode());
        assertEquals(409, ex.getStatus().value());
    }

    @Test
    void createCycle_endBeforeStart_throwsBadRequest() {
        var invalidReq = new CreateAcademicCycleRequest(
                "Invalid Cycle",
                "Description",
                LocalDate.now().plusMonths(2),
                LocalDate.now(),
                true
        );

        ApiException ex = assertThrows(ApiException.class, () -> cycleService.createCycle(invalidReq));
        assertEquals("INVALID_DATES", ex.getCode());
        assertEquals(400, ex.getStatus().value());
    }

    @Test
    void updateCycle_success() {
        AcademicCycleResponse created = cycleService.createCycle(validRequest("AY-2026"));

        var updateReq = new UpdateAcademicCycleRequest(
                "AY-2026-Updated",
                "Updated desc",
                LocalDate.now(),
                LocalDate.now().plusMonths(8),
                false
        );

        AcademicCycleResponse updated = cycleService.updateCycle(created.id(), updateReq);
        assertEquals("AY-2026-Updated", updated.name());
        assertEquals("Updated desc", updated.description());
        assertFalse(updated.active());
    }

    @Test
    void getActiveCycles_returnsOnlyActive() {
        cycleService.createCycle(validRequest("Active-1"));
        var inactiveReq = new CreateAcademicCycleRequest(
                "Inactive-1", "desc", LocalDate.now(), LocalDate.now().plusMonths(1), false);
        cycleService.createCycle(inactiveReq);

        List<AcademicCycleResponse> active = cycleService.getActiveCycles();
        assertEquals(1, active.size());
        assertEquals("Active-1", active.get(0).name());
    }
}
