-- Create monthly_collection table for tracking monthly collection and outstanding balance data
CREATE TABLE IF NOT EXISTS monthly_collection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  manager_name TEXT NOT NULL,  -- 담당자 이름
  collection_amount NUMERIC NOT NULL DEFAULT 0,  -- 수금 금액
  outstanding_amount NUMERIC NOT NULL DEFAULT 0, -- 미수 금액
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,  -- 작성자 (관리자 이름)

  -- Ensure unique combination of year, month, and manager_name
  UNIQUE(year, month, manager_name)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_collection_year_month
  ON monthly_collection(year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_collection_manager
  ON monthly_collection(manager_name);

-- Add comment
COMMENT ON TABLE monthly_collection IS '월별 수금/미수금 현황 데이터';
COMMENT ON COLUMN monthly_collection.manager_name IS '담당자 이름 (users 테이블의 name과 연동)';
COMMENT ON COLUMN monthly_collection.collection_amount IS '수금 금액';
COMMENT ON COLUMN monthly_collection.outstanding_amount IS '미수 금액';
