-- =====================================================
-- Sales Activities Table (영업 활동 테이블)
-- =====================================================

CREATE TABLE IF NOT EXISTS sales_activities (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity Information
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('estimate', 'contract')),
  site_type TEXT NOT NULL CHECK (site_type IN ('existing', 'new')),

  -- Construction Site Information (snapshot for existing sites)
  cms_id BIGINT REFERENCES construction_management(id) ON DELETE SET NULL,
  cms_code TEXT,
  site_name TEXT,
  site_address TEXT,
  client TEXT,

  -- Sales Information
  amount DECIMAL(15, 2),
  execution_rate INTEGER CHECK (execution_rate >= 0 AND execution_rate <= 100),

  -- Attachments (store as JSON array of image URLs/base64)
  attachments JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sales_activities_user_id ON sales_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_activity_date ON sales_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_sales_activities_activity_type ON sales_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_sales_activities_site_type ON sales_activities(site_type);
CREATE INDEX IF NOT EXISTS idx_sales_activities_cms_id ON sales_activities(cms_id);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE sales_activities IS '영업 활동 기록 테이블';
COMMENT ON COLUMN sales_activities.user_id IS '작성자 ID (users 테이블 참조)';
COMMENT ON COLUMN sales_activities.activity_date IS '활동 날짜';
COMMENT ON COLUMN sales_activities.activity_type IS '활동 구분 (estimate: 견적, contract: 계약)';
COMMENT ON COLUMN sales_activities.site_type IS '현장 구분 (existing: 기존, new: 신규)';
COMMENT ON COLUMN sales_activities.cms_id IS '현장 ID (construction_management 테이블 참조, 기존 현장인 경우)';
COMMENT ON COLUMN sales_activities.cms_code IS '현장 코드 (스냅샷)';
COMMENT ON COLUMN sales_activities.site_name IS '현장명 (스냅샷)';
COMMENT ON COLUMN sales_activities.site_address IS '현장 주소 (스냅샷)';
COMMENT ON COLUMN sales_activities.client IS '고객사 (스냅샷)';
COMMENT ON COLUMN sales_activities.amount IS '금액 (견적금액 또는 계약금액)';
COMMENT ON COLUMN sales_activities.execution_rate IS '실행률 (%)';
COMMENT ON COLUMN sales_activities.attachments IS '첨부 사진 배열 (JSON)';
COMMENT ON COLUMN sales_activities.created_at IS '등록 날짜';
COMMENT ON COLUMN sales_activities.updated_at IS '수정 날짜';
COMMENT ON COLUMN sales_activities.created_by IS '작성자 이름';
COMMENT ON COLUMN sales_activities.updated_by IS '수정자 이름';

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_sales_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_activities_updated_at
  BEFORE UPDATE ON sales_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_activities_updated_at();
