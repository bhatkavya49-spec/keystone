package com.keystone.config;

import com.keystone.entity.Customer;
import com.keystone.entity.NotificationType;
import com.keystone.entity.Role;
import com.keystone.entity.Site;
import com.keystone.entity.User;
import com.keystone.entity.WorkOrder;
import com.keystone.entity.WorkOrderPriority;
import com.keystone.entity.WorkOrderStatus;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.SiteRepository;
import com.keystone.repository.UserRepository;
import com.keystone.repository.WorkOrderRepository;
import com.keystone.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEV_PASSWORD = "password";

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final WorkOrderRepository workOrderRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(JdbcTemplate jdbcTemplate, UserRepository userRepository,
                      CustomerRepository customerRepository, SiteRepository siteRepository,
                      WorkOrderRepository workOrderRepository,
                      NotificationService notificationService, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.workOrderRepository = workOrderRepository;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        dropStaleUsersRoleConstraint();
        ensureEmailColumn();

        seed("manager", Role.MANAGER);
        seed("dispatcher", Role.DISPATCHER);
        seed("technician", Role.TECHNICIAN);
        seed("customer", Role.CUSTOMER);

        seedCustomerPortalData();

        log.info("Ensured development users (password: {}): manager, dispatcher, technician, customer",
                DEV_PASSWORD);
    }

    private void dropStaleUsersRoleConstraint() {
        jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    }

    private void ensureEmailColumn() {
        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(255)");
        jdbcTemplate.update("UPDATE users SET email = username || '@keystone.local' WHERE email IS NULL");
        jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN email SET NOT NULL");
        Integer existingIndexes = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users' AND indexdef ILIKE '%email%'",
                Integer.class);
        if (existingIndexes == null || existingIndexes == 0) {
            jdbcTemplate.execute("CREATE UNIQUE INDEX uk_users_email ON users (email)");
        }
    }

    private void seed(String username, Role role) {
        if (userRepository.existsByUsername(username)) {
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@keystone.local");
        user.setPassword(passwordEncoder.encode(DEV_PASSWORD));
        user.setRole(role);
        userRepository.save(user);
    }

    private void seedCustomerPortalData() {
        User customerUser = userRepository.findByUsername("customer").orElse(null);
        if (customerUser == null) {
            return;
        }

        if (customerRepository.findByEmailIgnoreCase(customerUser.getEmail()).isPresent()) {
            return;
        }

        Customer customer = new Customer();
        customer.setName("Acme Industries");
        customer.setEmail(customerUser.getEmail());
        customer.setPhone("(555) 123-4567");
        customer.setAddress("100 Industrial Way");
        customer.setCity("Springfield");
        customer.setState("IL");
        customer.setPostalCode("62704");
        customer = customerRepository.save(customer);

        Site warehouse = new Site();
        warehouse.setSiteName("Springfield Warehouse");
        warehouse.setAddress("100 Industrial Way");
        warehouse.setCity("Springfield");
        warehouse.setState("IL");
        warehouse.setPostalCode("62704");
        warehouse.setCustomer(customer);
        warehouse = siteRepository.save(warehouse);

        Site branch = new Site();
        branch.setSiteName("Chicago Branch Office");
        branch.setAddress("500 Lakeshore Drive");
        branch.setCity("Chicago");
        branch.setState("IL");
        branch.setPostalCode("60601");
        branch.setCustomer(customer);
        branch = siteRepository.save(branch);

        User technician = userRepository.findByUsername("technician").orElse(null);

        WorkOrder assigned = new WorkOrder();
        assigned.setTitle("Broken conveyor belt");
        assigned.setDescription("The main conveyor belt at the loading dock is jamming. Needs inspection and repair.");
        assigned.setCustomer(customer);
        assigned.setSite(warehouse);
        assigned.setAssignedTechnician(technician);
        assigned.setPriority(WorkOrderPriority.HIGH);
        assigned.setStatus(WorkOrderStatus.ASSIGNED);
        assigned.setScheduledAt(LocalDateTime.now().plusDays(1));
        assigned.setSlaDueAt(LocalDateTime.now().plusDays(2));
        assigned = workOrderRepository.save(assigned);

        WorkOrder inProgress = new WorkOrder();
        inProgress.setTitle("Emergency power outage");
        inProgress.setDescription("Power keeps tripping in the server room. Urgent attention required.");
        inProgress.setCustomer(customer);
        inProgress.setSite(branch);
        inProgress.setAssignedTechnician(technician);
        inProgress.setPriority(WorkOrderPriority.URGENT);
        inProgress.setStatus(WorkOrderStatus.IN_PROGRESS);
        inProgress.setSlaDueAt(LocalDateTime.now().plusHours(6));
        inProgress = workOrderRepository.save(inProgress);

        WorkOrder completed = new WorkOrder();
        completed.setTitle("Door lock replacement");
        completed.setDescription("Replaced the broken lock on the main entrance.");
        completed.setCustomer(customer);
        completed.setSite(branch);
        completed.setPriority(WorkOrderPriority.LOW);
        completed.setStatus(WorkOrderStatus.COMPLETED);
        completed.setCompletedAt(LocalDateTime.now().minusDays(2));
        completed.setSlaDueAt(LocalDateTime.now().minusDays(1));
        completed = workOrderRepository.save(completed);

        notificationService.createNotification(customerUser,
                "Work order #" + assigned.getId() + " (Broken conveyor belt) has been scheduled.",
                NotificationType.WORK_ORDER_ASSIGNED);
        notificationService.createNotification(customerUser,
                "Work order #" + inProgress.getId() + " (Emergency power outage) is being worked on.",
                NotificationType.WORK_ORDER_ASSIGNED);
        notificationService.createNotification(customerUser,
                "Work order #" + completed.getId() + " (Door lock replacement) has been completed.",
                NotificationType.WORK_ORDER_ASSIGNED);

        log.info("Seeded demo customer portal data for account 'customer'");
    }
}