package com.scriptwriter.controller;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiResponse>> chat(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiScriptRequest request
    ) {
        request.setType(com.scriptwriter.enums.AiRequestType.CHAT);
        return ResponseEntity.ok(ApiResponse.success(
                aiService.process(principal.getUser(), null, request)));
    }

    @PostMapping("/grammar")
    public ResponseEntity<ApiResponse<AiResponse>> grammar(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiScriptRequest request
    ) {
        request.setType(com.scriptwriter.enums.AiRequestType.GRAMMAR);
        return ResponseEntity.ok(ApiResponse.success(
                aiService.process(principal.getUser(), null, request)));
    }

    @PostMapping("/dialogue")
    public ResponseEntity<ApiResponse<AiResponse>> dialogue(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AiScriptRequest request
    ) {
        request.setType(com.scriptwriter.enums.AiRequestType.DIALOGUE);
        return ResponseEntity.ok(ApiResponse.success(
                aiService.process(principal.getUser(), null, request)));
    }
}
