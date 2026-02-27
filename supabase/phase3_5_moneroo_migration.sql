-- Migration Phase 3.5: Add Moneroo Provider
-- Required to support the new Mobile Money Aggregator

-- 1. Add 'moneroo' to the payment_provider enum
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'moneroo';

-- 2. Verify it worked (Optional check)
-- SELECT enum_range(null::payment_provider);
