package com.keystone.config;

import com.keystone.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          AuthenticationProvider authenticationProvider) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/auth/users").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/auth/technicians")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/customers/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.POST, "/api/customers/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.PUT, "/api/customers/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/sites/customer/*")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/sites/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.POST, "/api/sites/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.PUT, "/api/sites/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.DELETE, "/api/sites/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/work-orders/*/parts")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.POST, "/api/work-orders/*/parts")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.GET, "/api/parts/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.PUT, "/api/parts/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.DELETE, "/api/parts/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/work-orders/*/time-entries")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.POST, "/api/work-orders/*/time-entries")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.GET, "/api/time-entries/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.PUT, "/api/time-entries/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.DELETE, "/api/time-entries/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/work-orders/*/sla")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.PATCH, "/api/work-orders/*/sla")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.GET, "/api/work-orders/customer/*")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER")
                        .requestMatchers(HttpMethod.POST, "/api/work-orders")
                                .hasAnyRole("MANAGER", "DISPATCHER", "CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/notifications/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER")
                        .requestMatchers(HttpMethod.PATCH, "/api/notifications/*/read")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN", "CUSTOMER")
                        .requestMatchers(HttpMethod.GET, "/api/work-orders/**")
                                .hasAnyRole("MANAGER", "DISPATCHER", "TECHNICIAN")
                        .requestMatchers(HttpMethod.POST, "/api/work-orders/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.PUT, "/api/work-orders/**")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.DELETE, "/api/work-orders/**").hasRole("MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/work-orders/*/assign")
                                .hasAnyRole("MANAGER", "DISPATCHER")
                        .requestMatchers(HttpMethod.PATCH, "/api/work-orders/*/start")
                                .hasRole("TECHNICIAN")
                        .requestMatchers(HttpMethod.PATCH, "/api/work-orders/*/complete")
                                .hasRole("TECHNICIAN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}