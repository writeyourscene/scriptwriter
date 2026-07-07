package com.scriptwriter.dto.request;

import com.scriptwriter.enums.AiRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiScriptRequest {

    @NotNull(message = "Request type is required")
    private AiRequestType type;

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private String selectedText;
    private String characterName;
}
