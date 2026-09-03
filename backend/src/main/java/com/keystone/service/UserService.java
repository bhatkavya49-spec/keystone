package com.keystone.service;

import com.keystone.dto.CurrentUserResponse;
import com.keystone.dto.LoginRequest;
import com.keystone.dto.LoginResponse;
import com.keystone.dto.RegistrationRequest;
import com.keystone.entity.Customer;
import com.keystone.entity.Role;
import com.keystone.entity.User;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.UserRepository;
import com.keystone.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public User register(RegistrationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Username already exists: " + request.getUsername());
        }

        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Email already exists: " + email);
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.CUSTOMER);
        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.CUSTOMER) {
            Customer customer = new Customer();
            customer.setName(savedUser.getUsername());
            customer.setEmail(savedUser.getEmail());
            customerRepository.save(customer);
        }

        return savedUser;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String identifier = loginIdentifier(request);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));

        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        String token = jwtService.generateToken(user.getUsername());
        return new LoginResponse(token, user.getUsername(), user.getEmail(), user.getRole());
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found: " + username));

        Customer customer = customerRepository.findByEmailIgnoreCase(user.getEmail()).orElse(null);
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                customer != null ? customer.getId() : null,
                customer != null ? customer.getName() : null);
    }

    @Transactional(readOnly = true)
    public List<User> getTechnicians() {
        return userRepository.findAllByRole(Role.TECHNICIAN);
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    private String loginIdentifier(LoginRequest request) {
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            return normalizeEmail(request.getEmail());
        }
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            return request.getUsername();
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Username or email is required");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}