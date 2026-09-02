package com.keystone.controller;

import com.keystone.dto.AssignWorkOrderRequest;
import com.keystone.entity.Role;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    public ResponseEntity<WorkOrder> createWorkOrder(@Valid @RequestBody WorkOrder workOrder,
                                                     UriComponentsBuilder uriBuilder) {
        WorkOrder created = workOrderService.createWorkOrder(workOrder);
        URI location = uriBuilder.path("/api/work-orders/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public ResponseEntity<List<WorkOrder>> getAllWorkOrders() {
        return ResponseEntity.ok(workOrderService.getAllWorkOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getWorkOrderById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<WorkOrder>> getWorkOrdersByCustomerId(
            @PathVariable("customerId") Long customerId) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByCustomerId(customerId));
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<WorkOrder>> getWorkOrdersByTechnicianId(
            @PathVariable("technicianId") Long technicianId) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByTechnicianId(technicianId));
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<User>> getTechnicians() {
        return ResponseEntity.ok(workOrderService.getTechnicians());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrder> updateWorkOrder(@PathVariable("id") Long id,
                                                     @Valid @RequestBody WorkOrder workOrder) {
        return ResponseEntity.ok(workOrderService.updateWorkOrder(id, workOrder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable("id") Long id) {
        workOrderService.deleteWorkOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<WorkOrder> assignWorkOrder(@PathVariable("id") Long id,
                                                     @Valid @RequestBody AssignWorkOrderRequest request,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workOrderService.assignWorkOrder(
                id, request.getTechnicianId(), principal.getUsername()));
    }

    @PatchMapping("/{id}/start")
    public ResponseEntity<WorkOrder> startWorkOrder(@PathVariable("id") Long id,
                                                    @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workOrderService.startWorkOrder(id, principal.getUsername()));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<WorkOrder> completeWorkOrder(@PathVariable("id") Long id,
                                                       @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workOrderService.completeWorkOrder(id, principal.getUsername()));
    }

    @PatchMapping("/{id}/hold")
    public ResponseEntity<WorkOrder> holdWorkOrder(@PathVariable("id") Long id,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workOrderService.holdWorkOrder(id, principal.getUsername()));
    }

    @PatchMapping("/{id}/resume")
    public ResponseEntity<WorkOrder> resumeWorkOrder(@PathVariable("id") Long id,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(workOrderService.resumeWorkOrder(id, principal.getUsername()));
    }
}