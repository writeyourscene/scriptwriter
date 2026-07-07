package com.scriptwriter.repository;

import com.scriptwriter.entity.SceneNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SceneNoteRepository extends JpaRepository<SceneNote, Long> {

    List<SceneNote> findBySceneId(Long sceneId);
}
