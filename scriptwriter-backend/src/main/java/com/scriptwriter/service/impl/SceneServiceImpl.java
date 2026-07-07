package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.SceneResponse;
import com.scriptwriter.dto.response.SceneStatisticsResponse;
import com.scriptwriter.entity.Project;
import com.scriptwriter.entity.Scene;
import com.scriptwriter.entity.Script;
import com.scriptwriter.enums.SceneStatus;
import com.scriptwriter.exception.ProjectNotFoundException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.mapper.SceneMapper;
import com.scriptwriter.repository.ProjectRepository;
import com.scriptwriter.repository.SceneCharacterRepository;
import com.scriptwriter.repository.SceneRepository;
import com.scriptwriter.repository.ScriptRepository;
import com.scriptwriter.service.SceneService;
import com.scriptwriter.util.SlugLineParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SceneServiceImpl implements SceneService {

    private final SceneRepository sceneRepository;
    private final SceneCharacterRepository sceneCharacterRepository;
    private final ProjectRepository projectRepository;
    private final ScriptRepository scriptRepository;
    private final SceneMapper sceneMapper;

    @Override
    @Transactional
    public SceneResponse create(Long userId, CreateSceneRequest request) {
        Project project = findOwnedProject(userId, request.getProjectId());
        Script script = scriptRepository.findByIdAndProjectOwnerId(request.getScriptId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));

        int nextOrder = sceneRepository.findByScriptIdOrderBySortOrderAsc(script.getId()).size() + 1;
        SlugLineParser.ParsedSlug parsed = SlugLineParser.parse(request.getSlugLine());

        Scene scene = Scene.builder()
                .project(project)
                .script(script)
                .sceneNumber(request.getSceneNumber() != null ? request.getSceneNumber() : nextOrder)
                .title(request.getTitle())
                .slugLine(request.getSlugLine().toUpperCase())
                .location(parsed.location())
                .timeOfDay(parsed.timeOfDay())
                .description(request.getDescription())
                .estimatedDuration(request.getEstimatedDuration())
                .status(request.getStatus() != null ? request.getStatus() : SceneStatus.DRAFT)
                .sortOrder(nextOrder)
                .build();
        scene.setCreatedBy(userId);

        return toResponse(sceneRepository.save(scene));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SceneResponse> list(Long userId, Long projectId, Long scriptId, String search, SceneStatus status, Boolean favorite) {
        findOwnedProject(userId, projectId);
        String searchTerm = search != null && !search.isBlank() ? search.trim() : null;

        List<Scene> scenes;
        if (scriptId != null) {
            scenes = sceneRepository.findByScriptIdOrderBySortOrderAsc(scriptId);
        } else {
            scenes = sceneRepository.searchScenes(projectId, userId, searchTerm, status, favorite);
        }
        return scenes.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SceneResponse getById(Long userId, Long id) {
        return toResponse(findOwnedScene(userId, id));
    }

    @Override
    @Transactional
    public SceneResponse update(Long userId, Long id, UpdateSceneRequest request) {
        Scene scene = findOwnedScene(userId, id);

        if (request.getSlugLine() != null) {
            scene.setSlugLine(request.getSlugLine().toUpperCase());
            SlugLineParser.ParsedSlug parsed = SlugLineParser.parse(request.getSlugLine());
            scene.setLocation(parsed.location());
            scene.setTimeOfDay(parsed.timeOfDay());
        }
        if (request.getTitle() != null) scene.setTitle(request.getTitle());
        if (request.getLocation() != null) scene.setLocation(request.getLocation());
        if (request.getTimeOfDay() != null) scene.setTimeOfDay(request.getTimeOfDay());
        if (request.getDescription() != null) scene.setDescription(request.getDescription());
        if (request.getEstimatedDuration() != null) scene.setEstimatedDuration(request.getEstimatedDuration());
        if (request.getStatus() != null) scene.setStatus(request.getStatus());
        if (request.getFavorite() != null) scene.setFavorite(request.getFavorite());
        scene.setUpdatedBy(userId);

        return toResponse(sceneRepository.save(scene));
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        Scene scene = findOwnedScene(userId, id);
        scene.setStatus(SceneStatus.DELETED);
        scene.setUpdatedBy(userId);
        sceneRepository.save(scene);
    }

    @Override
    @Transactional
    public List<SceneResponse> reorder(Long userId, ReorderScenesRequest request) {
        scriptRepository.findByIdAndProjectOwnerId(request.getScriptId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));

        List<SceneResponse> result = new ArrayList<>();
        int order = 1;
        for (Long sceneId : request.getSceneIds()) {
            Scene scene = findOwnedScene(userId, sceneId);
            scene.setSortOrder(order);
            scene.setSceneNumber(order);
            scene.setUpdatedBy(userId);
            result.add(toResponse(sceneRepository.save(scene)));
            order++;
        }
        log.info("Reordered {} scenes for script {}", request.getSceneIds().size(), request.getScriptId());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public SceneStatisticsResponse getStatistics(Long userId, Long id) {
        Scene scene = findOwnedScene(userId, id);
        List<String> characters = getCharacterNames(scene.getId());
        return sceneMapper.toStatistics(scene, characters);
    }

    private SceneResponse toResponse(Scene scene) {
        return sceneMapper.toResponse(scene, getCharacterNames(scene.getId()));
    }

    private List<String> getCharacterNames(Long sceneId) {
        return sceneCharacterRepository.findBySceneId(sceneId).stream()
                .map(sc -> sc.getCharacter().getName())
                .toList();
    }

    private Project findOwnedProject(Long userId, Long projectId) {
        return projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private Scene findOwnedScene(Long userId, Long id) {
        return sceneRepository.findByIdAndProjectOwnerId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Scene not found"));
    }
}
