-- invoice_records 테이블 생성
-- 계산서 발행 기록을 저장하는 테이블

CREATE TABLE IF NOT EXISTS invoice_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cms_id BIGINT REFERENCES construction_management(id) ON DELETE SET NULL,

  -- construction_management에서 자동 채워지는 필드 (스냅샷)
  cms_code TEXT,
  site_name TEXT,
  site_address TEXT,
  sales_manager TEXT,
  construction_manager TEXT,

  -- site_summary에서 가져온 금액 정보 (스냅샷, TEXT 타입)
  sales_amount TEXT,           -- 매출금액 (쉼표 포함 문자열)
  purchase_amount TEXT,        -- 매입금액 (쉼표 포함 문자열)

  -- 자동 계산 필드
  profit_difference DECIMAL(15,2),  -- 매출금액 - 매입금액 (차액)
  is_over_invested BOOLEAN,         -- 과투입 여부 (차액이 음수면 true)

  -- 사용자 입력 필드
  invoice_date DATE NOT NULL,       -- 계산서 발행일
  invoice_amount DECIMAL(15,2),     -- 계산서 금액

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_invoice_records_user_id ON invoice_records(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_invoice_date ON invoice_records(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_records_cms_id ON invoice_records(cms_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_created_at ON invoice_records(created_at);

-- 코멘트 추가
COMMENT ON TABLE invoice_records IS '계산서 발행 기록 테이블';
COMMENT ON COLUMN invoice_records.user_id IS '작성자 ID (users 테이블 참조)';
COMMENT ON COLUMN invoice_records.cms_id IS '현장 ID (construction_management 테이블 참조)';
COMMENT ON COLUMN invoice_records.cms_code IS 'CMS 코드 (스냅샷)';
COMMENT ON COLUMN invoice_records.site_name IS '현장명 (스냅샷)';
COMMENT ON COLUMN invoice_records.site_address IS '현장 주소 (스냅샷)';
COMMENT ON COLUMN invoice_records.sales_manager IS '영업 담당자 (스냅샷)';
COMMENT ON COLUMN invoice_records.construction_manager IS '시공 담당자 (스냅샷)';
COMMENT ON COLUMN invoice_records.sales_amount IS '매출금액 (site_summary 스냅샷, 쉼표 포함 문자열)';
COMMENT ON COLUMN invoice_records.purchase_amount IS '매입금액 (site_summary 스냅샷, 쉼표 포함 문자열)';
COMMENT ON COLUMN invoice_records.profit_difference IS '매출금액 - 매입금액 차액';
COMMENT ON COLUMN invoice_records.is_over_invested IS '과투입 여부 (차액이 음수면 true)';
COMMENT ON COLUMN invoice_records.invoice_date IS '계산서 발행일';
COMMENT ON COLUMN invoice_records.invoice_amount IS '계산서 금액';
COMMENT ON COLUMN invoice_records.created_at IS '생성 날짜';
COMMENT ON COLUMN invoice_records.updated_at IS '수정 날짜';
COMMENT ON COLUMN invoice_records.created_by IS '작성자명';
COMMENT ON COLUMN invoice_records.updated_by IS '수정자명';

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_invoice_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_records_updated_at
  BEFORE UPDATE ON invoice_records
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_records_updated_at();
