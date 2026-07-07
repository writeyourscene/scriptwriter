package com.scriptwriter.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    private String email;
    private String firstName;
    private String lastName;
}
