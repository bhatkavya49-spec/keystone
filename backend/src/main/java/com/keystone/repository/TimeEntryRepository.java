package com.keystone.repository;

import com.keystone.entity.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

    List<TimeEntry> findByWorkOrderId(Long workOrderId);
}