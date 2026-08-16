package com.keystone.controller;

import com.keystone.entity.Notification;
import com.keystone.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal.getUsername()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.getUnreadNotificationsForUser(principal.getUsername()));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable("id") Long id,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getUsername()));
    }
}