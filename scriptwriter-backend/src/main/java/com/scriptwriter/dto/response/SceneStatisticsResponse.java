package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SceneStatisticsResponse {

    private int wordCount;
    private int dialogueCount;
    private int characterCount;
    private Integer estimatedDurationMinutes;
    private Integer pageNumber;
    private List<String> characters;
}
