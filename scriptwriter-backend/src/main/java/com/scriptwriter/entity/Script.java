package com.scriptwriter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scripts", indexes = {
        @Index(name = "idx_scripts_project_id", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Script extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    @Builder.Default
    private String content = "[]";

    @Column(name = "current_version", nullable = false)
    @Builder.Default
    private int currentVersion = 1;

    @Column(name = "word_count", nullable = false)
    @Builder.Default
    private int wordCount = 0;

    @Column(name = "page_count", nullable = false)
    @Builder.Default
    private int pageCount = 1;

    @Column(name = "scene_count", nullable = false)
    @Builder.Default
    private int sceneCount = 0;

    @Column(name = "character_count", nullable = false)
    @Builder.Default
    private int characterCount = 0;

    @Column(name = "dialogue_count", nullable = false)
    @Builder.Default
    private int dialogueCount = 0;

    @Column(name = "font_family")
    @Builder.Default
    private String fontFamily = "Courier Prime";

    public String getFontFamily() {
        return fontFamily != null ? fontFamily : "Courier Prime";
    }

    @Column(name = "is_shared")
    @Builder.Default
    private Boolean isShared = false;

    public boolean isShared() {
        return isShared != null && isShared;
    }
}
