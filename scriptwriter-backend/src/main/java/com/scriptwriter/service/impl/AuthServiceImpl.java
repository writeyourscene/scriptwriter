package com.scriptwriter.service.impl;

import com.scriptwriter.dto.request.*;
import com.scriptwriter.dto.response.AuthResponse;
import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.entity.OtpVerification;
import com.scriptwriter.entity.RefreshToken;
import com.scriptwriter.entity.User;
import com.scriptwriter.entity.UserSession;
import com.scriptwriter.enums.LoginProvider;
import com.scriptwriter.enums.Role;
import com.scriptwriter.enums.UserStatus;
import com.scriptwriter.exception.BadRequestException;
import com.scriptwriter.exception.DuplicateResourceException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.exception.UnauthorizedException;
import com.scriptwriter.mapper.UserMapper;
import com.scriptwriter.repository.OtpVerificationRepository;
import com.scriptwriter.repository.RefreshTokenRepository;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.repository.UserSessionRepository;
import com.scriptwriter.security.JwtService;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Value("${auth.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${auth.lock-duration-minutes:15}")
    private int lockDurationMinutes;

    @Value("${otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${google.oauth.enabled:false}")
    private boolean googleOAuthEnabled;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String email = request.getEmail().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email is already registered");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new DuplicateResourceException("Phone number is already registered");
            }
        }

        User user = User.builder()
                .username(generateUsername(email))
                .email(email)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.WRITER)
                .status(UserStatus.ACTIVE)
                .loginProvider(LoginProvider.EMAIL)
                .emailVerified(false)
                .phoneVerified(false)
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("User registered: {}", email);
        return completeAuthentication(user, httpRequest);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String loginInput = request.getEmail().trim();
        User user = userRepository.findByEmail(loginInput.toLowerCase())
                .or(() -> userRepository.findByUsername(loginInput))
                .or(() -> userRepository.findByUsername(loginInput.toUpperCase()))
                .orElseThrow(() -> {
                    log.warn("Failed login attempt for unknown identifier: {}", loginInput);
                    return new UnauthorizedException("Invalid email or password");
                });

        if (user.isAccountLocked()) {
            log.warn("Login attempt on locked account: {}", loginInput);
            throw new UnauthorizedException("Account is temporarily locked. Try again later.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedLogin(user);
            throw new UnauthorizedException("Invalid email or password");
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenRepository.deleteByUser(user);
        log.info("User logged in: {}", loginInput);
        return completeAuthentication(user, httpRequest);
    }

    @Override
    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request, HttpServletRequest httpRequest) {
        if (!googleOAuthEnabled) {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new BadRequestException("Google OAuth is not configured. Provide email for development mode.");
            }
            log.info("Google login (dev mode) for: {}", request.getEmail());
        }

        String email = request.getEmail().toLowerCase();
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .username(generateUsername(email))
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(request.getFirstName() != null ? request.getFirstName() : "Google")
                    .lastName(request.getLastName())
                    .role(Role.WRITER)
                    .status(UserStatus.ACTIVE)
                    .loginProvider(LoginProvider.GOOGLE)
                    .emailVerified(true)
                    .phoneVerified(false)
                    .enabled(true)
                    .build();
            return userRepository.save(newUser);
        });

        user.setLastLogin(LocalDateTime.now());
        user.setLoginProvider(LoginProvider.GOOGLE);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);
        log.info("Google login successful: {}", email);
        return completeAuthentication(user, httpRequest);
    }

    @Override
    @Transactional
    public String sendOtp(SendOtpRequest request) {
        String otp = generateOtp();
        OtpVerification verification = OtpVerification.builder()
                .phone(request.getPhone())
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .verified(false)
                .build();
        otpVerificationRepository.save(verification);
        log.info("OTP sent to phone ending {} (dev OTP: {})",
                request.getPhone().substring(Math.max(0, request.getPhone().length() - 4)), otp);
        return "OTP sent successfully";
    }

    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request, HttpServletRequest httpRequest) {
        OtpVerification verification = otpVerificationRepository
                .findTopByPhoneAndVerifiedFalseOrderByExpiryTimeDesc(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired OTP"));

        if (verification.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("OTP has expired");
        }
        if (!verification.getOtp().equals(request.getOtp())) {
            throw new UnauthorizedException("Invalid OTP");
        }

        verification.setVerified(true);
        otpVerificationRepository.save(verification);

        User user = userRepository.findByPhone(request.getPhone()).orElseGet(() -> {
            User newUser = User.builder()
                    .username(generateUsername("phone" + request.getPhone()))
                    .email("phone_" + request.getPhone() + "@scriptwriter.local")
                    .phone(request.getPhone())
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName("Phone")
                    .lastName("User")
                    .role(Role.WRITER)
                    .status(UserStatus.ACTIVE)
                    .loginProvider(LoginProvider.PHONE)
                    .phoneVerified(true)
                    .enabled(true)
                    .build();
            return userRepository.save(newUser);
        });

        user.setPhoneVerified(true);
        user.setLoginProvider(LoginProvider.PHONE);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);
        log.info("Phone OTP login successful: {}", request.getPhone());
        return completeAuthentication(user, httpRequest);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken);
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken()).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.delete(token);
            log.info("User logged out: {}", token.getUser().getEmail());
        });
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new DuplicateResourceException("Username is already taken");
            }
            user.setUsername(request.getUsername());
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);
        log.info("Password changed for user: {}", email);
    }

    @Override
    @Transactional
    public void deleteAccount(String email, RefreshTokenRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setEnabled(false);
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);
        logout(request);
        log.info("Account deleted (disabled): {}", email);
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().toLowerCase());
        log.info("Password reset requested for: {}", request.getEmail());
        return "If an account exists with this email, a password reset link has been sent";
    }

    @Override
    public String resetPassword(ResetPasswordRequest request) {
        throw new BadRequestException("Password reset via token is not yet available. Please contact support.");
    }

    private AuthResponse completeAuthentication(User user, HttpServletRequest httpRequest) {
        createSession(user, httpRequest);
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        String accessToken = jwtService.generateAccessToken(principal);
        RefreshToken refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration() / 1000)
                .user(userMapper.toResponse(user))
                .build();
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiryDate(Instant.now().plusMillis(refreshTokenExpiration))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    private void createSession(User user, HttpServletRequest request) {
        if (request == null) {
            return;
        }
        UserSession session = UserSession.builder()
                .user(user)
                .ipAddress(request.getRemoteAddr())
                .browser(request.getHeader("User-Agent"))
                .operatingSystem(parseOs(request.getHeader("User-Agent")))
                .loginTime(LocalDateTime.now())
                .build();
        userSessionRepository.save(session);
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= maxFailedAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(lockDurationMinutes));
            log.warn("Account locked after {} failed attempts: {}", attempts, user.getEmail());
        }
        userRepository.save(user);
        log.warn("Failed login attempt {} for: {}", attempts, user.getEmail());
    }

    private String generateUsername(String seed) {
        String base = seed.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
        if (base.length() < 3) {
            base = base + "sw";
        }
        base = base.substring(0, Math.min(base.length(), 40)).toLowerCase();
        String candidate = base;
        int counter = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + counter++;
        }
        return candidate;
    }

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private String parseOs(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Windows")) {
            return "Windows";
        }
        if (userAgent.contains("Mac")) {
            return "macOS";
        }
        if (userAgent.contains("Android")) {
            return "Android";
        }
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            return "iOS";
        }
        if (userAgent.contains("Linux")) {
            return "Linux";
        }
        return "Unknown";
    }
}
