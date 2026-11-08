package com.projects.projectmanager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "evaluation_marks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationMark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criterion_id", nullable = false)
    private EvaluationCriterion criterion;

    @Column(name = "marks_awarded", nullable = false, precision = 5, scale = 2)
    private BigDecimal marksAwarded;

    @Column(length = 1000)
    private String remarks;
}

