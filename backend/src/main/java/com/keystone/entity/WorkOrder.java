package com.keystone.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders")
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    @Column(nullable = false)
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "site_id")
    private Site site;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime scheduledAt;

    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Site getSite() {
        return site;
    }

    public void setSite(Site site) {
        this.site = site;
    }

    public User getAssignedTechnician() {
        return assignedTechnician;
    }

    public void setAssignedTechnician(User assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public WorkOrderPriority getPriority() {
        return priority;
    }

    public void setPriority(WorkOrderPriority priority) {
        this.priority = priority;
    }

    public WorkOrderStatus getStatus() {
        return status;
    }

    public void setStatus(WorkOrderStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}