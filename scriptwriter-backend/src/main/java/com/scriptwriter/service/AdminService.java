package com.scriptwriter.service;

import com.scriptwriter.dto.response.UserResponse;
import java.util.List;

public interface AdminService {
    List<UserResponse> listAllUsers(Long adminUserId);
    void toggleProjectAccess(Long adminUserId, Long userId, boolean access);
    void deleteUser(Long adminUserId, Long userId);
    void resetUserPassword(Long adminUserId, Long userId, String newPassword);
}
