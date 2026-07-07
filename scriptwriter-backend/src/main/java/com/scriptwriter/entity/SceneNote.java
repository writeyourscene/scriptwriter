package com.scriptwriter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scene_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SceneNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scene_id", nullable = false)
    private Scene scene;

    @Column(name = "note_type", length = 50)
    private String noteType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
