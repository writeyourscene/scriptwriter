package com.scriptwriter.service;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.AuthResponse;
import com.scriptwriter.dto.response.UserResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest);

    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);

    AuthResponse googleLogin(GoogleLoginRequest request, HttpServletRequest httpRequest);

    String sendOtp(SendOtpRequest request);

    AuthResponse verifyOtp(VerifyOtpRequest request, HttpServletRequest httpRequest);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    UserResponse getCurrentUser(String email);

    UserResponse updateProfile(String email, UpdateProfileRequest request);

    void changePassword(String email, ChangePasswordRequest request);

    void deleteAccount(String email, RefreshTokenRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    String resetPassword(ResetPasswordRequest request);
}
