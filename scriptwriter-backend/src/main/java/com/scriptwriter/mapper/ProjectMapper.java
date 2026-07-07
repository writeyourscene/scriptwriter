package com.scriptwriter.mapper;

import com.scriptwriter.dto.response.ProjectResponse;
import com.scriptwriter.dto.response.ProjectStatisticsResponse;
import com.scriptwriter.entity.Project;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {

    public ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .genre(project.getGenre())
                .language(project.getLanguage())
                .screenplayType(project.getScreenplayType())
                .status(project.getStatus())
                .favorite(project.isFavorite())
                .archived(project.isArchived())
                .colorTheme(project.getColorTheme())
                .posterImage(project.getPosterImage())
                .estimatedRuntime(project.getEstimatedRuntime())
                .ownerId(project.getOwner().getId())
                .ownerUsername(project.getOwner().getUsername())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .statistics(defaultStatistics(project))
                .build();
    }

    private ProjectStatisticsResponse defaultStatistics(Project project) {
        return ProjectStatisticsResponse.builder()
                .pages(0)
                .scenes(0)
                .characters(0)
                .locations(0)
                .dialogueCount(0)
                .wordCount(0)
                .estimatedRuntimeMinutes(project.getEstimatedRuntime())
                .build();
    }
}
