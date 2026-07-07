package com.scriptwriter.repository;

import com.scriptwriter.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
            SELECT p FROM Project p
            WHERE p.owner.id = :ownerId
            AND p.deleted = false
            AND p.archived = false
            AND (CAST(:search AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                 OR LOWER(p.genre) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            AND (:favorite IS NULL OR p.favorite = :favorite)
            AND (:status IS NULL OR p.status = :status)
            """)
    Page<Project> findUserProjects(
            @Param("ownerId") Long ownerId,
            @Param("search") String search,
            @Param("favorite") Boolean favorite,
            @Param("status") com.scriptwriter.enums.ProjectStatus status,
            Pageable pageable
    );

    @Query("""
            SELECT p FROM Project p
            WHERE p.owner.id = :ownerId
            AND p.deleted = false
            AND p.archived = true
            AND (CAST(:search AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            """)
    Page<Project> findArchivedProjects(
            @Param("ownerId") Long ownerId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            SELECT p FROM Project p
            WHERE p.owner.id = :ownerId
            AND p.deleted = true
            AND p.deletedAt >= :cutoff
            AND (CAST(:search AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
            ORDER BY p.deletedAt DESC
            """)
    Page<Project> findTrashProjects(
            @Param("ownerId") Long ownerId,
            @Param("search") String search,
            @Param("cutoff") LocalDateTime cutoff,
            Pageable pageable
    );

    Optional<Project> findByIdAndOwnerIdAndDeletedFalse(Long id, Long ownerId);

    Optional<Project> findByIdAndOwnerIdAndDeletedTrue(Long id, Long ownerId);

    java.util.List<Project> findByOwnerId(Long ownerId);
}
