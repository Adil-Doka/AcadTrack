package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.GitHubRepoResponse;
import com.projects.projectmanager.entity.GitHubSnapshot;
import com.projects.projectmanager.entity.Project;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.GitHubSnapshotRepository;
import com.projects.projectmanager.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GitHubService {

    private static final Pattern GITHUB_URL_PATTERN =
            Pattern.compile("https?://github\\.com/([^/]+)/([^/.]+)(?:\\.git)?/?");

    private final GitHubSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;
    private final GitHubClient gitHubClient;

    public GitHubService(GitHubSnapshotRepository snapshotRepository,
                         ProjectRepository projectRepository,
                         GitHubClient gitHubClient) {
        this.snapshotRepository = snapshotRepository;
        this.projectRepository = projectRepository;
        this.gitHubClient = gitHubClient;
    }

    @Transactional
    public GitHubRepoResponse refreshRepoData(User currentUser, Long projectId) {
        Project project = getProjectOrThrow(projectId);
        assertCanViewProject(currentUser, project);

        String repoUrl = project.getGithubRepoUrl();
        if (repoUrl == null || repoUrl.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_REPO_URL",
                    "This project does not have a GitHub repository URL configured");
        }

        RepoCoordinates coords = parseRepoUrl(repoUrl);
        if (coords == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REPO_URL",
                    "Invalid GitHub repository URL: " + repoUrl);
        }

        GitHubClient.RepoData data = gitHubClient.fetchRepositoryData(coords.owner(), coords.repo());

        // If successful, mark older snapshots as stale
        if ("SUCCESS".equals(data.status())) {
            List<GitHubSnapshot> existing = snapshotRepository.findByProjectIdOrderByFetchedAtDesc(projectId);
            for (GitHubSnapshot s : existing) {
                if (!s.isStale()) {
                    s.setStale(true);
                }
            }
            snapshotRepository.saveAll(existing);
        }

        GitHubSnapshot snapshot = GitHubSnapshot.builder()
                .project(project)
                .repoUrl(repoUrl)
                .ownerName(coords.owner())
                .repoName(coords.repo())
                .primaryLanguage(data.primaryLanguage())
                .starsCount(data.stars())
                .forksCount(data.forks())
                .openIssuesCount(data.openIssues())
                .commitCount(data.commitCount())
                .branchesCount(data.branchesCount())
                .pullRequestsCount(data.pullRequestsCount())
                .latestActivityAt(data.latestActivity())
                .status(data.status())
                .errorMessage(data.errorMessage())
                .stale(false)
                .fetchedAt(Instant.now())
                .build();

        snapshot = snapshotRepository.save(snapshot);
        return toResponse(snapshot);
    }

    @Transactional
    public GitHubRepoResponse getLatestSnapshot(User currentUser, Long projectId) {
        Project project = getProjectOrThrow(projectId);
        assertCanViewProject(currentUser, project);

        Optional<GitHubSnapshot> snapshotOpt = snapshotRepository.findFirstByProjectIdOrderByFetchedAtDesc(projectId);
        if (snapshotOpt.isPresent()) {
            return toResponse(snapshotOpt.get());
        }

        if (project.getGithubRepoUrl() != null && !project.getGithubRepoUrl().isBlank()) {
            return refreshRepoData(currentUser, projectId);
        }

        throw new ApiException(HttpStatus.NOT_FOUND, "NO_GITHUB_DATA",
                "No GitHub repository data found for this project");
    }

    @Transactional(readOnly = true)
    public List<GitHubRepoResponse> getSnapshotHistory(User currentUser, Long projectId) {
        Project project = getProjectOrThrow(projectId);
        assertCanViewProject(currentUser, project);

        return snapshotRepository.findByProjectIdOrderByFetchedAtDesc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    public RepoCoordinates parseRepoUrl(String url) {
        if (url == null) return null;
        Matcher matcher = GITHUB_URL_PATTERN.matcher(url.trim());
        if (matcher.matches()) {
            return new RepoCoordinates(matcher.group(1), matcher.group(2));
        }
        return null;
    }

    private Project getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND",
                        "Project not found with id: " + projectId));
    }

    private void assertCanViewProject(User currentUser, Project project) {
        if (currentUser.getRole() == Role.COORDINATOR) {
            return;
        }
        boolean isMember = project.getTeam().getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUser.getId()));
        if (!isMember) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You do not have permission to access GitHub data for this project");
        }
    }

    public GitHubRepoResponse toResponse(GitHubSnapshot s) {
        return new GitHubRepoResponse(
                s.getId(),
                s.getProject().getId(),
                s.getRepoUrl(),
                s.getOwnerName(),
                s.getRepoName(),
                s.getPrimaryLanguage(),
                s.getStarsCount() != null ? s.getStarsCount() : 0,
                s.getForksCount() != null ? s.getForksCount() : 0,
                s.getOpenIssuesCount() != null ? s.getOpenIssuesCount() : 0,
                s.getCommitCount() != null ? s.getCommitCount() : 0,
                s.getBranchesCount() != null ? s.getBranchesCount() : 0,
                s.getPullRequestsCount() != null ? s.getPullRequestsCount() : 0,
                s.getLatestActivityAt(),
                s.getStatus(),
                s.getErrorMessage(),
                s.isStale(),
                s.getFetchedAt(),
                s.getContributorsJson(),
                s.getRecentCommitsJson()
        );
    }

    public record RepoCoordinates(String owner, String repo) {}
}

