package com.keystone.service;

import com.keystone.entity.Role;
import com.keystone.entity.TimeEntry;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.repository.TimeEntryRepository;
import com.keystone.repository.UserRepository;
import com.keystone.repository.WorkOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TimeEntryService {

    private static final String TECHNICIAN_AUTHORITY = "ROLE_TECHNICIAN";

    private final TimeEntryRepository timeEntryRepository;
    private final WorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;

    public TimeEntryService(TimeEntryRepository timeEntryRepository,
                            WorkOrderRepository workOrderRepository,
                            UserRepository userRepository) {
        this.timeEntryRepository = timeEntryRepository;
        this.workOrderRepository = workOrderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TimeEntry createTimeEntry(Long workOrderId, TimeEntry timeEntry, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        validateTimeRange(timeEntry);
        User technician = resolveTechnician(timeEntry.getTechnician());
        if (isTechnician(principal)) {
            requireOwnEntry(workOrder, technician, principal);
        }
        timeEntry.setWorkOrder(workOrder);
        timeEntry.setTechnician(technician);
        return timeEntryRepository.save(timeEntry);
    }

    @Transactional(readOnly = true)
    public List<TimeEntry> getTimeEntriesByWorkOrder(Long workOrderId, UserDetails principal) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        requireTechnicianAccess(workOrder, principal);
        List<TimeEntry> entries = timeEntryRepository.findByWorkOrderId(workOrderId);
        if (isTechnician(principal)) {
            entries = entries.stream()
                    .filter(entry -> entry.getTechnician() != null
                            && entry.getTechnician().getUsername().equals(principal.getUsername()))
                    .toList();
        }
        return entries;
    }

    @Transactional(readOnly = true)
    public TimeEntry getTimeEntryById(Long id, UserDetails principal) {
        TimeEntry entry = getTimeEntryOrThrow(id);
        requireTechnicianAccess(entry.getWorkOrder(), principal);
        requireOwnEntryIfTechnician(entry, principal);
        return entry;
    }

    @Transactional
    public TimeEntry updateTimeEntry(Long id, TimeEntry timeEntry, UserDetails principal) {
        TimeEntry existing = getTimeEntryOrThrow(id);
        requireTechnicianAccess(existing.getWorkOrder(), principal);
        validateTimeRange(timeEntry);
        User technician = resolveTechnician(timeEntry.getTechnician());
        if (isTechnician(principal)) {
            requireOwnEntry(existing.getWorkOrder(), technician, principal);
        }
        existing.setTechnician(technician);
        existing.setStartTime(timeEntry.getStartTime());
        existing.setEndTime(timeEntry.getEndTime());
        return timeEntryRepository.save(existing);
    }

    @Transactional
    public void deleteTimeEntry(Long id) {
        getTimeEntryOrThrow(id);
        timeEntryRepository.deleteById(id);
    }

    private void validateTimeRange(TimeEntry timeEntry) {
        if (timeEntry.getEndTime() != null && timeEntry.getEndTime().isBefore(timeEntry.getStartTime())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "endTime must not be before startTime");
        }
    }

    private User resolveTechnician(User technician) {
        if (technician == null || technician.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Technician id is required");
        }
        User user = userRepository.findById(technician.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with id: " + technician.getId()));
        if (user.getRole() != Role.TECHNICIAN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "User is not a technician: " + user.getUsername());
        }
        return user;
    }

    private void requireOwnEntry(WorkOrder workOrder, User technician, UserDetails principal) {
        if (technician == null || !technician.getUsername().equals(principal.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Technicians can only manage their own time entries");
        }
        requireTechnicianAccess(workOrder, principal);
    }

    private void requireOwnEntryIfTechnician(TimeEntry entry, UserDetails principal) {
        if (isTechnician(principal) && (entry.getTechnician() == null
                || !entry.getTechnician().getUsername().equals(principal.getUsername()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Technicians can only access their own time entries");
        }
    }

    private void requireTechnicianAccess(WorkOrder workOrder, UserDetails principal) {
        if (isTechnician(principal) && (workOrder.getAssignedTechnician() == null
                || !workOrder.getAssignedTechnician().getUsername().equals(principal.getUsername()))) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only the assigned technician can manage this work order");
        }
    }

    private boolean isTechnician(UserDetails principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals(TECHNICIAN_AUTHORITY));
    }

    private WorkOrder getWorkOrderOrThrow(Long workOrderId) {
        return workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Work order not found with id: " + workOrderId));
    }

    private TimeEntry getTimeEntryOrThrow(Long id) {
        return timeEntryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Time entry not found with id: " + id));
    }
}