package com.scriptwriter.util;


import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SlugLineParser {

    private static final Pattern SLUG_PATTERN = Pattern.compile(
            "^(INT\\./EXT\\.|INT\\.|EXT\\.|EST\\.)\\s*(.+?)(?:\\s*[-–—]\\s*(.+))?$",
            Pattern.CASE_INSENSITIVE
    );

    private SlugLineParser() {}

    public record ParsedSlug(String prefix, String location, String timeOfDay) {}

    public static ParsedSlug parse(String slugLine) {
        if (slugLine == null || slugLine.isBlank()) {
            return new ParsedSlug("", "", "");
        }
        Matcher matcher = SLUG_PATTERN.matcher(slugLine.trim().toUpperCase());
        if (matcher.find()) {
            return new ParsedSlug(
                    matcher.group(1).trim(),
                    matcher.group(2) != null ? matcher.group(2).trim() : "",
                    matcher.group(3) != null ? matcher.group(3).trim() : ""
            );
        }
        return new ParsedSlug("", slugLine.trim(), "");
    }

    public static int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }
}
