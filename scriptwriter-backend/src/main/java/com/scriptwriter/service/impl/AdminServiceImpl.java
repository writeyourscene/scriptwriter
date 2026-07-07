package com.scriptwriter.service.impl;

import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.entity.Project;
import com.scriptwriter.entity.User;
import com.scriptwriter.enums.Role;
import com.scriptwriter.exception.BadRequestException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.mapper.UserMapper;
import com.scriptwriter.repository.ProjectRepository;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    @PersistenceContext
    private EntityManager entityManager;

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> listAllUsers(Long adminUserId) {
        verifyAdmin(adminUserId);
        
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void toggleProjectAccess(Long adminUserId, Long userId, boolean access) {
        verifyAdmin(adminUserId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot toggle project access for ADMIN user");
        }
        
        user.setProjectAccess(access);
        userRepository.save(user);
        log.info("Admin {} toggled project access to {} for user {}", adminUserId, access, userId);
    }

    @Override
    @Transactional
    public void deleteUser(Long adminUserId, Long userId) {
        verifyAdmin(adminUserId);
        
        if (adminUserId.equals(userId)) {
            throw new BadRequestException("Admin cannot delete themselves");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin users cannot be deleted");
        }

        // Find all projects owned by the user
        List<Project> projects = projectRepository.findByOwnerId(userId);
        for (Project project : projects) {
            deleteProjectPermanently(project.getId());
        }

        // Clean up user sessions, tokens, activity logs, and AI history
        entityManager.createNativeQuery("DELETE FROM user_sessions WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM refresh_tokens WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("UPDATE project_members SET invited_by = NULL WHERE invited_by = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM project_members WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM project_activity WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        entityManager.createNativeQuery("DELETE FROM ai_history WHERE user_id = :userId")
                .setParameter("userId", userId)
                .executeUpdate();

        // Detach all entities (like the deleted projects) to avoid transient reference exceptions on flush
        entityManager.clear();

        // Delete user
        userRepository.deleteById(userId);
        log.info("Admin {} permanently deleted user {} and all their projects", adminUserId, userId);
     }

    @Override
    @Transactional
    public void resetUserPassword(Long adminUserId, Long userId, String newPassword) {
        verifyAdmin(adminUserId);
        
        if (newPassword == null || newPassword.trim().length() < 4) {
            throw new BadRequestException("Password must be at least 4 characters long");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
        log.info("Admin {} reset password for user {}", adminUserId, userId);
    }

    private void verifyAdmin(Long adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied: Admin role required");
        }
    }

    private void deleteProjectPermanently(Long projectId) {
        // 1. Delete scene notes
        entityManager.createNativeQuery("DELETE FROM scene_notes WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 2. Delete scene characters
        entityManager.createNativeQuery("DELETE FROM scene_characters WHERE scene_id IN (SELECT id FROM scenes WHERE project_id = :projectId) OR character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 3. Delete character notes
        entityManager.createNativeQuery("DELETE FROM character_notes WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 4. Delete character relationships
        entityManager.createNativeQuery("DELETE FROM character_relationships WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId) OR related_character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 5. Delete character aliases
        entityManager.createNativeQuery("DELETE FROM character_aliases WHERE character_id IN (SELECT id FROM characters WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 6. Delete script versions
        entityManager.createNativeQuery("DELETE FROM script_versions WHERE script_id IN (SELECT id FROM scripts WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 7. Delete AI history records for the script
        entityManager.createNativeQuery("DELETE FROM ai_history WHERE script_id IN (SELECT id FROM scripts WHERE project_id = :projectId)")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 8. Delete scenes
        entityManager.createNativeQuery("DELETE FROM scenes WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 9. Delete scripts
        entityManager.createNativeQuery("DELETE FROM scripts WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 10. Delete characters
        entityManager.createNativeQuery("DELETE FROM characters WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 11. Delete project members
        entityManager.createNativeQuery("DELETE FROM project_members WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 12. Delete project tags
        entityManager.createNativeQuery("DELETE FROM project_tags WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 13. Delete project activity
        entityManager.createNativeQuery("DELETE FROM project_activity WHERE project_id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();

        // 14. Finally, delete the project
        entityManager.createNativeQuery("DELETE FROM projects WHERE id = :projectId")
                .setParameter("projectId", projectId)
                .executeUpdate();
    }
}
