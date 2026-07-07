package com.scriptwriter.mapper;

import com.scriptwriter.dto.response.CharacterResponse;
import com.scriptwriter.dto.response.CharacterStatisticsResponse;
import com.scriptwriter.entity.Character;
import com.scriptwriter.entity.CharacterAlias;
import com.scriptwriter.entity.CharacterNote;
import com.scriptwriter.entity.CharacterRelationship;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class CharacterMapper {

    public CharacterResponse toResponse(Character character) {
        return CharacterResponse.builder()
                .id(character.getId())
                .projectId(character.getProject().getId())
                .name(character.getName())
                .alias(character.getAlias())
                .nickname(character.getNickname())
                .age(character.getAge())
                .gender(character.getGender())
                .occupation(character.getOccupation())
                .personality(character.getPersonality())
                .description(character.getDescription())
                .goals(character.getGoals())
                .weaknesses(character.getWeaknesses())
                .imageUrl(character.getImageUrl())
                .status(character.getStatus())
                .firstScene(character.getFirstScene())
                .lastScene(character.getLastScene())
                .dialogueCount(character.getDialogueCount())
                .sceneCount(character.getSceneCount())
                .wordsSpoken(character.getWordsSpoken())
                .createdAt(character.getCreatedAt())
                .updatedAt(character.getUpdatedAt())
                .build();
    }

    @SuppressWarnings("null")
    public CharacterResponse toDetailedResponse(
            Character character,
            List<CharacterAlias> aliases,
            List<CharacterRelationship> relationships,
            List<CharacterNote> notes,
            List<Integer> timeline
    ) {
        CharacterResponse response = toResponse(character);
        response.setAliases(aliases.stream().map(CharacterAlias::getAliasName).toList());
        response.setRelationships(relationships.stream().map(r -> CharacterResponse.RelationshipResponse.builder()
                .id(r.getId())
                .relatedCharacterId(r.getRelatedCharacter().getId())
                .relatedCharacterName(r.getRelatedCharacter().getName())
                .relationshipType(r.getRelationshipType())
                .description(r.getDescription())
                .build()).toList());
        response.setNotes(notes.stream().map(n -> CharacterResponse.NoteResponse.builder()
                .id(n.getId())
                .noteType(n.getNoteType())
                .content(n.getContent())
                .createdAt(n.getCreatedAt())
                .build()).toList());
        response.setTimeline(timeline != null ? timeline : Collections.emptyList());
        return response;
    }

    public CharacterStatisticsResponse toStatistics(Character character, List<Integer> timeline) {
        return CharacterStatisticsResponse.builder()
                .totalDialogues(character.getDialogueCount())
                .totalScenes(character.getSceneCount())
                .firstScene(character.getFirstScene())
                .lastScene(character.getLastScene())
                .totalWordsSpoken(character.getWordsSpoken())
                .estimatedScreenTimeMinutes(character.getDialogueCount())
                .sceneTimeline(timeline)
                .build();
    }
}
