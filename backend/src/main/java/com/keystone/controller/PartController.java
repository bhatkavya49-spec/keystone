package com.keystone.controller;

import com.keystone.entity.Part;
import com.keystone.service.PartService;
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
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @PostMapping("/api/work-orders/{workOrderId}/parts")
    public ResponseEntity<Part> createPart(@PathVariable("workOrderId") Long workOrderId,
                                           @Valid @RequestBody Part part,
                                           @AuthenticationPrincipal UserDetails principal,
                                           UriComponentsBuilder uriBuilder) {
        Part created = partService.createPart(workOrderId, part, principal);
        URI location = uriBuilder.path("/api/parts/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/api/work-orders/{workOrderId}/parts")
    public ResponseEntity<List<Part>> getPartsByWorkOrder(@PathVariable("workOrderId") Long workOrderId,
                                                          @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(partService.getPartsByWorkOrder(workOrderId, principal));
    }

    @GetMapping("/api/parts/{id}")
    public ResponseEntity<Part> getPartById(@PathVariable("id") Long id,
                                            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(partService.getPartById(id, principal));
    }

    @PutMapping("/api/parts/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable("id") Long id,
                                           @Valid @RequestBody Part part,
                                           @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(partService.updatePart(id, part, principal));
    }

    @DeleteMapping("/api/parts/{id}")
    public ResponseEntity<Void> deletePart(@PathVariable("id") Long id) {
        partService.deletePart(id);
        return ResponseEntity.noContent().build();
    }
}