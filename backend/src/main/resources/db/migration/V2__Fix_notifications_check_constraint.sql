-- Fix notifications check constraint to include all NotificationType values
-- This migration addresses the check constraint violation for WORK_ORDER_STATUS_CHANGED

-- Drop the existing check constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'notifications_type_check'
        AND conrelid = 'notifications'::regclass
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    END IF;
END $$;

-- Add new check constraint with all valid notification types
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('WORK_ORDER_ASSIGNED', 'WORK_ORDER_STATUS_CHANGED', 'SLA_AT_RISK', 'SLA_BREACHED'));