-- daily_plans 테이블 생성
-- 일일 업무 일지를 저장하는 테이블

CREATE TABLE IF NOT EXISTS daily_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cms_id BIGINT REFERENCES construction_management(id) ON DELETE SET NULL,

  -- construction_management에서 자동 채워지는 필드 (스냅샷)
  cms_code TEXT,
  site_name TEXT,
  site_address TEXT,
  sales_manager TEXT,
  construction_manager TEXT,

  -- 활동 구분 (체크박스, 중복 선택 가능)
  activity_construction_sales BOOLEAN DEFAULT false,
  activity_site_additional_sales BOOLEAN DEFAULT false,
  activity_site_support BOOLEAN DEFAULT false,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_plans_created_at ON daily_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_plans_cms_id ON daily_plans(cms_id);

-- 코멘트 추가
COMMENT ON TABLE daily_plans IS '일일 업무 일지 테이블';
COMMENT ON COLUMN daily_plans.user_id IS '작성자 ID (users 테이블 참조)';
COMMENT ON COLUMN daily_plans.cms_id IS '현장 ID (construction_management 테이블 참조)';
COMMENT ON COLUMN daily_plans.cms_code IS 'CMS 코드 (스냅샷)';
COMMENT ON COLUMN daily_plans.site_name IS '현장명 (스냅샷)';
COMMENT ON COLUMN daily_plans.site_address IS '현장 주소 (스냅샷)';
COMMENT ON COLUMN daily_plans.sales_manager IS '영업 담당자 (스냅샷)';
COMMENT ON COLUMN daily_plans.construction_manager IS '시공 담당자 (스냅샷)';
COMMENT ON COLUMN daily_plans.activity_construction_sales IS '활동구분: 건설사 영업';
COMMENT ON COLUMN daily_plans.activity_site_additional_sales IS '활동구분: 현장 추가 영업';
COMMENT ON COLUMN daily_plans.activity_site_support IS '활동구분: 현장 지원';
COMMENT ON COLUMN daily_plans.created_at IS '생성 날짜';
COMMENT ON COLUMN daily_plans.updated_at IS '수정 날짜';
COMMENT ON COLUMN daily_plans.created_by IS '작성자명';
COMMENT ON COLUMN daily_plans.updated_by IS '수정자명';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_daily_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_plans_updated_at
  BEFORE UPDATE ON daily_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_plans_updated_at();
