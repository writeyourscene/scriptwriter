package com.scriptwriter.repository;

import com.scriptwriter.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ScriptRepository extends JpaRepository<Script, Long> {

    Optional<Script> findByProjectId(Long projectId);

    @Query("SELECT s FROM Script s WHERE s.id = :id AND s.project.owner.id = :ownerId")
    Optional<Script> findByIdAndProjectOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);
}
