package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.LoginRequest;
import com.projects.projectmanager.dto.request.RegisterRequest;
import com.projects.projectmanager.dto.response.AuthResponse;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.UserRepository;
import com.projects.projectmanager.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByPnr(request.pnr())) {
            throw new ApiException(HttpStatus.CONFLICT, "PNR_EXISTS", "A user with this PNR already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "A user with this email already exists");
        }

        User user = User.builder()
                .pnr(request.pnr())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .department(request.department())
                .year(request.year())
                .division(request.division())
                .role(Role.STUDENT)
                .build();

        user = userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getPnr(), user.getRole().name());
        return new AuthResponse(token, user.getPnr(), user.getName(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPnr(request.pnr())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS",
                        "Invalid PNR or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "BAD_CREDENTIALS", "Invalid PNR or password");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getPnr(), user.getRole().name());
        return new AuthResponse(token, user.getPnr(), user.getName(), user.getEmail(), user.getRole().name());
    }
}

