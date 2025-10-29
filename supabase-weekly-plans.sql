-- weekly_plans 테이블 생성
-- 주간 업무 계획을 저장하는 테이블

CREATE TABLE IF NOT EXISTS weekly_plans (
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
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_created_at ON weekly_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_cms_id ON weekly_plans(cms_id);

-- 코멘트 추가
COMMENT ON TABLE weekly_plans IS '주간 업무 계획 테이블';
COMMENT ON COLUMN weekly_plans.user_id IS '작성자 ID (users 테이블 참조)';
COMMENT ON COLUMN weekly_plans.cms_id IS '현장 ID (construction_management 테이블 참조)';
COMMENT ON COLUMN weekly_plans.cms_code IS 'CMS 코드 (스냅샷)';
COMMENT ON COLUMN weekly_plans.site_name IS '현장명 (스냅샷)';
COMMENT ON COLUMN weekly_plans.site_address IS '현장 주소 (스냅샷)';
COMMENT ON COLUMN weekly_plans.sales_manager IS '영업 담당자 (스냅샷)';
COMMENT ON COLUMN weekly_plans.construction_manager IS '시공 담당자 (스냅샷)';
COMMENT ON COLUMN weekly_plans.activity_construction_sales IS '활동구분: 건설사 영업';
COMMENT ON COLUMN weekly_plans.activity_site_additional_sales IS '활동구분: 현장 추가 영업';
COMMENT ON COLUMN weekly_plans.activity_site_support IS '활동구분: 현장 지원';
COMMENT ON COLUMN weekly_plans.created_at IS '생성 날짜';
COMMENT ON COLUMN weekly_plans.updated_at IS '수정 날짜';
COMMENT ON COLUMN weekly_plans.created_by IS '작성자명';
COMMENT ON COLUMN weekly_plans.updated_by IS '수정자명';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_weekly_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_plans_updated_at();