-- Add plan_type column to weekly_plans table for complete independence between activity and target plans
-- This migration allows separate management of activity plans and target amount plans

-- 1. Create ENUM type for plan_type
DO $$ BEGIN
  CREATE TYPE weekly_plan_type AS ENUM ('activity', 'target', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add plan_type column with default value 'both' for backward compatibility
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS plan_type weekly_plan_type DEFAULT 'both' NOT NULL;

-- 3. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_weekly_plans_plan_type ON weekly_plans(plan_type);

-- 4. Add comment for documentation
COMMENT ON COLUMN weekly_plans.plan_type IS '계획 유형: activity(목표 활동 계획), target(목표 금액 계획), both(호환용)';

-- 5. Update existing records
-- Records with activity checkboxes but no target amounts -> 'activity'
-- Records with target amounts but no activity checkboxes -> 'target'
-- Records with both -> keep 'both'
UPDATE weekly_plans
SET plan_type = CASE
  -- If has any target amounts and no activities -> 'target'
  WHEN (target_sales > 0 OR target_order_sales_contribution > 0 OR target_order_profit_contribution > 0 OR target_collection > 0)
    AND NOT (activity_construction_sales OR activity_site_additional_sales OR activity_site_support)
  THEN 'target'::weekly_plan_type

  -- If has any activities and no target amounts -> 'activity'
  WHEN (activity_construction_sales OR activity_site_additional_sales OR activity_site_support)
    AND (COALESCE(target_sales, 0) = 0 AND COALESCE(target_order_sales_contribution, 0) = 0
         AND COALESCE(target_order_profit_contribution, 0) = 0 AND COALESCE(target_collection, 0) = 0)
  THEN 'activity'::weekly_plan_type

  -- Otherwise keep as 'both'
  ELSE 'both'::weekly_plan_type
END
WHERE plan_type = 'both';
