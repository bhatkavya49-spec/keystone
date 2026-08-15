package com.keystone.dto;

import jakarta.validation.constraints.NotNull;

public class AssignWorkOrderRequest {

    @NotNull(message = "Technician id is required")
    private Long technicianId;

    public Long getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(Long technicianId) {
        this.technicianId = technicianId;
    }
}