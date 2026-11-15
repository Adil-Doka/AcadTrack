package com.projects.projectmanager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "evaluation_criteria")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phase_id", nullable = false)
    private Phase phase;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "max_marks", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxMarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "criterion_type", nullable = false, length = 50)
    @Builder.Default
    private CriterionType criterionType = CriterionType.MANUAL;

    @Column(length = 500)
    private String description;
}

