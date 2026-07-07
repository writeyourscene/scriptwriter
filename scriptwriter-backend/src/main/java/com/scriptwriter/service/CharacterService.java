package com.scriptwriter.service;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.CharacterResponse;
import com.scriptwriter.dto.response.CharacterStatisticsResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.enums.CharacterStatus;

import java.util.List;

public interface CharacterService {

    CharacterResponse create(Long userId, CreateCharacterRequest request);

    List<CharacterResponse> list(Long userId, Long projectId, String search, CharacterStatus status);

    CharacterResponse getById(Long userId, Long id);

    CharacterResponse update(Long userId, Long id, UpdateCharacterRequest request);

    void delete(Long userId, Long id);

    List<CharacterSuggestionResponse> search(Long userId, Long projectId, String query);

    CharacterStatisticsResponse getStatistics(Long userId, Long id);

    CharacterResponse addRelationship(Long userId, Long id, AddRelationshipRequest request);

    CharacterResponse addNote(Long userId, Long id, AddCharacterNoteRequest request);
}
