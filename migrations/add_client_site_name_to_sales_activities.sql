-- Add new_client and new_site_name columns to sales_activities table for new sites
ALTER TABLE sales_activities
ADD COLUMN IF NOT EXISTS new_client TEXT,
ADD COLUMN IF NOT EXISTS new_site_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN sales_activities.new_client IS '신규 현장 고객사(거래처)';
COMMENT ON COLUMN sales_activities.new_site_name IS '신규 현장명 (고객사/원도급/현장명 형식)';
