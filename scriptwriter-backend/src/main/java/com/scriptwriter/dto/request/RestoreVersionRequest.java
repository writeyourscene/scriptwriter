package com.scriptwriter.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RestoreVersionRequest {

    @NotNull(message = "Version number is required")
    private Integer versionNumber;
}
