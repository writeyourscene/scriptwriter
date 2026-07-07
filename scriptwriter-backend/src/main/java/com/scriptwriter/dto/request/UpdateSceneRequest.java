package com.scriptwriter.dto.request;

import com.scriptwriter.enums.SceneStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateSceneRequest {

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
    private Boolean favorite;
}
