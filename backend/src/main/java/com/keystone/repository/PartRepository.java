package com.keystone.repository;

import com.keystone.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartRepository extends JpaRepository<Part, Long> {

    List<Part> findByWorkOrderId(Long workOrderId);
}