package com.scriptwriter.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.scriptwriter.enums.ScreenplayElementType;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
public final class ScriptStatsCalculator {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern WORD_PATTERN = Pattern.compile("\\S+");
    private static final int WORDS_PER_PAGE = 250;

    private ScriptStatsCalculator() {}

    public record Stats(int words, int pages, int scenes, int characters, int dialogueCount) {}

    public static Stats calculate(String contentJson) {
        List<Map<String, Object>> elements = parseElements(contentJson);
        int words = 0;
        int scenes = 0;
        int dialogueCount = 0;
        Set<String> characters = new HashSet<>();

        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            String text = element.get("text") != null ? String.valueOf(element.get("text")) : "";

            words += countWords(text);

            if (ScreenplayElementType.SCENE_HEADING.name().equals(type) && !text.isBlank()) {
                scenes++;
            }
            if (ScreenplayElementType.CHARACTER.name().equals(type) && !text.isBlank()) {
                characters.add(text.trim().toUpperCase());
            }
            if (ScreenplayElementType.DIALOGUE.name().equals(type) && !text.isBlank()) {
                dialogueCount++;
            }
        }

        int pages = Math.max(1, (int) Math.ceil(words / (double) WORDS_PER_PAGE));
        return new Stats(words, pages, scenes, characters.size(), dialogueCount);
    }

    public static List<Map<String, Object>> parseElements(String contentJson) {
        try {
            if (contentJson == null || contentJson.isBlank()) {
                return List.of();
            }
            return MAPPER.readValue(contentJson, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Failed to parse script content JSON", e);
            return List.of();
        }
    }

    private static int countWords(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return (int) WORD_PATTERN.matcher(text).results().count();
    }
}
