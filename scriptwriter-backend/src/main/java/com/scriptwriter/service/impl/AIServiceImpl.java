package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.entity.AiHistory;
import com.scriptwriter.entity.Script;
import com.scriptwriter.entity.User;
import com.scriptwriter.repository.AiHistoryRepository;
import com.scriptwriter.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final AiHistoryRepository aiHistoryRepository;

    @Value("${ai.provider:stub}")
    private String aiProvider;

    @Override
    @Transactional
    public AiResponse process(User user, Script script, AiScriptRequest request) {
        long start = System.currentTimeMillis();
        String result = generateStubResponse(request);
        long elapsed = System.currentTimeMillis() - start;

        AiHistory history = AiHistory.builder()
                .user(user)
                .script(script)
                .requestType(request.getType())
                .prompt(request.getPrompt())
                .response(result)
                .responseTimeMs(elapsed)
                .build();
        history = aiHistoryRepository.save(history);

        log.info("AI request type={} provider={} time={}ms user={}", request.getType(), aiProvider, elapsed, user.getEmail());

        return AiResponse.builder()
                .result(result)
                .explanation("AI provider is in stub mode. Configure OPENAI_API_KEY or GEMINI_API_KEY for live responses.")
                .historyId(history.getId())
                .build();
    }

    private String generateStubResponse(AiScriptRequest request) {
        String text = request.getSelectedText() != null && !request.getSelectedText().isBlank()
                ? request.getSelectedText()
                : request.getPrompt();

        return switch (request.getType()) {
            case GRAMMAR, SPELLING -> text.trim();
            case DIALOGUE -> (request.getCharacterName() != null ? request.getCharacterName().toUpperCase() : "CHARACTER")
                    + "\n\nI need to think about this carefully.";
            case CONTINUE -> text + "\n\nThe scene continues with rising tension.";
            case REWRITE -> "Revised: " + text;
            case SCENE -> "INT. NEW LOCATION - DAY\n\nAction continues the story.";
            case CHARACTER -> "Suggested name: ARJUN\nAge: 32\nRole: Protagonist";
            case STORY -> "Story suggestion: A conflict emerges that forces the protagonist to choose between duty and desire.";
            case ANALYZE -> "Analysis: Pacing is steady. Consider strengthening the midpoint conflict and clarifying character motivations in Act 2.";
            default -> "AI assistant is ready. Connect an AI provider to enable full responses.\n\nYour prompt: " + request.getPrompt();
        };
    }
}
