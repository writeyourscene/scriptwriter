package com.scriptwriter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;
}
