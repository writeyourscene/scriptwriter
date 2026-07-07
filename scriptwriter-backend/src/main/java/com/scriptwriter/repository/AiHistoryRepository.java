package com.scriptwriter.repository;

import com.scriptwriter.entity.AiHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiHistoryRepository extends JpaRepository<AiHistory, Long> {

    List<AiHistory> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
}
