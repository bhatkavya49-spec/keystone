package com.keystone.service;

import com.keystone.dto.SlaStatusResponse;
import com.keystone.entity.SlaStatus;
import com.keystone.entity.WorkOrder;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class SlaService {

    private static final long RISK_THRESHOLD_HOURS = 2;

    private final WorkOrderRepository workOrderRepository;

    public SlaService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional(readOnly = true)
    public SlaStatusResponse getSlaStatus(Long id, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(id);
        requireTechnicianAccess(workOrder, principal);
        SlaStatus status = computeSlaStatus(workOrder.getSlaDueAt());
        return new SlaStatusResponse(workOrder.getId(), workOrder.getSlaDueAt(), status);
    }

    @Transactional
    public SlaStatusResponse updateSlaStatus(Long id, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(id);
        requireTechnicianAccess(workOrder, principal);
        SlaStatus status = computeSlaStatus(workOrder.getSlaDueAt());
        workOrder.setSlaStatus(status);
        workOrderRepository.save(workOrder);
        return new SlaStatusResponse(workOrder.getId(), workOrder.getSlaDueAt(), status);
    }

    public SlaStatus computeSlaStatus(LocalDateTime slaDueAt) {
        if (slaDueAt == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        if (slaDueAt.isBefore(now)) {
            return SlaStatus.BREACHED;
        }
        if (slaDueAt.isBefore(now.plusHours(RISK_THRESHOLD_HOURS))) {
            return SlaStatus.AT_RISK;
        }
        return SlaStatus.ON_TRACK;
    }

    private void requireTechnicianAccess(WorkOrder workOrder, UserDetails principal) {
        if (isTechnician(principal) && (workOrder.getAssignedTechnician() == null
                || !workOrder.getAssignedTechnician().getUsername().equals(principal.getUsername()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the assigned technician can access SLA for this work order");
        }
    }

    private boolean isTechnician(UserDetails principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_TECHNICIAN"));
    }

    private WorkOrder getWorkOrderOrThrow(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Work order not found with id: " + id));
    }
}