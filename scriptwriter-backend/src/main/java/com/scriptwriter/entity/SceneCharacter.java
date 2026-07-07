package com.scriptwriter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scene_characters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SceneCharacter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "scene_id", nullable = false)
    private Scene scene;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "character_id", nullable = false)
    private Character character;

    @Column(name = "dialogue_count", nullable = false)
    @Builder.Default
    private int dialogueCount = 0;

    @Column(name = "speaking_order")
    private Integer speakingOrder;
}
