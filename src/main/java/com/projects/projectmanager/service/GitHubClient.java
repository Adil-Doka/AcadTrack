package com.projects.projectmanager.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;
import java.util.*;

@Component
public class GitHubClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubClient.class);
    private final RestClient restClient;

    public GitHubClient(
            @Value("${app.github.api-base-url:https://api.github.com}") String baseUrl,
            @Value("${app.github.token:}") String token) {
        RestClient.Builder builder = RestClient.builder().baseUrl(baseUrl);
        if (token != null && !token.isBlank()) {
            builder.defaultHeader("Authorization", "Bearer " + token);
        }
        builder.defaultHeader("Accept", "application/vnd.github+json");
        builder.defaultHeader("User-Agent", "Project-Manager-App");
        this.restClient = builder.build();
    }

    public RepoData fetchRepositoryData(String owner, String repo) {
        try {
            Map<String, Object> repoInfo = restClient.get()
                    .uri("/repos/{owner}/{repo}", owner, repo)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (repoInfo == null) {
                return RepoData.failure("REPO_NOT_FOUND", "Repository not found or empty response");
            }

            String language = (String) repoInfo.get("language");
            int stars = getInt(repoInfo.get("stargazers_count"));
            int forks = getInt(repoInfo.get("forks_count"));
            int openIssues = getInt(repoInfo.get("open_issues_count"));
            String updatedAtStr = (String) repoInfo.get("updated_at");
            Instant latestActivity = updatedAtStr != null ? Instant.parse(updatedAtStr) : null;

            int branchesCount = fetchListSize("/repos/{owner}/{repo}/branches", owner, repo);
            int prCount = fetchListSize("/repos/{owner}/{repo}/pulls?state=all", owner, repo);
            int commitsCount = fetchListSize("/repos/{owner}/{repo}/commits?per_page=100", owner, repo);

            return new RepoData(
                    "SUCCESS",
                    null,
                    language,
                    stars,
                    forks,
                    openIssues,
                    commitsCount,
                    branchesCount,
                    prCount,
                    latestActivity
            );

        } catch (RestClientResponseException e) {
            log.warn("GitHub API error for {}/{}: status {} - {}", owner, repo, e.getStatusCode(), e.getMessage());
            if (e.getStatusCode().value() == 404) {
                return RepoData.failure("REPO_NOT_FOUND", "GitHub repository not found: " + owner + "/" + repo);
            } else if (e.getStatusCode().value() == 403 || e.getStatusCode().value() == 429) {
                return RepoData.failure("RATE_LIMITED", "GitHub API rate limit exceeded or access forbidden");
            } else if (e.getStatusCode().value() == 401) {
                return RepoData.failure("UNAUTHORIZED", "GitHub API authentication failed");
            }
            return RepoData.failure("API_ERROR", "GitHub API returned status: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            log.warn("GitHub network error: {}", e.getMessage());
            return RepoData.failure("UNAVAILABLE", "Cannot connect to GitHub: network error or outage");
        } catch (Exception e) {
            log.error("Unexpected error fetching GitHub data for {}/{}", owner, repo, e);
            return RepoData.failure("UNAVAILABLE", "Error retrieving GitHub data: " + e.getMessage());
        }
    }

    private int fetchListSize(String uri, String owner, String repo) {
        try {
            List<?> list = restClient.get()
                    .uri(uri, owner, repo)
                    .retrieve()
                    .body(List.class);
            return list != null ? list.size() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private int getInt(Object val) {
        if (val instanceof Number n) {
            return n.intValue();
        }
        return 0;
    }

    public record RepoData(
            String status,
            String errorMessage,
            String primaryLanguage,
            int stars,
            int forks,
            int openIssues,
            int commitCount,
            int branchesCount,
            int pullRequestsCount,
            Instant latestActivity
    ) {
        public static RepoData failure(String status, String errorMessage) {
            return new RepoData(status, errorMessage, null, 0, 0, 0, 0, 0, 0, null);
        }
    }
}

