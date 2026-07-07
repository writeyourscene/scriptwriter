package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScriptStatisticsResponse {

    private int pages;
    private int words;
    private int scenes;
    private int characters;
    private int dialogueCount;
    private Integer estimatedRuntimeMinutes;
}
