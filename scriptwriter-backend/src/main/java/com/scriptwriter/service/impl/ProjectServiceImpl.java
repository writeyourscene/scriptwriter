package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.CreateProjectRequest;
import com.scriptwriter.dto.request.ShareProjectRequest;
import com.scriptwriter.dto.request.UpdateProjectRequest;
import com.scriptwriter.dto.response.PageResponse;
import com.scriptwriter.dto.response.ProjectResponse;
import com.scriptwriter.dto.response.ProjectShareResponse;
import com.scriptwriter.entity.Project;
import com.scriptwriter.entity.ProjectActivity;
import com.scriptwriter.entity.User;
import com.scriptwriter.enums.ActivityType;
import com.scriptwriter.enums.ProjectStatus;
import com.scriptwriter.enums.ScreenplayType;
import com.scriptwriter.exception.ProjectNotFoundException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.mapper.ProjectMapper;
import com.scriptwriter.repository.ProjectActivityRepository;
import com.scriptwriter.repository.ProjectRepository;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.service.ProjectService;
import com.scriptwriter.repository.ScriptRepository;
import com.scriptwriter.repository.ScriptVersionRepository;
import com.scriptwriter.service.ScriptContentSyncService;
import com.scriptwriter.entity.Script;
import com.scriptwriter.util.FileTextExtractor;
import com.scriptwriter.util.ScreenplayParser;
import com.scriptwriter.util.ScriptStatsCalculator;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectActivityRepository projectActivityRepository;
    private final ProjectMapper projectMapper;
    private final ScriptRepository scriptRepository;
    private final ScriptVersionRepository scriptVersionRepository;
    private final ScriptContentSyncService scriptContentSyncService;

    @Value("${project.trash-retention-days:30}")
    private int trashRetentionDays;

    @Override
    @Transactional
    public ProjectResponse createProject(Long userId, CreateProjectRequest request) {
        User owner = findUser(userId);
        if (!owner.isProjectAccess()) {
            throw new com.scriptwriter.exception.BadRequestException("Project creation access not granted. Please contact the Admin for approval.");
        }

        Project project = Project.builder()
                .owner(owner)
                .title(request.getTitle())
                .description(request.getDescription())
                .genre(request.getGenre())
                .language(request.getLanguage())
                .screenplayType(request.getScreenplayType())
                .colorTheme(request.getColorTheme())
                .posterImage(request.getPosterImage())
                .estimatedRuntime(request.getEstimatedRuntime())
                .status(ProjectStatus.DRAFT)
                .favorite(false)
                .archived(false)
                .build();
        project.setCreatedBy(userId);

        Project saved = projectRepository.save(project);
        logActivity(saved, owner, ActivityType.CREATED, "Project created");
        log.info("Project created: {} by user {}", saved.getTitle(), userId);
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long userId, Long projectId) {
        return projectMapper.toResponse(findOwnedProject(userId, projectId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listProjects(
            Long userId, String search, Boolean favorite, ProjectStatus status, Pageable pageable
    ) {
        String searchTerm = normalizeSearch(search);
        Page<Project> page = projectRepository.findUserProjects(userId, searchTerm, favorite, status, pageable);
        return toPageResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listArchivedProjects(Long userId, String search, Pageable pageable) {
        String searchTerm = normalizeSearch(search);
        Page<Project> page = projectRepository.findArchivedProjects(userId, searchTerm, pageable);
        return toPageResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listTrashProjects(Long userId, String search, Pageable pageable) {
        String searchTerm = normalizeSearch(search);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(trashRetentionDays);
        Page<Project> page = projectRepository.findTrashProjects(userId, searchTerm, cutoff, pageable);
        return toPageResponse(page);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long userId, Long projectId, UpdateProjectRequest request) {
        Project project = findOwnedProject(userId, projectId);

        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getGenre() != null) project.setGenre(request.getGenre());
        if (request.getLanguage() != null) project.setLanguage(request.getLanguage());
        if (request.getScreenplayType() != null) project.setScreenplayType(request.getScreenplayType());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getColorTheme() != null) project.setColorTheme(request.getColorTheme());
        if (request.getPosterImage() != null) project.setPosterImage(request.getPosterImage());
        if (request.getEstimatedRuntime() != null) project.setEstimatedRuntime(request.getEstimatedRuntime());
        project.setUpdatedBy(userId);

        Project saved = projectRepository.save(project);
        logActivity(saved, findUser(userId), ActivityType.UPDATED, "Project updated");
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProject(Long userId, Long projectId) {
        java.util.Optional<Project> projectOpt = projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId);
        if (projectOpt.isEmpty()) {
            projectOpt = projectRepository.findByIdAndOwnerIdAndDeletedTrue(projectId, userId);
        }
        Project project = projectOpt.orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        if (project.isDeleted()) {
            // Already in trash, delete permanently!
            // 1. Delete scene notes
            entityManager.createNativeQuery("DELETE FROM scene_notes WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 2. Delete scene characters
            entityManager.createNativeQuery("DELETE FROM scene_characters WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = :projectId) OR character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 3. Delete character notes
            entityManager.createNativeQuery("DELETE FROM character_notes WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 4. Delete character relationships
            entityManager.createNativeQuery("DELETE FROM character_relationships WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId) OR related_character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 5. Delete character aliases
            entityManager.createNativeQuery("DELETE FROM character_aliases WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 6. Delete script versions
            entityManager.createNativeQuery("DELETE FROM script_versions WHERE script_id IN (SELECT id FROM scripts WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 7. Delete AI history records for the script
            entityManager.createNativeQuery("DELETE FROM ai_history WHERE script_id IN (SELECT id FROM scripts WHERE project_id = :projectId)")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 8. Delete scenes
            entityManager.createNativeQuery("DELETE FROM scenes WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 9. Delete scripts
            entityManager.createNativeQuery("DELETE FROM scripts WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 10. Delete characters
            entityManager.createNativeQuery("DELETE FROM characters WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 11. Delete project members
            entityManager.createNativeQuery("DELETE FROM project_members WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 12. Delete project tags
            entityManager.createNativeQuery("DELETE FROM project_tags WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 13. Delete project activity
            entityManager.createNativeQuery("DELETE FROM project_activity WHERE project_id = :projectId")
                    .setParameter("projectId", projectId)
                    .executeUpdate();

            // 14. Finally, delete the project
            projectRepository.delete(project);
            log.info("Project deleted permanently: {} by user {}", projectId, userId);
        } else {
            // Soft delete
            project.setDeleted(true);
            project.setDeletedAt(LocalDateTime.now());
            project.setDeletedBy(userId);
            projectRepository.save(project);
            logActivity(project, findUser(userId), ActivityType.DELETED, "Project moved to trash");
            log.info("Project deleted (soft): {} by user {}", projectId, userId);
        }
    }

    @Override
    @Transactional
    public ProjectResponse restoreProject(Long userId, Long projectId) {
        Project project = projectRepository.findByIdAndOwnerIdAndDeletedTrue(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found in trash"));

        project.setDeleted(false);
        project.setDeletedAt(null);
        project.setDeletedBy(null);
        project.setUpdatedBy(userId);
        Project saved = projectRepository.save(project);
        logActivity(saved, findUser(userId), ActivityType.RESTORED, "Project restored from trash");
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse archiveProject(Long userId, Long projectId) {
        Project project = findOwnedProject(userId, projectId);
        project.setArchived(true);
        project.setStatus(ProjectStatus.ARCHIVED);
        project.setUpdatedBy(userId);
        Project saved = projectRepository.save(project);
        logActivity(saved, findUser(userId), ActivityType.ARCHIVED, "Project archived");
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse unarchiveProject(Long userId, Long projectId) {
        Project project = projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        project.setArchived(false);
        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            project.setStatus(ProjectStatus.DRAFT);
        }
        project.setUpdatedBy(userId);
        Project saved = projectRepository.save(project);
        logActivity(saved, findUser(userId), ActivityType.RESTORED, "Project unarchived");
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse toggleFavorite(Long userId, Long projectId) {
        Project project = findOwnedProject(userId, projectId);
        project.setFavorite(!project.isFavorite());
        project.setUpdatedBy(userId);
        Project saved = projectRepository.save(project);
        logActivity(saved, findUser(userId), ActivityType.FAVORITED,
                project.isFavorite() ? "Added to favorites" : "Removed from favorites");
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectResponse duplicateProject(Long userId, Long projectId) {
        Project source = findOwnedProject(userId, projectId);
        User owner = findUser(userId);

        Project copy = Project.builder()
                .owner(owner)
                .title(source.getTitle() + " (Copy)")
                .description(source.getDescription())
                .genre(source.getGenre())
                .language(source.getLanguage())
                .screenplayType(source.getScreenplayType())
                .colorTheme(source.getColorTheme())
                .posterImage(source.getPosterImage())
                .estimatedRuntime(source.getEstimatedRuntime())
                .status(ProjectStatus.DRAFT)
                .favorite(false)
                .archived(false)
                .build();
        copy.setCreatedBy(userId);

        Project saved = projectRepository.save(copy);
        logActivity(saved, owner, ActivityType.DUPLICATED, "Duplicated from project " + source.getId());
        return projectMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProjectShareResponse shareProject(Long userId, Long projectId, ShareProjectRequest request) {
        Project project = findOwnedProject(userId, projectId);
        User inviter = findUser(userId);

        userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        logActivity(project, inviter, ActivityType.SHARED,
                "Shared with " + request.getEmail() + " as " + request.getPermission());
        log.info("Project {} shared with {} by user {}", projectId, request.getEmail(), userId);

        return ProjectShareResponse.builder()
                .projectId(projectId)
                .sharedWithEmail(request.getEmail())
                .permission(request.getPermission())
                .message("Share invitation recorded. Full collaboration arrives in a future phase.")
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Project findOwnedProject(Long userId, Long projectId) {
        return projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private void logActivity(Project project, User user, ActivityType type, String description) {
        projectActivityRepository.save(ProjectActivity.builder()
                .project(project)
                .user(user)
                .activityType(type)
                .description(description)
                .build());
    }

    private String normalizeSearch(String search) {
        return (search != null && !search.isBlank()) ? search.trim() : null;
    }

    private PageResponse<ProjectResponse> toPageResponse(Page<Project> page) {
        List<ProjectResponse> content = page.getContent().stream()
                .map(projectMapper::toResponse)
                .toList();

        return PageResponse.<ProjectResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
    @Override
    @Transactional
    public ProjectResponse importProject(Long userId, MultipartFile file, String title, String genre, String screenplayType) {
        User owner = findUser(userId);
        
        String originalFilename = file.getOriginalFilename();
        String resolvedTitle = (title != null && !title.isBlank()) ? title : (originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(0, originalFilename.lastIndexOf('.'))
                : "Imported Screenplay");
                
        ScreenplayType sType = ScreenplayType.MOVIE;
        if (screenplayType != null) {
            try {
                sType = ScreenplayType.valueOf(screenplayType.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Keep default MOVIE
            }
        }

        Project project = Project.builder()
                .owner(owner)
                .title(resolvedTitle)
                .description("Imported from " + originalFilename)
                .genre(genre != null ? genre : "Drama")
                .language("English")
                .screenplayType(sType)
                .status(ProjectStatus.DRAFT)
                .favorite(false)
                .archived(false)
                .build();
        project.setCreatedBy(userId);
        Project savedProject = projectRepository.save(project);
        logActivity(savedProject, owner, ActivityType.CREATED, "Project imported from file");
        
        try {
            String rawText = FileTextExtractor.extract(file.getInputStream(), originalFilename);
            String jsonContent = ScreenplayParser.parseToContentJson(rawText);
            
            Script script = Script.builder()
                    .project(savedProject)
                    .title(resolvedTitle)
                    .content(jsonContent)
                    .currentVersion(1)
                    .build();
            script.setCreatedBy(userId);
            
            ScriptStatsCalculator.Stats stats = ScriptStatsCalculator.calculate(jsonContent);
            script.setWordCount(stats.words());
            script.setPageCount(stats.pages());
            script.setSceneCount(stats.scenes());
            script.setCharacterCount(stats.characters());
            script.setDialogueCount(stats.dialogueCount());
            
            Script savedScript = scriptRepository.save(script);
            
            scriptVersionRepository.save(com.scriptwriter.entity.ScriptVersion.builder()
                    .script(savedScript)
                    .versionNumber(1)
                    .contentSnapshot(jsonContent)
                    .createdBy(userId)
                    .label("Imported Version")
                    .createdAt(LocalDateTime.now())
                    .build());
                    
            scriptContentSyncService.syncFromScriptContent(savedScript, userId);
            
        } catch (Exception e) {
            log.error("Failed to import screenplay for project", e);
            throw new RuntimeException("Failed to import screenplay: " + e.getMessage(), e);
        }
        
        return projectMapper.toResponse(savedProject);
    }
}
