package com.scriptwriter.repository;

import com.scriptwriter.entity.SceneCharacter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SceneCharacterRepository extends JpaRepository<SceneCharacter, Long> {

    List<SceneCharacter> findBySceneId(Long sceneId);

    List<SceneCharacter> findByCharacterIdOrderByScene_SceneNumberAsc(Long characterId);

    void deleteBySceneId(Long sceneId);

    void deleteByCharacterId(Long characterId);
}
