package com.scriptwriter.dto.response;

import com.scriptwriter.enums.SceneStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SceneResponse {

    private Long id;
    private Long projectId;
    private Long scriptId;
    private int sceneNumber;
    private String title;
    private String slugLine;
    private String location;
    private String timeOfDay;
    private String description;
    private Integer pageNumber;
    private Integer estimatedDuration;
    private int wordCount;
    private int dialogueCount;
    private SceneStatus status;
    private boolean favorite;
    private int sortOrder;
    private List<String> characters;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
