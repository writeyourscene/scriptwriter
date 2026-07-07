package com.scriptwriter.dto.response;

import com.scriptwriter.enums.ProjectStatus;
import com.scriptwriter.enums.ScreenplayType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProjectResponse {

    private Long id;
    private String title;
    private String description;
    private String genre;
    private String language;
    private ScreenplayType screenplayType;
    private ProjectStatus status;
    private boolean favorite;
    private boolean archived;
    private String colorTheme;
    private String posterImage;
    private Integer estimatedRuntime;
    private Long ownerId;
    private String ownerUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ProjectStatisticsResponse statistics;
}
