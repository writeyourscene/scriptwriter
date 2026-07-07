package com.scriptwriter.repository;

import com.scriptwriter.entity.CharacterRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterRelationshipRepository extends JpaRepository<CharacterRelationship, Long> {

    List<CharacterRelationship> findByCharacterId(Long characterId);
}
