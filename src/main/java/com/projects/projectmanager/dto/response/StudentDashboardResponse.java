package com.projects.projectmanager.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StudentDashboardResponse(
        TeamResponse team,
        ProjectResponse project,
        List<PhaseResponse> phases,
        List<SubmissionResponse> submissions,
        List<EvaluationResponse> releasedEvaluations,
        BigDecimal totalMarksAwarded,
        BigDecimal totalPossibleMarks
) {}

