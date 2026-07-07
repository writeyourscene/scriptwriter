package com.scriptwriter.dto.request;

import com.scriptwriter.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShareProjectRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private Role role;

    @NotBlank(message = "Permission is required")
    private String permission;
}
