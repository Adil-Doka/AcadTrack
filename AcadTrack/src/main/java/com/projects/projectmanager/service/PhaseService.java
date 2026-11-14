package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreatePhaseRequest;
import com.projects.projectmanager.dto.request.UpdatePhaseRequest;
import com.projects.projectmanager.dto.response.PhaseDeadlineHistoryResponse;
import com.projects.projectmanager.dto.response.PhaseResponse;
import com.projects.projectmanager.entity.AcademicCycle;
import com.projects.projectmanager.entity.Phase;
import com.projects.projectmanager.entity.PhaseDeadlineHistory;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.AcademicCycleRepository;
import com.projects.projectmanager.repository.PhaseDeadlineHistoryRepository;
import com.projects.projectmanager.repository.PhaseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class PhaseService {

    private final PhaseRepository phaseRepository;
    private final PhaseDeadlineHistoryRepository deadlineHistoryRepository;
    private final AcademicCycleRepository cycleRepository;

    public PhaseService(PhaseRepository phaseRepository,
                        PhaseDeadlineHistoryRepository deadlineHistoryRepository,
                        AcademicCycleRepository cycleRepository) {
        this.phaseRepository = phaseRepository;
        this.deadlineHistoryRepository = deadlineHistoryRepository;
        this.cycleRepository = cycleRepository;
    }

    @Transactional
    public PhaseResponse createPhase(CreatePhaseRequest request) {
        AcademicCycle cycle = cycleRepository.findById(request.cycleId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CYCLE_NOT_FOUND",
                        "Academic cycle not found with id: " + request.cycleId()));

        if (request.deadline().isBefore(request.openingDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATES",
                    "Deadline cannot be before opening date");
        }

        Phase phase = Phase.builder()
                .academicCycle(cycle)
                .name(request.name())
                .description(request.description())
                .openingDate(request.openingDate())
                .deadline(request.deadline())
                .requiredDocuments(request.requiredDocuments())
                .maxMarks(request.maxMarks())
                .sequenceOrder(request.sequenceOrder() != null ? request.sequenceOrder() : 1)
                .active(request.active() != null ? request.active() : true)
                .build();

        phase = phaseRepository.save(phase);
        return toResponse(phase);
    }

    @Transactional
    public PhaseResponse updatePhase(User currentUser, Long phaseId, UpdatePhaseRequest request) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND",
                        "Phase not found with id: " + phaseId));

        if (request.deadline().isBefore(request.openingDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATES",
                    "Deadline cannot be before opening date");
        }

        // Check if deadline changed to retain history
        if (!phase.getDeadline().equals(request.deadline())) {
            PhaseDeadlineHistory history = PhaseDeadlineHistory.builder()
                    .phase(phase)
                    .previousDeadline(phase.getDeadline())
                    .newDeadline(request.deadline())
                    .changedBy(currentUser)
                    .reason(request.deadlineChangeReason())
                    .build();
            deadlineHistoryRepository.save(history);
        }

        phase.setName(request.name());
        phase.setDescription(request.description());
        phase.setOpeningDate(request.openingDate());
        phase.setDeadline(request.deadline());
        phase.setRequiredDocuments(request.requiredDocuments());
        phase.setMaxMarks(request.maxMarks());
        if (request.sequenceOrder() != null) {
            phase.setSequenceOrder(request.sequenceOrder());
        }
        if (request.active() != null) {
            phase.setActive(request.active());
        }

        phase = phaseRepository.save(phase);
        return toResponse(phase);
    }

    @Transactional(readOnly = true)
    public PhaseResponse getPhase(Long phaseId) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND",
                        "Phase not found with id: " + phaseId));
        return toResponse(phase);
    }

    @Transactional(readOnly = true)
    public List<PhaseResponse> getPhasesByCycle(Long cycleId) {
        return phaseRepository.findByAcademicCycleIdOrderBySequenceOrderAsc(cycleId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PhaseDeadlineHistoryResponse> getDeadlineHistory(Long phaseId) {
        if (!phaseRepository.existsById(phaseId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND",
                    "Phase not found with id: " + phaseId);
        }

        return deadlineHistoryRepository.findByPhaseIdOrderByChangedAtDesc(phaseId).stream()
                .map(h -> new PhaseDeadlineHistoryResponse(
                        h.getId(),
                        h.getPhase().getId(),
                        h.getPreviousDeadline(),
                        h.getNewDeadline(),
                        h.getChangedBy().getId(),
                        h.getChangedBy().getName(),
                        h.getReason(),
                        h.getChangedAt()
                ))
                .toList();
    }

    public PhaseResponse toResponse(Phase phase) {
        Instant now = Instant.now();
        boolean isOpen = phase.isActive() && !now.isBefore(phase.getOpeningDate());

        return new PhaseResponse(
                phase.getId(),
                phase.getAcademicCycle().getId(),
                phase.getAcademicCycle().getName(),
                phase.getName(),
                phase.getDescription(),
                phase.getOpeningDate(),
                phase.getDeadline(),
                phase.getRequiredDocuments(),
                phase.getMaxMarks(),
                phase.getSequenceOrder(),
                phase.isActive(),
                isOpen,
                phase.getCreatedAt(),
                phase.getUpdatedAt()
        );
    }
}

