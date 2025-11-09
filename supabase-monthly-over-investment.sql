-- Create monthly_over_investment table for tracking monthly over-investment data
CREATE TABLE IF NOT EXISTS monthly_over_investment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  manager_name TEXT NOT NULL,  -- 담당자 이름
  amount NUMERIC NOT NULL,      -- 금액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,  -- 작성자 (관리자 이름)

  -- Ensure unique combination of year, month, and manager_name
  UNIQUE(year, month, manager_name)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_over_investment_year_month
  ON monthly_over_investment(year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_over_investment_manager
  ON monthly_over_investment(manager_name);

-- Add comment
COMMENT ON TABLE monthly_over_investment IS '월별 과투입 현황 데이터';
COMMENT ON COLUMN monthly_over_investment.manager_name IS '담당자 이름 (users 테이블의 name과 연동)';
COMMENT ON COLUMN monthly_over_investment.amount IS '과투입 금액';
