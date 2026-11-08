package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.DocumentResponse;
import com.projects.projectmanager.dto.response.SubmissionResponse;
import com.projects.projectmanager.entity.*;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.DocumentRepository;
import com.projects.projectmanager.repository.PhaseRepository;
import com.projects.projectmanager.repository.ProjectRepository;
import com.projects.projectmanager.repository.SubmissionRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final PhaseRepository phaseRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    public SubmissionService(SubmissionRepository submissionRepository,
                             DocumentRepository documentRepository,
                             ProjectRepository projectRepository,
                             PhaseRepository phaseRepository,
                             FileStorageService fileStorageService,
                             AuditService auditService) {
        this.submissionRepository = submissionRepository;
        this.documentRepository = documentRepository;
        this.projectRepository = projectRepository;
        this.phaseRepository = phaseRepository;
        this.fileStorageService = fileStorageService;
        this.auditService = auditService;
    }

    @Transactional
    public SubmissionResponse submit(User currentUser, Long phaseId, Long projectId,
                                     String notes, List<MultipartFile> files) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "Project not found with id: " + projectId));

        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PHASE_NOT_FOUND",
                        "Phase not found with id: " + phaseId));

        assertTeamMember(currentUser, project);

        if (project.getStatus() != ProjectStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PROJECT_NOT_APPROVED",
                    "Cannot submit deliverables for a project that is not APPROVED");
        }

        if (!phase.getAcademicCycle().getId().equals(project.getAcademicCycle().getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CYCLE_MISMATCH",
                    "Phase does not belong to the project's academic cycle");
        }

        if (!phase.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PHASE_INACTIVE",
                    "Submissions are not permitted for an inactive phase");
        }

        Instant now = Instant.now();
        if (now.isBefore(phase.getOpeningDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PHASE_NOT_OPEN",
                    "This phase is not yet open for submissions");
        }

        if (files == null || files.isEmpty() || files.stream().allMatch(MultipartFile::isEmpty)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_FILES",
                    "At least one non-empty file must be uploaded");
        }

        boolean isLate = now.isAfter(phase.getDeadline());
        int nextVersion = submissionRepository.findMaxVersion(project.getId(), phase.getId()) + 1;

        Submission submission = Submission.builder()
                .project(project)
                .phase(phase)
                .submittedBy(currentUser)
                .version(nextVersion)
                .submittedAt(now)
                .late(isLate)
                .notes(notes)
                .status("SUBMITTED")
                .build();

        submission = submissionRepository.save(submission);

        List<Document> documents = new ArrayList<>();
        String subDir = "projects/" + project.getId() + "/phases/" + phase.getId() + "/v" + nextVersion;

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String storagePath = fileStorageService.storeFile(file, subDir);
                Document doc = Document.builder()
                        .submission(submission)
                        .fileName(file.getOriginalFilename())
                        .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                        .fileSize(file.getSize())
                        .storagePath(storagePath)
                        .build();
                documents.add(documentRepository.save(doc));
            }
        }

        submission.setDocuments(documents);
        auditService.log(currentUser, "SUBMISSION_CREATED", "SUBMISSION", submission.getId(),
                "Submission v" + nextVersion + " created for project '" + project.getTitle() + "', phase '" + phase.getName() + "' (late: " + isLate + ")");
        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionHistory(User currentUser, Long projectId, Long phaseId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "Project not found with id: " + projectId));

        assertCanViewProject(currentUser, project);

        return submissionRepository.findByProjectIdAndPhaseIdOrderByVersionDesc(projectId, phaseId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(User currentUser, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SUBMISSION_NOT_FOUND",
                        "Submission not found with id: " + submissionId));

        assertCanViewProject(currentUser, submission.getProject());
        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public DocumentDownload loadDocument(User currentUser, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "DOCUMENT_NOT_FOUND",
                        "Document not found with id: " + documentId));

        assertCanViewProject(currentUser, document.getSubmission().getProject());
        Resource resource = fileStorageService.loadFileAsResource(document.getStoragePath());

        return new DocumentDownload(resource, document.getFileName(), document.getContentType());
    }

    private void assertTeamMember(User currentUser, Project project) {
        boolean isMember = project.getTeam().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_TEAM_MEMBER",
                    "Only team members can submit deliverables for this project");
        }
    }

    private void assertCanViewProject(User currentUser, Project project) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            return;
        }
        boolean isMember = project.getTeam().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have permission to view submissions for this project");
        }
    }

    public SubmissionResponse toResponse(Submission submission) {
        List<DocumentResponse> docResponses = submission.getDocuments().stream()
                .map(d -> new DocumentResponse(
                        d.getId(),
                        d.getFileName(),
                        d.getContentType(),
                        d.getFileSize(),
                        d.getUploadedAt()
                ))
                .toList();

        return new SubmissionResponse(
                submission.getId(),
                submission.getProject().getId(),
                submission.getProject().getTitle(),
                submission.getPhase().getId(),
                submission.getPhase().getName(),
                submission.getSubmittedBy().getId(),
                submission.getSubmittedBy().getName(),
                submission.getVersion(),
                submission.getSubmittedAt(),
                submission.isLate(),
                submission.getNotes(),
                submission.getStatus(),
                docResponses,
                submission.getCreatedAt()
        );
    }

    public record DocumentDownload(Resource resource, String filename, String contentType) {}
}

