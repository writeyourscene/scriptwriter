package com.scriptwriter.repository;

import com.scriptwriter.entity.Scene;
import com.scriptwriter.enums.SceneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SceneRepository extends JpaRepository<Scene, Long> {

    List<Scene> findByScriptIdOrderBySortOrderAsc(Long scriptId);

    @Query("SELECT s FROM Scene s WHERE s.id = :id AND s.project.owner.id = :ownerId")
    Optional<Scene> findByIdAndProjectOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);

    @Query("""
            SELECT s FROM Scene s
            WHERE s.project.id = :projectId
            AND s.project.owner.id = :ownerId
            AND s.status <> com.scriptwriter.enums.SceneStatus.DELETED
            AND (:search IS NULL OR LOWER(s.slugLine) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(s.location) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (:status IS NULL OR s.status = :status)
            AND (:favorite IS NULL OR s.favorite = :favorite)
            ORDER BY s.sortOrder ASC
            """)
    List<Scene> searchScenes(
            @Param("projectId") Long projectId,
            @Param("ownerId") Long ownerId,
            @Param("search") String search,
            @Param("status") SceneStatus status,
            @Param("favorite") Boolean favorite
    );

    void deleteByScriptId(Long scriptId);
}
