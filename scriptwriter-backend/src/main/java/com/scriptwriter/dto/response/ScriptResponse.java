package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ScriptResponse {

    private Long id;
    private Long projectId;
    private String title;
    private String synopsis;
    private String content;
    private String fontFamily;
    private int currentVersion;
    private ScriptStatisticsResponse statistics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isShared;
}
