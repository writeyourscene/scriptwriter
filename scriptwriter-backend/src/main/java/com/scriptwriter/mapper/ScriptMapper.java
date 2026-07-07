package com.scriptwriter.mapper;

import com.scriptwriter.dto.response.ScriptResponse;
import com.scriptwriter.dto.response.ScriptStatisticsResponse;
import com.scriptwriter.dto.response.ScriptVersionResponse;
import com.scriptwriter.entity.Script;
import com.scriptwriter.entity.ScriptVersion;
import org.springframework.stereotype.Component;

@Component
public class ScriptMapper {

    public ScriptResponse toResponse(Script script) {
        return ScriptResponse.builder()
                .id(script.getId())
                .projectId(script.getProject().getId())
                .title(script.getTitle())
                .synopsis(script.getSynopsis())
                .content(script.getContent())
                .fontFamily(script.getFontFamily())
                .currentVersion(script.getCurrentVersion())
                .statistics(ScriptStatisticsResponse.builder()
                        .pages(script.getPageCount())
                        .words(script.getWordCount())
                        .scenes(script.getSceneCount())
                        .characters(script.getCharacterCount())
                        .dialogueCount(script.getDialogueCount())
                        .estimatedRuntimeMinutes(estimateRuntime(script.getPageCount()))
                        .build())
                .createdAt(script.getCreatedAt())
                .updatedAt(script.getUpdatedAt())
                .isShared(script.isShared())
                .build();
    }

    public ScriptVersionResponse toVersionResponse(ScriptVersion version) {
        return ScriptVersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .label(version.getLabel())
                .createdBy(version.getCreatedBy())
                .createdAt(version.getCreatedAt())
                .build();
    }

    private Integer estimateRuntime(int pages) {
        return pages > 0 ? pages : null;
    }
}
