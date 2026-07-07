package com.scriptwriter.mapper;

import com.scriptwriter.dto.response.SceneResponse;
import com.scriptwriter.dto.response.SceneStatisticsResponse;
import com.scriptwriter.entity.Scene;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SceneMapper {

    public SceneResponse toResponse(Scene scene, List<String> characters) {
        return SceneResponse.builder()
                .id(scene.getId())
                .projectId(scene.getProject().getId())
                .scriptId(scene.getScript().getId())
                .sceneNumber(scene.getSceneNumber())
                .title(scene.getTitle())
                .slugLine(scene.getSlugLine())
                .location(scene.getLocation())
                .timeOfDay(scene.getTimeOfDay())
                .description(scene.getDescription())
                .pageNumber(scene.getPageNumber())
                .estimatedDuration(scene.getEstimatedDuration())
                .wordCount(scene.getWordCount())
                .dialogueCount(scene.getDialogueCount())
                .status(scene.getStatus())
                .favorite(scene.isFavorite())
                .sortOrder(scene.getSortOrder())
                .characters(characters)
                .createdAt(scene.getCreatedAt())
                .updatedAt(scene.getUpdatedAt())
                .build();
    }

    public SceneStatisticsResponse toStatistics(Scene scene, List<String> characters) {
        return SceneStatisticsResponse.builder()
                .wordCount(scene.getWordCount())
                .dialogueCount(scene.getDialogueCount())
                .characterCount(characters.size())
                .estimatedDurationMinutes(scene.getEstimatedDuration())
                .pageNumber(scene.getPageNumber())
                .characters(characters)
                .build();
    }
}
