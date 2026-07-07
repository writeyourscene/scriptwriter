package com.scriptwriter.config;

import com.scriptwriter.entity.User;
import com.scriptwriter.enums.Role;
import com.scriptwriter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        userRepository.findByUsername("ADMIN").ifPresentOrElse(
            admin -> {
                if (!admin.isProjectAccess() || admin.getRole() != Role.ADMIN) {
                    admin.setProjectAccess(true);
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);
                }
            },
            () -> {
                User admin = User.builder()
                        .username("ADMIN")
                        .email("admin@scriptwriter.com")
                        .password(passwordEncoder.encode("ADMIN123"))
                        .firstName("Admin")
                        .lastName("User")
                        .role(Role.ADMIN)
                        .enabled(true)
                        .emailVerified(true)
                        .projectAccess(true)
                        .build();
                userRepository.save(admin);
            }
        );
    }
}
