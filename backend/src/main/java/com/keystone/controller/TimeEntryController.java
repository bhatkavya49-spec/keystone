package com.keystone.controller;

import com.keystone.entity.TimeEntry;
import com.keystone.service.TimeEntryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
public class TimeEntryController {

    private final TimeEntryService timeEntryService;

    public TimeEntryController(TimeEntryService timeEntryService) {
        this.timeEntryService = timeEntryService;
    }

    @PostMapping("/api/work-orders/{workOrderId}/time-entries")
    public ResponseEntity<TimeEntry> createTimeEntry(@PathVariable("workOrderId") Long workOrderId,
                                                     @Valid @RequestBody TimeEntry timeEntry,
                                                     @AuthenticationPrincipal UserDetails principal,
                                                     UriComponentsBuilder uriBuilder) {
        TimeEntry created = timeEntryService.createTimeEntry(workOrderId, timeEntry, principal);
        URI location = uriBuilder.path("/api/time-entries/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/api/work-orders/{workOrderId}/time-entries")
    public ResponseEntity<List<TimeEntry>> getTimeEntriesByWorkOrder(
            @PathVariable("workOrderId") Long workOrderId,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(timeEntryService.getTimeEntriesByWorkOrder(workOrderId, principal));
    }

    @GetMapping("/api/time-entries/{id}")
    public ResponseEntity<TimeEntry> getTimeEntryById(@PathVariable("id") Long id,
                                                      @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(timeEntryService.getTimeEntryById(id, principal));
    }

    @PutMapping("/api/time-entries/{id}")
    public ResponseEntity<TimeEntry> updateTimeEntry(@PathVariable("id") Long id,
                                                     @Valid @RequestBody TimeEntry timeEntry,
                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(timeEntryService.updateTimeEntry(id, timeEntry, principal));
    }

    @DeleteMapping("/api/time-entries/{id}")
    public ResponseEntity<Void> deleteTimeEntry(@PathVariable("id") Long id) {
        timeEntryService.deleteTimeEntry(id);
        return ResponseEntity.noContent().build();
    }
}