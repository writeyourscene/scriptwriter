package com.scriptwriter.service.impl;

import com.scriptwriter.entity.Character;
import com.scriptwriter.entity.Scene;
import com.scriptwriter.entity.SceneCharacter;
import com.scriptwriter.entity.Script;
import com.scriptwriter.enums.ScreenplayElementType;
import com.scriptwriter.repository.CharacterRepository;
import com.scriptwriter.repository.SceneCharacterRepository;
import com.scriptwriter.repository.SceneRepository;
import com.scriptwriter.service.ScriptContentSyncService;
import com.scriptwriter.util.ScriptStatsCalculator;
import com.scriptwriter.util.SlugLineParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScriptContentSyncServiceImpl implements ScriptContentSyncService {

    private final CharacterRepository characterRepository;
    private final SceneRepository sceneRepository;
    private final SceneCharacterRepository sceneCharacterRepository;

    @Override
    @Transactional
    public void syncFromScriptContent(Script script, Long userId) {
        List<Map<String, Object>> elements = ScriptStatsCalculator.parseElements(script.getContent());
        List<SceneData> sceneDataList = parseScenes(elements);

        List<Scene> existingScenes = sceneRepository.findByScriptIdOrderBySortOrderAsc(script.getId());
        for (Scene existing : existingScenes) {
            sceneCharacterRepository.deleteBySceneId(existing.getId());
        }
        sceneRepository.deleteByScriptId(script.getId());

        Map<String, CharacterStats> characterStatsMap = new HashMap<>();
        
        // Find all characters present in CHARACTER elements throughout the script
        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            String text = element.get("text") != null ? String.valueOf(element.get("text")).trim() : "";
            if (ScreenplayElementType.CHARACTER.name().equals(type) && !text.isBlank()) {
                characterStatsMap.put(text.toUpperCase(), new CharacterStats());
            }
        }

        int sceneNum = 0;

        for (SceneData sceneData : sceneDataList) {
            sceneNum++;
            SlugLineParser.ParsedSlug parsed = SlugLineParser.parse(sceneData.slugLine());

            Scene scene = Scene.builder()
                    .project(script.getProject())
                    .script(script)
                    .sceneNumber(sceneNum)
                    .slugLine(sceneData.slugLine())
                    .location(parsed.location())
                    .timeOfDay(parsed.timeOfDay())
                    .description(sceneData.actionText())
                    .wordCount(sceneData.wordCount())
                    .dialogueCount(sceneData.dialogueCount())
                    .sortOrder(sceneNum)
                    .build();
            scene.setCreatedBy(userId);
            scene = sceneRepository.save(scene);

            int speakingOrder = 0;
            for (String charName : sceneData.characters()) {
                Character character = upsertCharacter(script, charName, userId);
                CharacterStats stats = characterStatsMap.computeIfAbsent(charName, k -> new CharacterStats());
                stats.scenes.add(sceneNum);
                stats.dialogueCount += sceneData.dialogueCountFor(charName);
                stats.wordsSpoken += sceneData.wordsFor(charName);

                sceneCharacterRepository.save(SceneCharacter.builder()
                        .scene(scene)
                        .character(character)
                        .dialogueCount(sceneData.dialogueCountFor(charName))
                        .speakingOrder(++speakingOrder)
                        .build());
            }
        }

        for (Map.Entry<String, CharacterStats> entry : characterStatsMap.entrySet()) {
            Character character = upsertCharacter(script, entry.getKey(), userId);
            CharacterStats stats = entry.getValue();
            character.setDialogueCount(stats.dialogueCount);
            character.setSceneCount(stats.scenes.size());
            character.setWordsSpoken(stats.wordsSpoken);
            character.setFirstScene(stats.scenes.stream().min(Comparator.comparingInt(i -> i)).orElse(null));
            character.setLastScene(stats.scenes.stream().max(Comparator.comparingInt(i -> i)).orElse(null));
            character.setUpdatedBy(userId);
            characterRepository.save(character);
        }

        // Clean up characters that are no longer in the script
        List<Character> existingProjectChars = characterRepository.findByProjectIdOrderByNameAsc(script.getProject().getId());
        for (Character character : existingProjectChars) {
            String nameUpper = character.getName().trim().toUpperCase();
            if (!characterStatsMap.containsKey(nameUpper)) {
                sceneCharacterRepository.deleteByCharacterId(character.getId());
                characterRepository.delete(character);
            }
        }

        log.debug("Synced {} scenes and {} characters for script {}", sceneNum, characterStatsMap.size(), script.getId());
    }

    private Character upsertCharacter(Script script, String name, Long userId) {
        String normalized = name.trim().toUpperCase();
        return characterRepository.findByProjectIdAndNameIgnoreCase(script.getProject().getId(), normalized)
                .orElseGet(() -> {
                    Character c = Character.builder()
                            .project(script.getProject())
                            .name(normalized)
                            .build();
                    c.setCreatedBy(userId);
                    return characterRepository.save(c);
                });
    }

    private List<SceneData> parseScenes(List<Map<String, Object>> elements) {
        List<SceneData> scenes = new ArrayList<>();
        SceneData current = null;
        String currentCharacter = null;

        for (Map<String, Object> element : elements) {
            String type = String.valueOf(element.get("type"));
            String text = element.get("text") != null ? String.valueOf(element.get("text")).trim() : "";

            if (ScreenplayElementType.SCENE_HEADING.name().equals(type) && !text.isBlank()) {
                if (current != null) scenes.add(current);
                current = new SceneData(text);
                currentCharacter = null;
            } else if (current != null) {
                if (ScreenplayElementType.CHARACTER.name().equals(type) && !text.isBlank()) {
                    currentCharacter = text.toUpperCase();
                    current.addCharacter(currentCharacter);
                } else if (ScreenplayElementType.DIALOGUE.name().equals(type) && !text.isBlank()) {
                    current.addDialogue(currentCharacter, text);
                } else if (ScreenplayElementType.ACTION.name().equals(type) && !text.isBlank()) {
                    current.addAction(text);
                }
            }
        }
        if (current != null) scenes.add(current);
        return scenes;
    }

    private static class CharacterStats {
        Set<Integer> scenes = new TreeSet<>();
        int dialogueCount;
        int wordsSpoken;
    }

    private static class SceneData {
        private final String slugLine;
        private final StringBuilder actionText = new StringBuilder();
        private final Set<String> characters = new LinkedHashSet<>();
        private final Map<String, Integer> dialogueCounts = new HashMap<>();
        private final Map<String, Integer> wordCounts = new HashMap<>();
        private int wordCount;
        private int dialogueCount;

        SceneData(String slugLine) {
            this.slugLine = slugLine;
        }

        String slugLine() { return slugLine; }

        void addCharacter(String name) { characters.add(name); }

        void addDialogue(String character, String text) {
            if (character == null) return;
            dialogueCount++;
            dialogueCounts.merge(character, 1, (a, b) -> a + b);
            int words = SlugLineParser.countWords(text);
            wordCounts.merge(character, words, (a, b) -> a + b);
            wordCount += words;
        }

        void addAction(String text) {
            if (actionText.length() > 0) actionText.append("\n");
            actionText.append(text);
            wordCount += SlugLineParser.countWords(text);
        }

        Set<String> characters() { return characters; }
        int wordCount() { return wordCount; }
        int dialogueCount() { return dialogueCount; }
        String actionText() { return actionText.toString(); }
        int dialogueCountFor(String c) { return dialogueCounts.getOrDefault(c, 0); }
        int wordsFor(String c) { return wordCounts.getOrDefault(c, 0); }
    }
}
