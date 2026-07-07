package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ScriptVersionResponse {

    private Long id;
    private int versionNumber;
    private String label;
    private Long createdBy;
    private LocalDateTime createdAt;
}
