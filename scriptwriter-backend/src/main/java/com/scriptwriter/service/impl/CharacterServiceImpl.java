package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.CharacterResponse;
import com.scriptwriter.dto.response.CharacterStatisticsResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.entity.Character;
import com.scriptwriter.entity.CharacterAlias;
import com.scriptwriter.entity.CharacterNote;
import com.scriptwriter.entity.CharacterRelationship;
import com.scriptwriter.entity.Project;
import com.scriptwriter.enums.CharacterStatus;
import com.scriptwriter.exception.DuplicateResourceException;
import com.scriptwriter.exception.ProjectNotFoundException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.mapper.CharacterMapper;
import com.scriptwriter.repository.*;
import com.scriptwriter.service.CharacterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterAliasRepository characterAliasRepository;
    private final CharacterRelationshipRepository relationshipRepository;
    private final CharacterNoteRepository characterNoteRepository;
    private final SceneCharacterRepository sceneCharacterRepository;
    private final ProjectRepository projectRepository;
    private final CharacterMapper characterMapper;

    @Override
    @Transactional
    public CharacterResponse create(Long userId, CreateCharacterRequest request) {
        Project project = findOwnedProject(userId, request.getProjectId());
        String name = request.getName().trim().toUpperCase();

        if (characterRepository.existsByProjectIdAndNameIgnoreCase(project.getId(), name)) {
            throw new DuplicateResourceException("Character already exists: " + name);
        }

        Character character = Character.builder()
                .project(project)
                .name(name)
                .alias(request.getAlias())
                .nickname(request.getNickname())
                .age(request.getAge())
                .gender(request.getGender())
                .occupation(request.getOccupation())
                .personality(request.getPersonality())
                .description(request.getDescription())
                .goals(request.getGoals())
                .weaknesses(request.getWeaknesses())
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : CharacterStatus.SUPPORTING)
                .build();
        character.setCreatedBy(userId);
        character = characterRepository.save(character);

        saveAliases(character, request.getAliases());
        log.info("Character created: {} in project {}", name, project.getId());
        return getDetailed(character);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterResponse> list(Long userId, Long projectId, String search, CharacterStatus status) {
        findOwnedProject(userId, projectId);
        String searchTerm = search != null && !search.isBlank() ? search.trim() : null;
        return characterRepository.searchCharacters(projectId, userId, searchTerm, status).stream()
                .map(characterMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CharacterResponse getById(Long userId, Long id) {
        return getDetailed(findOwnedCharacter(userId, id));
    }

    @Override
    @Transactional
    public CharacterResponse update(Long userId, Long id, UpdateCharacterRequest request) {
        Character character = findOwnedCharacter(userId, id);

        if (request.getName() != null && !request.getName().equalsIgnoreCase(character.getName())) {
            String name = request.getName().trim().toUpperCase();
            if (characterRepository.existsByProjectIdAndNameIgnoreCase(character.getProject().getId(), name)) {
                throw new DuplicateResourceException("Character name already taken");
            }
            character.setName(name);
        }
        if (request.getAlias() != null) character.setAlias(request.getAlias());
        if (request.getNickname() != null) character.setNickname(request.getNickname());
        if (request.getAge() != null) character.setAge(request.getAge());
        if (request.getGender() != null) character.setGender(request.getGender());
        if (request.getOccupation() != null) character.setOccupation(request.getOccupation());
        if (request.getPersonality() != null) character.setPersonality(request.getPersonality());
        if (request.getDescription() != null) character.setDescription(request.getDescription());
        if (request.getGoals() != null) character.setGoals(request.getGoals());
        if (request.getWeaknesses() != null) character.setWeaknesses(request.getWeaknesses());
        if (request.getImageUrl() != null) character.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) character.setStatus(request.getStatus());
        character.setUpdatedBy(userId);

        if (request.getAliases() != null) {
            characterAliasRepository.deleteByCharacterId(character.getId());
            saveAliases(character, request.getAliases());
        }

        return getDetailed(characterRepository.save(character));
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        Character character = findOwnedCharacter(userId, id);
        characterAliasRepository.deleteByCharacterId(id);
        characterRepository.delete(character);
        log.info("Character deleted: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterSuggestionResponse> search(Long userId, Long projectId, String query) {
        findOwnedProject(userId, projectId);
        return characterRepository.searchCharacters(projectId, userId, query, null).stream()
                .map(c -> CharacterSuggestionResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .alias(c.getAlias())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CharacterStatisticsResponse getStatistics(Long userId, Long id) {
        Character character = findOwnedCharacter(userId, id);
        List<Integer> timeline = getTimeline(character.getId());
        return characterMapper.toStatistics(character, timeline);
    }

    @Override
    @Transactional
    public CharacterResponse addRelationship(Long userId, Long id, AddRelationshipRequest request) {
        Character character = findOwnedCharacter(userId, id);
        Character related = findOwnedCharacter(userId, request.getRelatedCharacterId());

        relationshipRepository.save(CharacterRelationship.builder()
                .character(character)
                .relatedCharacter(related)
                .relationshipType(request.getRelationshipType())
                .description(request.getDescription())
                .build());

        return getDetailed(character);
    }

    @Override
    @Transactional
    public CharacterResponse addNote(Long userId, Long id, AddCharacterNoteRequest request) {
        Character character = findOwnedCharacter(userId, id);
        characterNoteRepository.save(CharacterNote.builder()
                .character(character)
                .noteType(request.getNoteType())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build());
        return getDetailed(character);
    }

    private CharacterResponse getDetailed(Character character) {
        List<CharacterAlias> aliases = characterAliasRepository.findByCharacterId(character.getId());
        List<CharacterRelationship> relationships = relationshipRepository.findByCharacterId(character.getId());
        List<CharacterNote> notes = characterNoteRepository.findByCharacterIdOrderByCreatedAtDesc(character.getId());
        List<Integer> timeline = getTimeline(character.getId());
        return characterMapper.toDetailedResponse(character, aliases, relationships, notes, timeline);
    }

    private List<Integer> getTimeline(Long characterId) {
        return sceneCharacterRepository.findByCharacterIdOrderByScene_SceneNumberAsc(characterId).stream()
                .map(sc -> sc.getScene().getSceneNumber())
                .toList();
    }

    private void saveAliases(Character character, List<String> aliases) {
        if (aliases == null) return;
        for (String alias : aliases) {
            if (alias != null && !alias.isBlank()) {
                characterAliasRepository.save(CharacterAlias.builder()
                        .character(character)
                        .aliasName(alias.trim())
                        .build());
            }
        }
    }

    private Project findOwnedProject(Long userId, Long projectId) {
        return projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private Character findOwnedCharacter(Long userId, Long id) {
        return characterRepository.findByIdAndProjectOwnerId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
    }
}
