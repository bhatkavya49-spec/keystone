package com.keystone.controller;

import com.keystone.dto.CurrentUserResponse;
import com.keystone.dto.LoginRequest;
import com.keystone.dto.LoginResponse;
import com.keystone.dto.RegistrationRequest;
import com.keystone.dto.RegistrationResponse;
import com.keystone.entity.User;
import com.keystone.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegistrationRequest request,
                                                         UriComponentsBuilder uriBuilder) {
        User created = userService.register(request);
        RegistrationResponse response = new RegistrationResponse(
                created.getId(), created.getUsername(), created.getEmail(), created.getRole());
        URI location = uriBuilder.path("/api/auth/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(userService.getCurrentUser(principal.getUsername()));
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<User>> technicians() {
        return ResponseEntity.ok(userService.getTechnicians());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> users() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
}