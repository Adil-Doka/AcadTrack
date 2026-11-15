package com.projects.projectmanager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tm_team_user", columnNames = {"team_id", "user_id"}),
        @UniqueConstraint(name = "uk_tm_cycle_user", columnNames = {"academic_cycle_id", "user_id"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_cycle_id", nullable = false)
    private AcademicCycle academicCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TeamRole role = TeamRole.MEMBER;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();
}

