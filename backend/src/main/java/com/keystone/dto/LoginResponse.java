package com.keystone.dto;

import com.keystone.entity.Role;

public class LoginResponse {

    private String token;

    private String username;

    private String email;

    private Role role;

    public LoginResponse(String token, String username, String email, Role role) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }
}