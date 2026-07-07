package com.scriptwriter.controller;

import com.scriptwriter.dto.request.CreateProjectRequest;
import com.scriptwriter.dto.request.ShareProjectRequest;
import com.scriptwriter.dto.request.UpdateProjectRequest;
import com.scriptwriter.dto.response.PageResponse;
import com.scriptwriter.dto.response.ProjectResponse;
import com.scriptwriter.dto.response.ProjectShareResponse;
import com.scriptwriter.enums.ProjectStatus;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        ProjectResponse response = projectService.createProject(principal.getUser().getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> listProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean favorite,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<ProjectResponse> response = projectService.listProjects(
                principal.getUser().getId(), search, favorite, status, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> listArchivedProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return ResponseEntity.ok(ApiResponse.success(
                projectService.listArchivedProjects(principal.getUser().getId(), search, pageable)));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> listTrashProjects(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                projectService.listTrashProjects(principal.getUser().getId(), search, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getProject(principal.getUser().getId(), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        ProjectResponse response = projectService.updateProject(principal.getUser().getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Project updated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        projectService.deleteProject(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Project moved to trash", null));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ProjectResponse>> archiveProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ProjectResponse response = projectService.archiveProject(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Project archived", response));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<ProjectResponse>> restoreProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ProjectResponse response = projectService.unarchiveProject(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Project restored", response));
    }

    @PutMapping("/{id}/trash-restore")
    public ResponseEntity<ApiResponse<ProjectResponse>> restoreFromTrash(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ProjectResponse response = projectService.restoreProject(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Project restored from trash", response));
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<ProjectResponse>> toggleFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ProjectResponse response = projectService.toggleFavorite(principal.getUser().getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Favorite updated", response));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<ProjectResponse>> duplicateProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        ProjectResponse response = projectService.duplicateProject(principal.getUser().getId(), id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project duplicated", response));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<ProjectShareResponse>> shareProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ShareProjectRequest request
    ) {
        ProjectShareResponse response = projectService.shareProject(principal.getUser().getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Project shared", response));
    }

    @PostMapping(value = "/import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProjectResponse>> importProject(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String screenplayType
    ) {
        ProjectResponse response = projectService.importProject(principal.getUser().getId(), file, title, genre, screenplayType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project imported successfully", response));
    }
}
