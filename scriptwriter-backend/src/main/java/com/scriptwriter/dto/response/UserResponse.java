package com.scriptwriter.dto.response;

import com.scriptwriter.enums.LoginProvider;
import com.scriptwriter.enums.Role;
import com.scriptwriter.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
    private String profileImage;
    private Role role;
    private UserStatus status;
    private boolean emailVerified;
    private boolean phoneVerified;
    private LoginProvider loginProvider;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private boolean projectAccess;
}
