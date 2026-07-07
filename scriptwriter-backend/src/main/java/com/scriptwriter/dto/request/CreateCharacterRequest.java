package com.scriptwriter.dto.request;

import com.scriptwriter.enums.CharacterStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateCharacterRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Character name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 100)
    private String alias;

    @Size(max = 100)
    private String nickname;

    @Positive(message = "Age must be positive")
    private Integer age;

    @Size(max = 30)
    private String gender;

    @Size(max = 100)
    private String occupation;

    private String personality;
    private String description;
    private String goals;
    private String weaknesses;
    private String imageUrl;
    private CharacterStatus status;
    private List<String> aliases;
}
