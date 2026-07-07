package com.scriptwriter.entity;

import com.scriptwriter.enums.CharacterStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "characters", indexes = {
        @Index(name = "idx_characters_project_id", columnList = "project_id"),
        @Index(name = "idx_characters_name", columnList = "name")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_characters_project_name", columnNames = {"project_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Character extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String alias;

    @Column(length = 100)
    private String nickname;

    private Integer age;

    @Column(length = 30)
    private String gender;

    @Column(length = 100)
    private String occupation;

    @Column(columnDefinition = "TEXT")
    private String personality;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String goals;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private CharacterStatus status = CharacterStatus.SUPPORTING;

    @Column(name = "first_scene")
    private Integer firstScene;

    @Column(name = "last_scene")
    private Integer lastScene;

    @Column(name = "dialogue_count", nullable = false)
    @Builder.Default
    private int dialogueCount = 0;

    @Column(name = "scene_count", nullable = false)
    @Builder.Default
    private int sceneCount = 0;

    @Column(name = "words_spoken", nullable = false)
    @Builder.Default
    private int wordsSpoken = 0;
}
