package com.projects.projectmanager.repository;

import com.projects.projectmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPnr(String pnr);
    Optional<User> findByEmail(String email);
    boolean existsByPnr(String pnr);
    boolean existsByEmail(String email);
}

