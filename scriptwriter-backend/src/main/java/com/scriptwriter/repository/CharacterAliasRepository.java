package com.scriptwriter.repository;

import com.scriptwriter.entity.CharacterAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CharacterAliasRepository extends JpaRepository<CharacterAlias, Long> {

    List<CharacterAlias> findByCharacterId(Long characterId);

    void deleteByCharacterId(Long characterId);
}
