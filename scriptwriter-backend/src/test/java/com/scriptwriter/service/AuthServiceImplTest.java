package com.scriptwriter.service;

import com.scriptwriter.dto.request.RegisterRequest;
import com.scriptwriter.exception.DuplicateResourceException;
import com.scriptwriter.repository.RefreshTokenRepository;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.repository.UserSessionRepository;
import com.scriptwriter.repository.OtpVerificationRepository;
import com.scriptwriter.mapper.UserMapper;
import com.scriptwriter.security.JwtService;
import com.scriptwriter.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private OtpVerificationRepository otpVerificationRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void register_throwsWhenEmailExists() {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("John");
        request.setEmail("john@test.com");
        request.setPhone("9876543210");
        request.setPassword("Password1!");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request, null));
    }
}
