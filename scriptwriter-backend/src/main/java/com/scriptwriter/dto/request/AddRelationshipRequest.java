package com.scriptwriter.dto.request;

import com.scriptwriter.enums.RelationshipType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddRelationshipRequest {

    @NotNull
    private Long relatedCharacterId;

    @NotNull
    private RelationshipType relationshipType;

    private String description;
}
