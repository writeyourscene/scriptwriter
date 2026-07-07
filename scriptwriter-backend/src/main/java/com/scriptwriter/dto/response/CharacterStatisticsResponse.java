package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CharacterStatisticsResponse {

    private int totalDialogues;
    private int totalScenes;
    private Integer firstScene;
    private Integer lastScene;
    private int totalWordsSpoken;
    private Integer estimatedScreenTimeMinutes;
    private List<Integer> sceneTimeline;
}
