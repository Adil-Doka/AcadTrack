package com.projects.projectmanager.dto.response;

import java.util.List;
import java.util.Map;

public record CoordinatorDashboardResponse(
        Long cycleId,
        String cycleName,
        List<TeamResponse> teamsAwaitingReview,
        List<ProjectResponse> projectsAwaitingReview,
        List<PhaseResponse> upcomingPhases,
        long pendingEvaluationsCount,
        Map<String, Long> stats
) {}

