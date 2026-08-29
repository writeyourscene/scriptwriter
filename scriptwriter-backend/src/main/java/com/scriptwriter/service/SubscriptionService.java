package com.scriptwriter.service;

import com.scriptwriter.dto.request.SubscriptionRequest.CreateOrderRequest;
import com.scriptwriter.dto.request.SubscriptionRequest.VerifyPaymentRequest;
import com.scriptwriter.dto.response.UserResponse;

import java.util.Map;

public interface SubscriptionService {
    Map<String, Object> createOrder(Long userId, CreateOrderRequest request);
    UserResponse verifyPayment(Long userId, VerifyPaymentRequest request);
    com.scriptwriter.entity.SubscriptionConfig getConfig();
    com.scriptwriter.entity.SubscriptionConfig updateConfig(int monthlyPriceRupees, int yearlyPriceRupees);
}
