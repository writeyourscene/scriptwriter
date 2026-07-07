package com.scriptwriter.service;

import com.scriptwriter.dto.request.CreateProjectRequest;
import com.scriptwriter.dto.request.ShareProjectRequest;
import com.scriptwriter.dto.request.UpdateProjectRequest;
import com.scriptwriter.dto.response.PageResponse;
import com.scriptwriter.dto.response.ProjectResponse;
import com.scriptwriter.dto.response.ProjectShareResponse;
import com.scriptwriter.enums.ProjectStatus;
import org.springframework.data.domain.Pageable;

public interface ProjectService {

    ProjectResponse createProject(Long userId, CreateProjectRequest request);

    ProjectResponse getProject(Long userId, Long projectId);

    PageResponse<ProjectResponse> listProjects(
            Long userId, String search, Boolean favorite, ProjectStatus status, Pageable pageable
    );

    PageResponse<ProjectResponse> listArchivedProjects(Long userId, String search, Pageable pageable);

    PageResponse<ProjectResponse> listTrashProjects(Long userId, String search, Pageable pageable);

    ProjectResponse updateProject(Long userId, Long projectId, UpdateProjectRequest request);

    void deleteProject(Long userId, Long projectId);

    ProjectResponse restoreProject(Long userId, Long projectId);

    ProjectResponse archiveProject(Long userId, Long projectId);

    ProjectResponse unarchiveProject(Long userId, Long projectId);

    ProjectResponse toggleFavorite(Long userId, Long projectId);

    ProjectResponse duplicateProject(Long userId, Long projectId);

    ProjectShareResponse shareProject(Long userId, Long projectId, ShareProjectRequest request);

    ProjectResponse importProject(Long userId, org.springframework.web.multipart.MultipartFile file, String title, String genre, String screenplayType);
}
