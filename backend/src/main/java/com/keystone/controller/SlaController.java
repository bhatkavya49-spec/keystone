package com.keystone.controller;

import com.keystone.dto.SlaStatusResponse;
import com.keystone.service.SlaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-orders/{id}/sla")
public class SlaController {

    private final SlaService slaService;

    public SlaController(SlaService slaService) {
        this.slaService = slaService;
    }

    @GetMapping
    public ResponseEntity<SlaStatusResponse> getSlaStatus(@PathVariable("id") Long id,
                                                          @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(slaService.getSlaStatus(id, principal));
    }

    @PatchMapping
    public ResponseEntity<SlaStatusResponse> updateSlaStatus(@PathVariable("id") Long id,
                                                             @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(slaService.updateSlaStatus(id, principal));
    }
}