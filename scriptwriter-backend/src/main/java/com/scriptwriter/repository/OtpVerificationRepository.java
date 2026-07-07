package com.scriptwriter.repository;

import com.scriptwriter.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByPhoneAndVerifiedFalseOrderByExpiryTimeDesc(String phone);

    void deleteByExpiryTimeBefore(LocalDateTime cutoff);
}
