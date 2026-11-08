package com.projects.projectmanager.service;

import com.projects.projectmanager.dto.response.NotificationResponse;
import com.projects.projectmanager.entity.Notification;
import com.projects.projectmanager.entity.User;
import com.projects.projectmanager.exception.ApiException;
import com.projects.projectmanager.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification notify(User recipient, String type, String title, String message, String link) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    @Transactional
    public void notifyUsers(List<User> recipients, String type, String title, String message, String link) {
        for (User u : recipients) {
            notify(u, type, title, message, link);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(User user, Boolean unreadOnly) {
        List<Notification> list = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(user.getId())
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());

        return list.stream().map(this::toResponse).toList();
    }

    @Transactional
    public NotificationResponse markAsRead(User user, Long notificationId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND",
                        "Notification not found with id: " + notificationId));

        if (!notif.getRecipient().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                    "You cannot modify notifications belonging to another user");
        }

        notif.setRead(true);
        return toResponse(notificationRepository.save(notif));
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndReadFalseOrderByCreatedAtDesc(user.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getType(),
                n.getLink(),
                n.getCreatedAt()
        );
    }
}

