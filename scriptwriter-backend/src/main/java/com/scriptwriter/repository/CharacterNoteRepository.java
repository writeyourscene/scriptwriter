package com.scriptwriter.repository;

import com.scriptwriter.entity.CharacterNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterNoteRepository extends JpaRepository<CharacterNote, Long> {

    List<CharacterNote> findByCharacterIdOrderByCreatedAtDesc(Long characterId);
}
