package com.keystone.service;

import com.keystone.entity.Notification;
import com.keystone.entity.NotificationType;
import com.keystone.entity.User;
import com.keystone.repository.NotificationRepository;
import com.keystone.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Notification createNotification(User recipient, String message, NotificationType type) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForUser(String username) {
        User user = getRecipientOrThrow(username);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotificationsForUser(String username) {
        User user = getRecipientOrThrow(username);
        return notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public Notification markAsRead(Long id, String username) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Notification not found with id: " + id));
        if (notification.getRecipient() == null
                || !notification.getRecipient().getUsername().equals(username)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the recipient can mark this notification as read");
        }
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    private User getRecipientOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found: " + username));
    }
}