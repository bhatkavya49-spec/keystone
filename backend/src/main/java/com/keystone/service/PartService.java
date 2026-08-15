package com.keystone.service;

import com.keystone.entity.Part;
import com.keystone.entity.WorkOrder;
import com.keystone.repository.PartRepository;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PartService {

    private static final String TECHNICIAN_AUTHORITY = "ROLE_TECHNICIAN";

    private final PartRepository partRepository;
    private final WorkOrderRepository workOrderRepository;

    public PartService(PartRepository partRepository, WorkOrderRepository workOrderRepository) {
        this.partRepository = partRepository;
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional
    public Part createPart(Long workOrderId, Part part, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        requireTechnicianAccess(workOrder, principal);
        part.setWorkOrder(workOrder);
        return partRepository.save(part);
    }

    @Transactional(readOnly = true)
    public List<Part> getPartsByWorkOrder(Long workOrderId, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        requireTechnicianAccess(workOrder, principal);
        return partRepository.findByWorkOrderId(workOrderId);
    }

    @Transactional(readOnly = true)
    public Part getPartById(Long id, UserDetails principal) {
        Part part = getPartOrThrow(id);
        requireTechnicianAccess(part.getWorkOrder(), principal);
        return part;
    }

    @Transactional
    public Part updatePart(Long id, Part part, UserDetails principal) {
        Part existing = getPartOrThrow(id);
        requireTechnicianAccess(existing.getWorkOrder(), principal);
        existing.setPartName(part.getPartName());
        existing.setQuantity(part.getQuantity());
        existing.setUnitCost(part.getUnitCost());
        return partRepository.save(existing);
    }

    @Transactional
    public void deletePart(Long id) {
        getPartOrThrow(id);
        partRepository.deleteById(id);
    }

    private WorkOrder getWorkOrderOrThrow(Long workOrderId) {
        return workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Work order not found with id: " + workOrderId));
    }

    private Part getPartOrThrow(Long id) {
        return partRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Part not found with id: " + id));
    }

    private void requireTechnicianAccess(WorkOrder workOrder, UserDetails principal) {
        if (isTechnician(principal) && (workOrder.getAssignedTechnician() == null
                || !workOrder.getAssignedTechnician().getUsername().equals(principal.getUsername()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the assigned technician can manage parts for this work order");
        }
    }

    private boolean isTechnician(UserDetails principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(TECHNICIAN_AUTHORITY));
    }
}