package com.keystone.repository;

import com.keystone.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    List<WorkOrder> findByCustomerId(Long customerId);

    List<WorkOrder> findByAssignedTechnicianId(Long assignedTechnicianId);
}