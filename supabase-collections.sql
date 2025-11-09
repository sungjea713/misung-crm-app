-- Create collections table for tracking collection records
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cms_id INTEGER,  -- CMS ID (외래 키 제약 조건 제거)
  cms_code TEXT,
  site_name TEXT,
  site_address TEXT,
  sales_manager TEXT,
  construction_manager TEXT,
  collection_date DATE NOT NULL,  -- 수금일
  collection_amount NUMERIC,  -- 수금 금액
  outstanding_balance NUMERIC,  -- 미수금 잔액 (관리자 업로드 미수금 - 수금 금액)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,  -- 작성자 이름
  updated_by TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_cms_id ON collections(cms_id);
CREATE INDEX IF NOT EXISTS idx_collections_collection_date ON collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_collections_created_by ON collections(created_by);

-- Add comments
COMMENT ON TABLE collections IS '수금 관리 기록';
COMMENT ON COLUMN collections.collection_date IS '수금일';
COMMENT ON COLUMN collections.collection_amount IS '수금 금액';
COMMENT ON COLUMN collections.outstanding_balance IS '미수금 잔액 (관리자 업로드 미수금 - 수금 금액)';
