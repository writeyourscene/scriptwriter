package com.scriptwriter.entity;

import com.scriptwriter.enums.SceneStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scenes", indexes = {
        @Index(name = "idx_scenes_project_id", columnList = "project_id"),
        @Index(name = "idx_scenes_script_id", columnList = "script_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scene extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "script_id", nullable = false)
    private Script script;

    @Column(name = "scene_number", nullable = false)
    private int sceneNumber;

    @Column(length = 200)
    private String title;

    @Column(name = "slug_line", nullable = false, length = 300)
    private String slugLine;

    @Column(length = 200)
    private String location;

    @Column(name = "time_of_day", length = 50)
    private String timeOfDay;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(name = "estimated_duration")
    private Integer estimatedDuration;

    @Column(name = "word_count", nullable = false)
    @Builder.Default
    private int wordCount = 0;

    @Column(name = "dialogue_count", nullable = false)
    @Builder.Default
    private int dialogueCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SceneStatus status = SceneStatus.DRAFT;

    @Column(nullable = false)
    @Builder.Default
    private boolean favorite = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
