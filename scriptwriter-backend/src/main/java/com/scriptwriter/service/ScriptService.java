package com.scriptwriter.service;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.request.RestoreVersionRequest;
import com.scriptwriter.dto.request.SaveScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.dto.response.ScriptResponse;
import com.scriptwriter.dto.response.ScriptVersionResponse;

import java.util.List;

public interface ScriptService {

    ScriptResponse getOrCreateForProject(Long userId, Long projectId);

    ScriptResponse getScript(Long userId, Long scriptId);

    ScriptResponse saveScript(Long userId, Long scriptId, SaveScriptRequest request, boolean autosave);

    List<ScriptVersionResponse> getVersions(Long userId, Long scriptId);

    ScriptResponse restoreVersion(Long userId, Long scriptId, RestoreVersionRequest request);

    byte[] exportPdf(Long userId, Long scriptId, String pageSize, String watermark);

    byte[] exportDocx(Long userId, Long scriptId, String pageSize);

    AiResponse aiAssist(Long userId, Long scriptId, AiScriptRequest request);

    List<CharacterSuggestionResponse> getCharacterSuggestions(Long userId, Long scriptId, String query);

    ScriptResponse toggleShare(Long userId, Long scriptId, boolean isShared);

    ScriptResponse getSharedScript(Long scriptId);

    ScriptResponse importFile(Long userId, Long scriptId, org.springframework.web.multipart.MultipartFile file);

    ScriptResponse switchVersion(Long userId, Long scriptId, int versionNumber);
}
