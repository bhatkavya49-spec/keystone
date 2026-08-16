package com.keystone.dto;

import com.keystone.entity.SlaStatus;

import java.time.LocalDateTime;

public class SlaStatusResponse {

    private Long workOrderId;

    private LocalDateTime slaDueAt;

    private SlaStatus slaStatus;

    public SlaStatusResponse(Long workOrderId, LocalDateTime slaDueAt, SlaStatus slaStatus) {
        this.workOrderId = workOrderId;
        this.slaDueAt = slaDueAt;
        this.slaStatus = slaStatus;
    }

    public Long getWorkOrderId() {
        return workOrderId;
    }

    public LocalDateTime getSlaDueAt() {
        return slaDueAt;
    }

    public SlaStatus getSlaStatus() {
        return slaStatus;
    }
}