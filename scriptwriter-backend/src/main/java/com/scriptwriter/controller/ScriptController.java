package com.scriptwriter.controller;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.request.RestoreVersionRequest;
import com.scriptwriter.dto.request.SaveScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.dto.response.ScriptResponse;
import com.scriptwriter.dto.response.ScriptVersionResponse;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.ScriptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    @GetMapping("/api/v1/projects/{projectId}/script")
    public ResponseEntity<ApiResponse<ScriptResponse>> getOrCreateScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.getOrCreateForProject(principal.getUser().getId(), projectId)));
    }

    @GetMapping("/api/v1/scripts/{id}")
    public ResponseEntity<ApiResponse<ScriptResponse>> getScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.getScript(principal.getUser().getId(), id)));
    }

    @PutMapping("/api/v1/scripts/{id}")
    public ResponseEntity<ApiResponse<ScriptResponse>> saveScript(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SaveScriptRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Script saved",
                scriptService.saveScript(principal.getUser().getId(), id, request, false)));
    }

    @PostMapping("/api/v1/scripts/{id}/autosave")
    public ResponseEntity<ApiResponse<ScriptResponse>> autosave(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SaveScriptRequest request
    ) {
        request.setCreateVersion(false);
        return ResponseEntity.ok(ApiResponse.success("Auto-saved",
                scriptService.saveScript(principal.getUser().getId(), id, request, true)));
    }

    @GetMapping("/api/v1/scripts/{id}/versions")
    public ResponseEntity<ApiResponse<List<ScriptVersionResponse>>> getVersions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.getVersions(principal.getUser().getId(), id)));
    }

    @PostMapping("/api/v1/scripts/{id}/restore-version")
    public ResponseEntity<ApiResponse<ScriptResponse>> restoreVersion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RestoreVersionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Version restored",
                scriptService.restoreVersion(principal.getUser().getId(), id, request)));
    }

    @PostMapping("/api/v1/scripts/{id}/switch-version")
    public ResponseEntity<ApiResponse<ScriptResponse>> switchVersion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RestoreVersionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Version switched",
                scriptService.switchVersion(principal.getUser().getId(), id, request.getVersionNumber())));
    }

    @GetMapping("/api/v1/scripts/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "a4") String pageSize,
            @RequestParam(required = false) String watermark
    ) {
        byte[] pdf = scriptService.exportPdf(principal.getUser().getId(), id, pageSize, watermark);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/api/v1/scripts/{id}/export/docx")
    public ResponseEntity<byte[]> exportDocx(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "a4") String pageSize
    ) {
        byte[] docx = scriptService.exportDocx(principal.getUser().getId(), id, pageSize);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay.docx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(docx);
    }

    @PostMapping("/api/v1/scripts/{id}/ai")
    public ResponseEntity<ApiResponse<AiResponse>> aiAssist(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AiScriptRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.aiAssist(principal.getUser().getId(), id, request)));
    }

    @GetMapping("/api/v1/scripts/{id}/characters")
    public ResponseEntity<ApiResponse<List<CharacterSuggestionResponse>>> characterSuggestions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.getCharacterSuggestions(principal.getUser().getId(), id, query)));
    }

    @PutMapping("/api/v1/scripts/{id}/share")
    public ResponseEntity<ApiResponse<ScriptResponse>> toggleShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam boolean isShared
    ) {
        return ResponseEntity.ok(ApiResponse.success("Share status updated",
                scriptService.toggleShare(principal.getUser().getId(), id, isShared)));
    }

    @GetMapping("/api/v1/public/scripts/{id}")
    public ResponseEntity<ApiResponse<ScriptResponse>> getSharedScript(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                scriptService.getSharedScript(id)));
    }

    @GetMapping("/api/v1/public/scripts/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPublicPdf(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "a4") String pageSize,
            @RequestParam(required = false) String watermark
    ) {
        byte[] pdf = scriptService.exportPdf(null, id, pageSize, watermark);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/api/v1/public/scripts/{id}/export/docx")
    public ResponseEntity<byte[]> exportPublicDocx(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "a4") String pageSize
    ) {
        byte[] docx = scriptService.exportDocx(null, id, pageSize);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=screenplay.docx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(docx);
    }

    @PostMapping("/api/v1/scripts/{id}/import")
    public ResponseEntity<ApiResponse<ScriptResponse>> importScriptFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success("Screenplay imported successfully",
                scriptService.importFile(principal.getUser().getId(), id, file)));
    }
}
