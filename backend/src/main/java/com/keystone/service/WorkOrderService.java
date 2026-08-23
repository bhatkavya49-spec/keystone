package com.keystone.service;

import com.keystone.entity.Customer;
import com.keystone.entity.NotificationType;
import com.keystone.entity.Role;
import com.keystone.entity.Site;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.entity.WorkOrderStatus;
import com.keystone.entity.WorkOrderStatusHistory;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.SiteRepository;
import com.keystone.repository.UserRepository;
import com.keystone.repository.WorkOrderRepository;
import com.keystone.repository.WorkOrderStatusHistoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WorkOrderStatusHistoryRepository statusHistoryRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            CustomerRepository customerRepository,
                            SiteRepository siteRepository,
                            UserRepository userRepository,
                            NotificationService notificationService,
                            WorkOrderStatusHistoryRepository statusHistoryRepository) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    @Transactional
    public WorkOrder createWorkOrder(WorkOrder workOrder) {
        workOrder.setCustomer(resolveCustomer(workOrder.getCustomer()));
        workOrder.setSite(resolveSite(workOrder.getSite()));
        workOrder.setAssignedTechnician(resolveTechnician(workOrder.getAssignedTechnician()));
        if (workOrder.getStatus() == null) {
            workOrder.setStatus(WorkOrderStatus.NEW);
        }
        return workOrderRepository.save(workOrder);
    }

    @Transactional(readOnly = true)
    public List<WorkOrder> getAllWorkOrders() {
        return workOrderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public WorkOrder getWorkOrderById(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Work order not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<WorkOrder> getWorkOrdersByCustomerId(Long customerId) {
        getCustomerOrThrow(customerId);
        return workOrderRepository.findByCustomerId(customerId);
    }

    @Transactional(readOnly = true)
    public List<WorkOrder> getWorkOrdersByTechnicianId(Long technicianId) {
        getTechnicianOrThrow(technicianId);
        return workOrderRepository.findByAssignedTechnicianId(technicianId);
    }

    @Transactional
    public WorkOrder updateWorkOrder(Long id, WorkOrder workOrder) {
        WorkOrder existing = getWorkOrderById(id);
        existing.setTitle(workOrder.getTitle());
        existing.setDescription(workOrder.getDescription());
        existing.setCustomer(resolveCustomer(workOrder.getCustomer()));
        existing.setSite(resolveSite(workOrder.getSite()));
        existing.setAssignedTechnician(resolveTechnician(workOrder.getAssignedTechnician()));
        existing.setPriority(workOrder.getPriority());
        existing.setStatus(workOrder.getStatus() != null
                ? workOrder.getStatus() : existing.getStatus());
        existing.setScheduledAt(workOrder.getScheduledAt());
        existing.setCompletedAt(workOrder.getCompletedAt());
        return workOrderRepository.save(existing);
    }

    @Transactional
    public void deleteWorkOrder(Long id) {
        getWorkOrderById(id);
        workOrderRepository.deleteById(id);
    }

    @Transactional
    public WorkOrder assignWorkOrder(Long id, Long technicianId, String currentUsername) {
        requireNotTechnician(currentUsername);
        WorkOrder workOrder = getWorkOrderById(id);
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Cannot assign a completed work order");
        }
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + technicianId));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User is not a technician: " + technician.getUsername());
        }
        boolean wasAlreadyAssigned = workOrder.getAssignedTechnician() != null
                && workOrder.getAssignedTechnician().getUsername().equals(technician.getUsername());
        WorkOrderStatus previousStatus = workOrder.getStatus();
        workOrder.setAssignedTechnician(technician);
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        WorkOrder saved = workOrderRepository.save(workOrder);
        if (saved.getStatus() != previousStatus) {
            recordStatusHistory(saved, previousStatus, saved.getStatus(),
                    currentUsername, "Assigned to " + technician.getUsername());
        }
        notificationService.createNotification(technician,
                "Work order #" + saved.getId() + " has been assigned to you",
                NotificationType.WORK_ORDER_ASSIGNED);
        if (!wasAlreadyAssigned && workOrder.getCustomer() != null && workOrder.getCustomer().getEmail() != null) {
            userRepository.findByEmail(workOrder.getCustomer().getEmail())
                    .ifPresent(customerUser -> {
                        notificationService.createNotification(customerUser,
                                "Work order #" + saved.getId() + " has been assigned to a technician",
                                NotificationType.WORK_ORDER_ASSIGNED);
                    });
        }
        return saved;
    }

    @Transactional
    public WorkOrder startWorkOrder(Long id, String currentUsername) {
        WorkOrder workOrder = getWorkOrderById(id);
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Cannot start a completed work order");
        }
        if (workOrder.getStatus() != WorkOrderStatus.ASSIGNED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Work order must be ASSIGNED before it can be started");
        }
        requireAssignedTechnician(workOrder, currentUsername);
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        return workOrderRepository.save(workOrder);
    }

    @Transactional
    public WorkOrder completeWorkOrder(Long id, String currentUsername) {
        WorkOrder workOrder = getWorkOrderById(id);
        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Work order is already completed");
        }
        if (workOrder.getStatus() != WorkOrderStatus.IN_PROGRESS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Work order must be IN_PROGRESS before it can be completed");
        }
        requireAssignedTechnician(workOrder, currentUsername);
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        workOrder.setCompletedAt(LocalDateTime.now());
        return workOrderRepository.save(workOrder);
    }

    private void requireAssignedTechnician(WorkOrder workOrder, String currentUsername) {
        if (workOrder.getAssignedTechnician() == null
                || !workOrder.getAssignedTechnician().getUsername().equals(currentUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the assigned technician can perform this action");
        }
    }

    private Customer resolveCustomer(Customer customer) {
        if (customer == null || customer.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Customer id is required");
        }
        return getCustomerOrThrow(customer.getId());
    }

    private Site resolveSite(Site site) {
        if (site == null || site.getId() == null) {
            return null;
        }
        return siteRepository.findById(site.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Site not found with id: " + site.getId()));
    }

    private User resolveTechnician(User technician) {
        if (technician == null || technician.getId() == null) {
            return null;
        }
        return getTechnicianOrThrow(technician.getId());
    }

    private Customer getCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found with id: " + customerId));
    }

    private User getTechnicianOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + userId));
    }

    private void requireNotTechnician(String currentUsername) {
        userRepository.findByUsername(currentUsername)
                .filter(user -> user.getRole() == Role.TECHNICIAN)
                .ifPresent(user -> {
                    throw new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "Technicians cannot assign work orders");
                });
    }

    private void recordStatusHistory(WorkOrder workOrder, WorkOrderStatus from,
                                     WorkOrderStatus to, String changedBy, String note) {
        WorkOrderStatusHistory history = new WorkOrderStatusHistory();
        history.setWorkOrder(workOrder);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(changedBy);
        history.setChangedAt(LocalDateTime.now());
        history.setNote(note);
        statusHistoryRepository.save(history);
    }
}