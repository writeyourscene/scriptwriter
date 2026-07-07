package com.scriptwriter.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.scriptwriter.enums.ScreenplayElementType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ScreenplayParser {

    private ScreenplayParser() {}

    public static String parseToContentJson(String rawText) {
        List<Map<String, String>> blocks = new ArrayList<>();
        if (rawText == null || rawText.isBlank()) {
            return "[]";
        }
        
        String[] lines = rawText.split("\\r?\\n");

        boolean lastLineWasEmpty = true;
        boolean expectingDialogue = false;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                lastLineWasEmpty = true;
                continue;
            }

            ScreenplayElementType type = ScreenplayElementType.ACTION;
            String text = line;

            String upperLine = line.toUpperCase();
            if (upperLine.startsWith("INT.") || upperLine.startsWith("EXT.") || 
                upperLine.startsWith("INT/EXT.") || upperLine.startsWith("EXT/INT.") ||
                upperLine.startsWith("I/E.")) {
                type = ScreenplayElementType.SCENE_HEADING;
                expectingDialogue = false;
            } else if (line.startsWith("(") && line.endsWith(")")) {
                type = ScreenplayElementType.PARENTHETICAL;
            } else if (upperLine.endsWith(":") && (upperLine.contains("CUT TO") || upperLine.contains("FADE") || upperLine.contains("TO:"))) {
                type = ScreenplayElementType.TRANSITION;
                expectingDialogue = false;
            } else if (isAllUpperCase(line) && line.length() < 50 && lastLineWasEmpty && i + 1 < lines.length && !lines[i + 1].trim().isEmpty()) {
                type = ScreenplayElementType.CHARACTER;
                expectingDialogue = true;
            } else if (expectingDialogue && !lastLineWasEmpty) {
                type = ScreenplayElementType.DIALOGUE;
            } else {
                type = ScreenplayElementType.ACTION;
                expectingDialogue = false;
            }

            Map<String, String> block = new HashMap<>();
            block.put("id", "b-" + UUID.randomUUID().toString().substring(0, 8));
            block.put("type", type.name());
            block.put("text", text);
            blocks.add(block);

            lastLineWasEmpty = false;
        }

        // If no blocks were parsed, add a default start block
        if (blocks.isEmpty()) {
            Map<String, String> block = new HashMap<>();
            block.put("id", "b-" + UUID.randomUUID().toString().substring(0, 8));
            block.put("type", ScreenplayElementType.ACTION.name());
            block.put("text", rawText.trim());
            blocks.add(block);
        }

        try {
            return new ObjectMapper().writeValueAsString(blocks);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static boolean isAllUpperCase(String str) {
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            if (Character.isLetter(c) && !Character.isUpperCase(c)) {
                return false;
            }
        }
        return true;
    }
}
