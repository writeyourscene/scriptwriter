package com.scriptwriter.controller;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.CharacterResponse;
import com.scriptwriter.dto.response.CharacterStatisticsResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.enums.CharacterStatus;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.CharacterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping
    public ResponseEntity<ApiResponse<CharacterResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCharacterRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Character created", characterService.create(principal.getUser().getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CharacterResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CharacterStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                characterService.list(principal.getUser().getId(), projectId, search, status)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CharacterSuggestionResponse>>> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long projectId,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                characterService.search(principal.getUser().getId(), projectId, query)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CharacterResponse>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(characterService.getById(principal.getUser().getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CharacterResponse>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCharacterRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Character updated",
                characterService.update(principal.getUser().getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        characterService.delete(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Character deleted", null));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<ApiResponse<CharacterStatisticsResponse>> statistics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(characterService.getStatistics(principal.getUser().getId(), id)));
    }

    @PostMapping("/{id}/relationships")
    public ResponseEntity<ApiResponse<CharacterResponse>> addRelationship(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AddRelationshipRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Relationship added",
                characterService.addRelationship(principal.getUser().getId(), id, request)));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<CharacterResponse>> addNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AddCharacterNoteRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Note added",
                characterService.addNote(principal.getUser().getId(), id, request)));
    }
}
