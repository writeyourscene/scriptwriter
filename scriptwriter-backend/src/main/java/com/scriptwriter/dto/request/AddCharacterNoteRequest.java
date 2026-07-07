package com.scriptwriter.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCharacterNoteRequest {

    @Size(max = 50)
    private String noteType;

    @NotBlank
    @Size(max = 5000)
    private String content;
}
