package com.scriptwriter.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReorderScenesRequest {

    @NotNull
    private Long scriptId;

    @NotEmpty
    private List<Long> sceneIds;
}
