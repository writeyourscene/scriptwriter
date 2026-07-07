package com.scriptwriter.dto.request;

import com.scriptwriter.enums.SceneStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSceneRequest {

    @NotNull
    private Long projectId;

    @NotNull
    private Long scriptId;

    @Positive
    private Integer sceneNumber;

    @NotBlank
    @Size(max = 300)
    private String slugLine;

    @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String location;

    @Size(max = 50)
    private String timeOfDay;

    private String description;
    private Integer estimatedDuration;
    private SceneStatus status;
}
