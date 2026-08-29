package com.scriptwriter.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subscription_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "monthly_price_paise", nullable = false)
    private int monthlyPricePaise;

    @Column(name = "yearly_price_paise", nullable = false)
    private int yearlyPricePaise;

    @Column(name = "yearly_discount_percent", nullable = false)
    @Builder.Default
    private int yearlyDiscountPercent = 15;

    @Column(name = "monthly_discount_percent", nullable = false)
    @Builder.Default
    private int monthlyDiscountPercent = 0;
}
