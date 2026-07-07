package com.scriptwriter.repository;

import com.scriptwriter.entity.Character;
import com.scriptwriter.enums.CharacterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CharacterRepository extends JpaRepository<Character, Long> {

    List<Character> findByProjectIdOrderByNameAsc(Long projectId);

    Optional<Character> findByProjectIdAndNameIgnoreCase(Long projectId, String name);

    @Query("SELECT c FROM Character c WHERE c.id = :id AND c.project.owner.id = :ownerId")
    Optional<Character> findByIdAndProjectOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);

    @Query("""
            SELECT c FROM Character c
            WHERE c.project.id = :projectId
            AND c.project.owner.id = :ownerId
            AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(c.alias) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(c.occupation) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (:status IS NULL OR c.status = :status)
            ORDER BY c.dialogueCount DESC, c.name ASC
            """)
    List<Character> searchCharacters(
            @Param("projectId") Long projectId,
            @Param("ownerId") Long ownerId,
            @Param("search") String search,
            @Param("status") CharacterStatus status
    );

    boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);
}
