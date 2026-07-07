package com.scriptwriter.dto.response;

import com.scriptwriter.enums.CharacterStatus;
import com.scriptwriter.enums.RelationshipType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CharacterResponse {

    private Long id;
    private Long projectId;
    private String name;
    private String alias;
    private String nickname;
    private Integer age;
    private String gender;
    private String occupation;
    private String personality;
    private String description;
    private String goals;
    private String weaknesses;
    private String imageUrl;
    private CharacterStatus status;
    private Integer firstScene;
    private Integer lastScene;
    private int dialogueCount;
    private int sceneCount;
    private int wordsSpoken;
    private List<String> aliases;
    private List<RelationshipResponse> relationships;
    private List<NoteResponse> notes;
    private List<Integer> timeline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class RelationshipResponse {
        private Long id;
        private Long relatedCharacterId;
        private String relatedCharacterName;
        private RelationshipType relationshipType;
        private String description;
    }

    @Data
    @Builder
    public static class NoteResponse {
        private Long id;
        private String noteType;
        private String content;
        private LocalDateTime createdAt;
    }
}
