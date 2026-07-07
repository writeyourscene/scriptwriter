package com.scriptwriter.controller;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.SceneResponse;
import com.scriptwriter.dto.response.SceneStatisticsResponse;
import com.scriptwriter.enums.SceneStatus;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.SceneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scenes")
@RequiredArgsConstructor
public class SceneController {

    private final SceneService sceneService;

    @PostMapping
    public ResponseEntity<ApiResponse<SceneResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateSceneRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Scene created", sceneService.create(principal.getUser().getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SceneResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long projectId,
            @RequestParam(required = false) Long scriptId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SceneStatus status,
            @RequestParam(required = false) Boolean favorite
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sceneService.list(principal.getUser().getId(), projectId, scriptId, search, status, favorite)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SceneResponse>> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(sceneService.getById(principal.getUser().getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SceneResponse>> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateSceneRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Scene updated",
                sceneService.update(principal.getUser().getId(), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        sceneService.delete(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Scene deleted", null));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<List<SceneResponse>>> reorder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReorderScenesRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Scenes reordered",
                sceneService.reorder(principal.getUser().getId(), request)));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<ApiResponse<SceneStatisticsResponse>> statistics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(sceneService.getStatistics(principal.getUser().getId(), id)));
    }
}
