package com.keystone.dto;

import com.keystone.entity.Role;

public class CurrentUserResponse {

    private Long id;

    private String username;

    private String email;

    private Role role;

    private Long customerId;

    private String customerName;

    public CurrentUserResponse(Long id, String username, String email, Role role,
                               Long customerId, String customerName) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.customerId = customerId;
        this.customerName = customerName;
    }

    public Long getId() {
        return id;
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

    public Long getCustomerId() {
        return customerId;
    }

    public String getCustomerName() {
        return customerName;
    }
}
