package com.scriptwriter.controller;

import com.scriptwriter.dto.request.SubscriptionRequest.CreateOrderRequest;
import com.scriptwriter.dto.request.SubscriptionRequest.VerifyPaymentRequest;
import com.scriptwriter.response.ApiResponse;
import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.security.UserPrincipal;
import com.scriptwriter.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        Map<String, Object> order = subscriptionService.createOrder(principal.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", order));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse<UserResponse>> verifyPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        UserResponse response = subscriptionService.verifyPayment(principal.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified and subscription activated", response));
    }

    @org.springframework.web.bind.annotation.GetMapping("/config")
    public ResponseEntity<ApiResponse<com.scriptwriter.entity.SubscriptionConfig>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success("Subscription pricing configurations retrieved", subscriptionService.getConfig()));
    }

    @org.springframework.web.bind.annotation.PutMapping("/config")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.scriptwriter.entity.SubscriptionConfig>> updateConfig(
            @org.springframework.web.bind.annotation.RequestParam int monthlyPrice,
            @org.springframework.web.bind.annotation.RequestParam int yearlyPrice,
            @org.springframework.web.bind.annotation.RequestParam int yearlyDiscountPercent
    ) {
        com.scriptwriter.entity.SubscriptionConfig updated = subscriptionService.updateConfig(monthlyPrice, yearlyPrice, yearlyDiscountPercent);
        return ResponseEntity.ok(ApiResponse.success("Subscription pricing configurations updated", updated));
    }
}
