package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.AiScriptRequest;
import com.scriptwriter.dto.request.RestoreVersionRequest;
import com.scriptwriter.dto.request.SaveScriptRequest;
import com.scriptwriter.dto.response.AiResponse;
import com.scriptwriter.dto.response.CharacterSuggestionResponse;
import com.scriptwriter.dto.response.ScriptResponse;
import com.scriptwriter.dto.response.ScriptVersionResponse;
import com.scriptwriter.entity.Project;
import com.scriptwriter.entity.Script;
import com.scriptwriter.entity.ScriptVersion;
import com.scriptwriter.entity.User;
import com.scriptwriter.exception.ProjectNotFoundException;
import com.scriptwriter.exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import com.scriptwriter.mapper.ScriptMapper;
import com.scriptwriter.repository.CharacterRepository;
import com.scriptwriter.repository.ProjectRepository;
import com.scriptwriter.repository.ScriptRepository;
import com.scriptwriter.repository.ScriptVersionRepository;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.service.AIService;
import com.scriptwriter.service.ScriptContentSyncService;
import com.scriptwriter.service.ScriptService;
import com.scriptwriter.util.ScreenplayPdfExporter;
import com.scriptwriter.util.ScriptStatsCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.scriptwriter.util.FileTextExtractor;
import com.scriptwriter.util.ScreenplayParser;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScriptServiceImpl implements ScriptService {

    private static final String DEFAULT_CONTENT = """
            [{"id":"b1","type":"TITLE_PAGE","text":"Untitled Screenplay\\nWritten by\\nAuthor"},{"id":"b2","type":"SCENE_HEADING","text":"INT. LOCATION - DAY"},{"id":"b3","type":"ACTION","text":""}]""";

    private final ScriptRepository scriptRepository;
    private final ScriptVersionRepository scriptVersionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CharacterRepository characterRepository;
    private final ScriptMapper scriptMapper;
    private final AIService aiService;
    private final ScriptContentSyncService scriptContentSyncService;

    @Override
    @Transactional
    public ScriptResponse getOrCreateForProject(Long userId, Long projectId) {
        Project project = findOwnedProject(userId, projectId);

        Script script = scriptRepository.findByProjectId(projectId).orElseGet(() -> {
            Script newScript = Script.builder()
                    .project(project)
                    .title(project.getTitle())
                    .content(DEFAULT_CONTENT)
                    .currentVersion(1)
                    .build();
            newScript.setCreatedBy(userId);
            Script saved = scriptRepository.save(newScript);
            createVersion(saved, userId, "Initial version");
            scriptContentSyncService.syncFromScriptContent(saved, userId);
            updateStats(saved);
            return scriptRepository.save(saved);
        });

        return scriptMapper.toResponse(script);
    }

    @Override
    @Transactional(readOnly = true)
    public ScriptResponse getScript(Long userId, Long scriptId) {
        return scriptMapper.toResponse(findOwnedScript(userId, scriptId));
    }

    @Override
    @Transactional
    public ScriptResponse saveScript(Long userId, Long scriptId, SaveScriptRequest request, boolean autosave) {
        Script script = findOwnedScript(userId, scriptId);
        script.setContent(request.getContent());
        if (request.getTitle() != null) {
            script.setTitle(request.getTitle());
        }
        if (request.getSynopsis() != null) {
            script.setSynopsis(request.getSynopsis());
        }
        if (request.getFontFamily() != null) {
            script.setFontFamily(request.getFontFamily());
        }
        script.setUpdatedBy(userId);
        updateStats(script);
        scriptContentSyncService.syncFromScriptContent(script, userId);

        if (request.isCreateVersion()) {
            // 1. Sync current version's snapshot first with current content before creating the new version
            scriptVersionRepository.findByScriptIdAndVersionNumber(script.getId(), script.getCurrentVersion())
                    .ifPresent(v -> {
                        v.setContentSnapshot(request.getContent());
                        scriptVersionRepository.save(v);
                    });

            // 2. Increment active version and clear/reset content for the new draft
            script.setCurrentVersion(script.getCurrentVersion() + 1);
            String label = request.getVersionLabel() != null && !request.getVersionLabel().isBlank()
                    ? request.getVersionLabel()
                    : (autosave ? "Auto-save snapshot" : "Manual save");

            String cleanTitle = script.getTitle() != null ? script.getTitle().replace("\"", "\\\"").replace("\n", "\\n") : "Untitled Screenplay";
            String blankContent = "[{\"id\":\"b1\",\"type\":\"TITLE_PAGE\",\"text\":\"" + cleanTitle + "\\nWritten by\\nAuthor\"},{\"id\":\"b2\",\"type\":\"SCENE_HEADING\",\"text\":\"INT. LOCATION - DAY\"},{\"id\":\"b3\",\"type\":\"ACTION\",\"text\":\"\"}]";
            script.setContent(blankContent);
            
            // 3. Create the new version's snapshot record
            createVersion(script, userId, label);
        } else {
            // Regularly update active version snapshot on autosave/save
            scriptVersionRepository.findByScriptIdAndVersionNumber(script.getId(), script.getCurrentVersion())
                    .ifPresent(v -> {
                        v.setContentSnapshot(request.getContent());
                        scriptVersionRepository.save(v);
                    });
        }

        Script saved = scriptRepository.save(script);
        log.info("Script {} saved (autosave={}) by user {}", scriptId, autosave, userId);
        return scriptMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScriptVersionResponse> getVersions(Long userId, Long scriptId) {
        findOwnedScript(userId, scriptId);
        return scriptVersionRepository.findByScriptIdOrderByVersionNumberDesc(scriptId).stream()
                .map(scriptMapper::toVersionResponse)
                .toList();
    }

    @Override
    @Transactional
    public ScriptResponse restoreVersion(Long userId, Long scriptId, RestoreVersionRequest request) {
        Script script = findOwnedScript(userId, scriptId);
        ScriptVersion version = scriptVersionRepository
                .findByScriptIdAndVersionNumber(scriptId, request.getVersionNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));

        script.setContent(version.getContentSnapshot());
        script.setCurrentVersion(script.getCurrentVersion() + 1);
        script.setUpdatedBy(userId);
        updateStats(script);
        scriptContentSyncService.syncFromScriptContent(script, userId);
        createVersion(script, userId, "Restored from v" + request.getVersionNumber());
        return scriptMapper.toResponse(scriptRepository.save(script));
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPdf(Long userId, Long scriptId, String pageSize, String watermark) {
        // Query database for script entity
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));
        if (userId != null) {
            if (!script.getProject().getOwner().getId().equals(userId)) {
                throw new AccessDeniedException("You do not own this script");
            }
        } else {
            if (!script.isShared()) {
                throw new AccessDeniedException("This script is not shared publicly");
            }
        }
        try {
            return ScreenplayPdfExporter.export(script.getTitle(), script.getContent(), pageSize, script.getFontFamily(), watermark);
        } catch (Exception e) {
            throw new RuntimeException("PDF export failed", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDocx(Long userId, Long scriptId, String pageSize) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));
        if (userId != null) {
            if (!script.getProject().getOwner().getId().equals(userId)) {
                throw new AccessDeniedException("You do not own this script");
            }
        } else {
            if (!script.isShared()) {
                throw new AccessDeniedException("This script is not shared publicly");
            }
        }
        try {
            return com.scriptwriter.util.ScreenplayDocxExporter.export(script.getTitle(), script.getContent(), pageSize, script.getFontFamily());
        } catch (Exception e) {
            throw new RuntimeException("DOCX export failed", e);
        }
    }

    @Override
    @Transactional
    public AiResponse aiAssist(Long userId, Long scriptId, AiScriptRequest request) {
        Script script = findOwnedScript(userId, scriptId);
        User user = findUser(userId);
        return aiService.process(user, script, request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CharacterSuggestionResponse> getCharacterSuggestions(Long userId, Long scriptId, String query) {
        Script script = findOwnedScript(userId, scriptId);
        return characterRepository.findByProjectIdOrderByNameAsc(script.getProject().getId()).stream()
                .filter(c -> query == null || query.isBlank()
                        || c.getName().toUpperCase().startsWith(query.toUpperCase()))
                .map(c -> CharacterSuggestionResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .alias(c.getAlias())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public ScriptResponse toggleShare(Long userId, Long scriptId, boolean isShared) {
        Script script = findOwnedScript(userId, scriptId);
        script.setIsShared(isShared);
        return scriptMapper.toResponse(scriptRepository.save(script));
    }

    @Override
    @Transactional(readOnly = true)
    public ScriptResponse getSharedScript(Long scriptId) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));
        if (!script.isShared()) {
            throw new ResourceNotFoundException("This script is not shared publicly");
        }
        return scriptMapper.toResponse(script);
    }

    @Override
    @Transactional
    public ScriptResponse importFile(Long userId, Long scriptId, MultipartFile file) {
        Script script = findOwnedScript(userId, scriptId);
        try {
            String rawText = FileTextExtractor.extract(file.getInputStream(), file.getOriginalFilename());
            String jsonContent = ScreenplayParser.parseToContentJson(rawText);
            script.setContent(jsonContent);
            updateStats(script);
            
            Script savedScript = scriptRepository.save(script);
            scriptContentSyncService.syncFromScriptContent(savedScript, userId);
            
            return scriptMapper.toResponse(savedScript);
        } catch (Exception e) {
            log.error("Failed to import screenplay file", e);
            throw new RuntimeException("Failed to import screenplay: " + e.getMessage(), e);
        }
    }

    private void updateStats(Script script) {
        ScriptStatsCalculator.Stats stats = ScriptStatsCalculator.calculate(script.getContent());
        script.setWordCount(stats.words());
        script.setPageCount(stats.pages());
        script.setSceneCount(stats.scenes());
        script.setCharacterCount(stats.characters());
        script.setDialogueCount(stats.dialogueCount());
    }

    private void createVersion(Script script, Long userId, String label) {
        scriptVersionRepository.save(ScriptVersion.builder()
                .script(script)
                .versionNumber(script.getCurrentVersion())
                .contentSnapshot(script.getContent())
                .createdBy(userId)
                .label(label)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private Project findOwnedProject(Long userId, Long projectId) {
        return projectRepository.findByIdAndOwnerIdAndDeletedFalse(projectId, userId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private Script findOwnedScript(Long userId, Long scriptId) {
        return scriptRepository.findByIdAndProjectOwnerId(scriptId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Script not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    @Transactional
    public ScriptResponse switchVersion(Long userId, Long scriptId, int versionNumber) {
        Script script = findOwnedScript(userId, scriptId);
        
        // 1. Sync current version snapshot first before switching
        scriptVersionRepository.findByScriptIdAndVersionNumber(scriptId, script.getCurrentVersion())
                .ifPresent(v -> {
                    v.setContentSnapshot(script.getContent());
                    scriptVersionRepository.save(v);
                });
        
        // 2. Fetch target version
        ScriptVersion targetVersion = scriptVersionRepository
                .findByScriptIdAndVersionNumber(scriptId, versionNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Target version not found"));
        
        // 3. Apply target version state
        script.setContent(targetVersion.getContentSnapshot());
        script.setCurrentVersion(versionNumber);
        script.setUpdatedBy(userId);
        updateStats(script);
        scriptContentSyncService.syncFromScriptContent(script, userId);
        
        return scriptMapper.toResponse(scriptRepository.save(script));
    }
}
