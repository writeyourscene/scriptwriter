package com.scriptwriter.repository;

import com.scriptwriter.entity.ScriptVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScriptVersionRepository extends JpaRepository<ScriptVersion, Long> {

    List<ScriptVersion> findByScriptIdOrderByVersionNumberDesc(Long scriptId);

    Optional<ScriptVersion> findByScriptIdAndVersionNumber(Long scriptId, int versionNumber);
}
