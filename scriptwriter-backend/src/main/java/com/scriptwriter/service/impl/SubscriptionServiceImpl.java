package com.scriptwriter.service.impl;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import com.scriptwriter.dto.request.SubscriptionRequest.CreateOrderRequest;
import com.scriptwriter.dto.request.SubscriptionRequest.VerifyPaymentRequest;
import com.scriptwriter.dto.response.UserResponse;
import com.scriptwriter.entity.User;
import com.scriptwriter.exception.BadRequestException;
import com.scriptwriter.exception.ResourceNotFoundException;
import com.scriptwriter.mapper.UserMapper;
import com.scriptwriter.repository.UserRepository;
import com.scriptwriter.service.SubscriptionService;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final com.scriptwriter.repository.SubscriptionConfigRepository subscriptionConfigRepository;

    public SubscriptionServiceImpl(
            UserRepository userRepository,
            UserMapper userMapper,
            com.scriptwriter.repository.SubscriptionConfigRepository subscriptionConfigRepository
    ) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.subscriptionConfigRepository = subscriptionConfigRepository;
    }

    @Override
    @Transactional
    public Map<String, Object> createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int amount;
        com.scriptwriter.entity.SubscriptionConfig config = getConfig();
        if ("YEARLY".equalsIgnoreCase(request.getPlanType())) {
            int basePaise    = config.getYearlyPricePaise();
            int discountPct  = config.getYearlyDiscountPercent();
            amount = (int) Math.round(basePaise * (1.0 - discountPct / 100.0));
        } else {
            int basePaise    = config.getMonthlyPricePaise();
            int discountPct  = config.getMonthlyDiscountPercent();
            amount = (int) Math.round(basePaise * (1.0 - discountPct / 100.0));
        }

        Map<String, Object> response = new HashMap<>();

        // Fallback for mock environment
        if ("rzp_test_dummy".equals(keyId)) {
            String mockOrderId = "order_mock_" + System.currentTimeMillis();
            user.setRazorpayOrderId(mockOrderId);
            userRepository.save(user);

            response.put("orderId", mockOrderId);
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("planType", request.getPlanType().toUpperCase());
            response.put("keyId", keyId);
            return response;
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "receipt_" + user.getId() + "_" + System.currentTimeMillis());

            Order order = client.orders.create(orderRequest);
            String orderIdStr = order.get("id");

            user.setRazorpayOrderId(orderIdStr);
            userRepository.save(user);

            response.put("orderId", orderIdStr);
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("planType", request.getPlanType().toUpperCase());
            response.put("keyId", keyId);
            return response;
        } catch (Exception e) {
            throw new BadRequestException("Failed to initiate payment order: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public UserResponse verifyPayment(Long userId, VerifyPaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean verified = false;

        // Fallback verification for mock environment
        if ("rzp_test_dummy".equals(keyId) && "mock_signature".equals(request.getRazorpaySignature())) {
            verified = true;
        } else {
            try {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", request.getRazorpayOrderId());
                options.put("razorpay_payment_id", request.getRazorpayPaymentId());
                options.put("razorpay_signature", request.getRazorpaySignature());

                verified = Utils.verifyPaymentSignature(options, keySecret);
            } catch (Exception e) {
                throw new BadRequestException("Signature verification failed: " + e.getMessage());
            }
        }

        if (!verified) {
            throw new BadRequestException("Invalid payment signature");
        }

        // Grant access and update subscription details
        user.setSubscriptionStatus("ACTIVE");
        user.setRazorpayOrderId(request.getRazorpayOrderId());
        user.setRazorpayPaymentId(request.getRazorpayPaymentId());

        LocalDateTime now = LocalDateTime.now();
        if ("YEARLY".equalsIgnoreCase(request.getPlanType())) {
            user.setSubscriptionExpiresAt(now.plusYears(1));
        } else {
            user.setSubscriptionExpiresAt(now.plusMonths(1));
        }
        
        user.setProjectAccess(true);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Override
    public com.scriptwriter.entity.SubscriptionConfig getConfig() {
        return subscriptionConfigRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.scriptwriter.entity.SubscriptionConfig defaultConfig = com.scriptwriter.entity.SubscriptionConfig.builder()
                    .monthlyPricePaise(9900) // default ₹99
                    .yearlyPricePaise(99900)  // default ₹999
                    .monthlyDiscountPercent(0) // default 0%
                    .yearlyDiscountPercent(15) // default 15%
                    .build();
            return subscriptionConfigRepository.save(defaultConfig);
        });
    }

    @Override
    @Transactional
    public com.scriptwriter.entity.SubscriptionConfig updateConfig(int monthlyPriceRupees, int yearlyPriceRupees, int monthlyDiscountPercent, int yearlyDiscountPercent) {
        com.scriptwriter.entity.SubscriptionConfig config = getConfig();
        config.setMonthlyPricePaise(monthlyPriceRupees * 100);
        config.setYearlyPricePaise(yearlyPriceRupees * 100);
        config.setMonthlyDiscountPercent(monthlyDiscountPercent);
        config.setYearlyDiscountPercent(yearlyDiscountPercent);
        return subscriptionConfigRepository.save(config);
    }
}
