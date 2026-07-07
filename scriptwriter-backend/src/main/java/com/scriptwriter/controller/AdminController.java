package com.scriptwriter.controller;

import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<UserResponse> users = adminService.listAllUsers(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/toggle-access")
    public ResponseEntity<ApiResponse<Void>> toggleProjectAccess(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam boolean access
    ) {
        adminService.toggleProjectAccess(principal.getUser().getId(), id, access);
        return ResponseEntity.ok(ApiResponse.success("User project access updated successfully", null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        adminService.deleteUser(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("User and all their projects deleted permanently", null));
    }

    @PutMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetUserPassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam String password
    ) {
        adminService.resetUserPassword(principal.getUser().getId(), id, password);
        return ResponseEntity.ok(ApiResponse.success("User password has been reset successfully", null));
    }
}
