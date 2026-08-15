package com.keystone.service;

import com.keystone.entity.Customer;
import com.keystone.entity.Site;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.SiteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SiteService {

    private final SiteRepository siteRepository;
    private final CustomerRepository customerRepository;

    public SiteService(SiteRepository siteRepository, CustomerRepository customerRepository) {
        this.siteRepository = siteRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional
    public Site createSite(Site site) {
        site.setCustomer(resolveCustomer(site.getCustomer()));
        return siteRepository.save(site);
    }

    @Transactional(readOnly = true)
    public List<Site> getAllSites() {
        return siteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Site getSiteById(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Site not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<Site> getSitesByCustomerId(Long customerId) {
        getCustomerOrThrow(customerId);
        return siteRepository.findByCustomerId(customerId);
    }

    @Transactional
    public Site updateSite(Long id, Site site) {
        Site existing = getSiteById(id);
        existing.setSiteName(site.getSiteName());
        existing.setAddress(site.getAddress());
        existing.setCity(site.getCity());
        existing.setState(site.getState());
        existing.setPostalCode(site.getPostalCode());
        existing.setCustomer(resolveCustomer(site.getCustomer()));
        return siteRepository.save(existing);
    }

    @Transactional
    public void deleteSite(Long id) {
        getSiteById(id);
        siteRepository.deleteById(id);
    }

    private Customer resolveCustomer(Customer customer) {
        if (customer == null || customer.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Customer id is required");
        }
        return getCustomerOrThrow(customer.getId());
    }

    private Customer getCustomerOrThrow(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Customer not found with id: " + customerId));
    }
}