package com.scriptwriter.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveScriptRequest {

    @NotBlank(message = "Content is required")
    private String content;

    private String title;
    private String synopsis;
    private String fontFamily;
    private boolean createVersion;
    private String versionLabel;
    private boolean watermarkEnabled;
    private String watermarkText;
    private double watermarkOpacity;
    private int watermarkSize;
}
