package com.keystone.controller;

import com.keystone.entity.Site;
import com.keystone.service.SiteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @PostMapping
    public ResponseEntity<Site> createSite(@Valid @RequestBody Site site,
                                           UriComponentsBuilder uriBuilder) {
        Site created = siteService.createSite(site);
        URI location = uriBuilder.path("/api/sites/{id}").buildAndExpand(created.getId()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Site>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> getSiteById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(siteService.getSiteById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Site>> getSitesByCustomerId(@PathVariable("customerId") Long customerId) {
        return ResponseEntity.ok(siteService.getSitesByCustomerId(customerId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Site> updateSite(@PathVariable("id") Long id,
                                           @Valid @RequestBody Site site) {
        return ResponseEntity.ok(siteService.updateSite(id, site));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(@PathVariable("id") Long id) {
        siteService.deleteSite(id);
        return ResponseEntity.noContent().build();
    }
}