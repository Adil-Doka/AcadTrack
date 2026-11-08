package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.request.CreateCoordinatorRequest;
import com.projects.projectmanager.dto.response.UserResponse;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CoordinatorProvisioningService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CoordinatorProvisioningService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.coordinator.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.coordinator.seed.pnr:COORD001}")
    private String seedPnr;

    @Value("${app.coordinator.seed.email:coordinator@university.edu}")
    private String seedEmail;

    @Value("${app.coordinator.seed.password:Coordinator@123}")
    private String seedPassword;

    @Value("${app.coordinator.seed.name:Project Coordinator}")
    private String seedName;

    @Value("${app.coordinator.seed.department:Computer Science}")
    private String seedDept;

    public CoordinatorProvisioningService(UserRepository userRepository,
                                          PasswordEncoder passwordEncoder,
                                          AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        if (userRepository.existsByPnr(seedPnr)) {
            log.info("Coordinator account with PNR '{}' already exists. Skipping bootstrap seed.", seedPnr);
            return;
        }

        if (userRepository.existsByEmail(seedEmail)) {
            log.info("Coordinator account with email '{}' already exists. Skipping bootstrap seed.", seedEmail);
            return;
        }

        User coordinator = User.builder()
                .pnr(seedPnr)
                .email(seedEmail)
                .password(passwordEncoder.encode(seedPassword))
                .name(seedName)
                .department(seedDept)
                .role(Role.COORDINATOR)
                .build();

        coordinator = userRepository.save(coordinator);
        auditService.log(null, "COORDINATOR_BOOTSTRAPPED", "USER", coordinator.getId(),
                "Initial coordinator account provisioned via configuration");
        log.info("Successfully provisioned initial Project Coordinator account (PNR: {})", seedPnr);
    }

    @Transactional
    public UserResponse provisionCoordinator(User actor, CreateCoordinatorRequest request) {
        if (userRepository.existsByPnr(request.pnr())) {
            throw new ApiException(HttpStatus.CONFLICT, "PNR_EXISTS",
                    "A user with PNR '" + request.pnr() + "' already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS",
                    "A user with email '" + request.email() + "' already exists");
        }

        User coordinator = User.builder()
                .pnr(request.pnr())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .department(request.department())
                .role(Role.COORDINATOR)
                .build();

        coordinator = userRepository.save(coordinator);

        auditService.log(actor, "COORDINATOR_PROVISIONED", "USER", coordinator.getId(),
                "New coordinator account provisioned for " + coordinator.getName() + " (" + coordinator.getPnr() + ")");

        return new UserResponse(
                coordinator.getId(),
                coordinator.getPnr(),
                coordinator.getEmail(),
                coordinator.getName(),
                coordinator.getDepartment(),
                coordinator.getYear(),
                coordinator.getDivision(),
                coordinator.getRole().name()
        );
    }
}

