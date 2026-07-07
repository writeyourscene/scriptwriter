package com.scriptwriter.entity;

import com.scriptwriter.enums.ProjectStatus;
import com.scriptwriter.enums.ScreenplayType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_projects_owner_id", columnList = "owner_id"),
        @Index(name = "idx_projects_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends SoftDeletableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String genre;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String language = "en";

    @Enumerated(EnumType.STRING)
    @Column(name = "screenplay_type", nullable = false, length = 30)
    private ScreenplayType screenplayType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private boolean favorite = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean archived = false;

    @Column(name = "color_theme", length = 20)
    private String colorTheme;

    @Column(name = "poster_image", length = 500)
    private String posterImage;

    @Column(name = "estimated_runtime")
    private Integer estimatedRuntime;
}
