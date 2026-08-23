package com.keystone.dto;

import com.keystone.entity.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;

public class WorkOrderStatusRequest {

    @NotNull(message = "Status is required")
    private WorkOrderStatus status;

    private String note;

    public WorkOrderStatus getStatus() {
        return status;
    }

    public void setStatus(WorkOrderStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}