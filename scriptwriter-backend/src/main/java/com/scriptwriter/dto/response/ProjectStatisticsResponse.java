package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectStatisticsResponse {

    private int pages;
    private int scenes;
    private int characters;
    private int locations;
    private int dialogueCount;
    private int wordCount;
    private Integer estimatedRuntimeMinutes;
}
