package com.scriptwriter.mapper;

import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .profileImage(user.getProfileImage())
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .loginProvider(user.getLoginProvider())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .projectAccess(user.isProjectAccess())
                .build();
    }
}
