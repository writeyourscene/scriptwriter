-- Manual migration: Add yearly_discount_percent column to subscription_configs table
ALTER TABLE subscription_configs ADD COLUMN IF NOT EXISTS yearly_discount_percent INTEGER NOT NULL DEFAULT 15;
