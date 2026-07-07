package com.scriptwriter.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CharacterSuggestionResponse {

    private Long id;
    private String name;
    private String alias;
}
