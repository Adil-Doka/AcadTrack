package com.projects.projectmanager.service;

import com.projects.projectmanager.TestDatabaseCleaner;
import com.projects.projectmanager.dto.response.NotificationResponse;
import com.projects.projectmanager.entity.Notification;
import com.projects.projectmanager.entity.Role;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class NotificationServiceTest {

    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository userRepository;
    @Autowired private TestDatabaseCleaner cleaner;

    private User student;
    private User otherStudent;

    @BeforeEach
    void setUp() {
        cleaner.clean();

        student = userRepository.save(User.builder()
                .pnr("PNR401")
                .email("s401@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student 401")
                .role(Role.STUDENT)
                .build());

        otherStudent = userRepository.save(User.builder()
                .pnr("PNR402")
                .email("s402@example.com")
                .password("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890")
                .name("Student 402")
                .role(Role.STUDENT)
                .build());
    }

    @Test
    void notifyAndRetrieve_success() {
        notificationService.notify(student, "TEAM_DECISION", "Team Approved", "Your team has been approved", "/teams/1");

        List<NotificationResponse> all = notificationService.getUserNotifications(student, false);
        assertEquals(1, all.size());
        assertEquals("Team Approved", all.get(0).title());
        assertFalse(all.get(0).read());

        List<NotificationResponse> unread = notificationService.getUserNotifications(student, true);
        assertEquals(1, unread.size());
    }

    @Test
    void markAsRead_success() {
        Notification notif = notificationService.notify(student, "SUBMISSION_STATUS", "Submitted", "Submission recorded", null);

        NotificationResponse updated = notificationService.markAsRead(student, notif.getId());
        assertTrue(updated.read());

        List<NotificationResponse> unread = notificationService.getUserNotifications(student, true);
        assertEquals(0, unread.size());
    }

    @Test
    void markAsRead_differentUser_throwsForbidden() {
        Notification notif = notificationService.notify(student, "TYPE", "Title", "Msg", null);

        ApiException ex = assertThrows(ApiException.class,
                () -> notificationService.markAsRead(otherStudent, notif.getId()));
        assertEquals("ACCESS_DENIED", ex.getCode());
    }
}

