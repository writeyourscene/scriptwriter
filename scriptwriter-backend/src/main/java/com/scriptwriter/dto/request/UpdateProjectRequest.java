package com.scriptwriter.dto.request;

import com.scriptwriter.enums.ProjectStatus;
import com.scriptwriter.enums.ScreenplayType;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProjectRequest {

    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @Size(max = 100, message = "Genre must not exceed 100 characters")
    private String genre;

    @Size(max = 50, message = "Language must not exceed 50 characters")
    private String language;

    private ScreenplayType screenplayType;
    private ProjectStatus status;

    @Size(max = 20, message = "Color theme must not exceed 20 characters")
    private String colorTheme;

    @Size(max = 500, message = "Poster URL must not exceed 500 characters")
    private String posterImage;

    private Integer estimatedRuntime;
}
