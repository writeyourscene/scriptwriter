package com.scriptwriter.repository;

import com.scriptwriter.entity.ProjectActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, Long> {

    Page<ProjectActivity> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
}
