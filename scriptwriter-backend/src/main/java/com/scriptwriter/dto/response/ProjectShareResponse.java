package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectShareResponse {

    private Long projectId;
    private String sharedWithEmail;
    private String permission;
    private String message;
}
