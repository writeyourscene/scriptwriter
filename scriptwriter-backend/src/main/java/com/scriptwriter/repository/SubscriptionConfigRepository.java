package com.scriptwriter.repository;

import com.scriptwriter.entity.SubscriptionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubscriptionConfigRepository extends JpaRepository<SubscriptionConfig, Long> {
}
