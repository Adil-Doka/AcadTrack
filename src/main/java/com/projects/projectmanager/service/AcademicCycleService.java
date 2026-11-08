package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateAcademicCycleRequest;
import com.projects.projectmanager.dto.request.UpdateAcademicCycleRequest;
import com.projects.projectmanager.dto.response.AcademicCycleResponse;
import com.projects.projectmanager.entity.AcademicCycle;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.AcademicCycleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AcademicCycleService {

    private final AcademicCycleRepository cycleRepository;

    public AcademicCycleService(AcademicCycleRepository cycleRepository) {
        this.cycleRepository = cycleRepository;
    }

    @Transactional
    public AcademicCycleResponse createCycle(CreateAcademicCycleRequest request) {
        if (cycleRepository.existsByName(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "CYCLE_EXISTS",
                    "An academic cycle with this name already exists");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATES",
                    "End date cannot be before start date");
        }

        AcademicCycle cycle = AcademicCycle.builder()
                .name(request.name())
                .description(request.description())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .active(request.active() != null ? request.active() : true)
                .build();

        cycle = cycleRepository.save(cycle);
        return toResponse(cycle);
    }

    @Transactional
    public AcademicCycleResponse updateCycle(Long id, UpdateAcademicCycleRequest request) {
        AcademicCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                        "Academic cycle not found with id: " + id));

        if (!cycle.getName().equals(request.name()) && cycleRepository.existsByName(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "CYCLE_EXISTS",
                    "An academic cycle with this name already exists");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATES",
                    "End date cannot be before start date");
        }

        cycle.setName(request.name());
        cycle.setDescription(request.description());
        cycle.setStartDate(request.startDate());
        cycle.setEndDate(request.endDate());
        if (request.active() != null) {
            cycle.setActive(request.active());
        }

        cycle = cycleRepository.save(cycle);
        return toResponse(cycle);
    }

    @Transactional(readOnly = true)
    public AcademicCycleResponse getCycle(Long id) {
        AcademicCycle cycle = cycleRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                        "Academic cycle not found with id: " + id));
        return toResponse(cycle);
    }

    @Transactional(readOnly = true)
    public List<AcademicCycleResponse> getAllCycles() {
        return cycleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AcademicCycleResponse> getActiveCycles() {
        return cycleRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public AcademicCycleResponse toResponse(AcademicCycle cycle) {
        return new AcademicCycleResponse(
                cycle.getId(),
                cycle.getName(),
                cycle.getDescription(),
                cycle.getStartDate(),
                cycle.getEndDate(),
                cycle.isActive(),
                cycle.getCreatedAt(),
                cycle.getUpdatedAt()
        );
    }
}

