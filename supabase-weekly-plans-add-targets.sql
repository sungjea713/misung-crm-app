-- weekly_plans 테이블에 목표 금액 컬럼 추가
-- 주간 업무 계획에 목표 금액 설정 기능 추가

-- 목표 금액 컬럼 추가
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS target_sales DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_order_sales_contribution DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_order_profit_contribution DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_order_total DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_collection DECIMAL(15, 2) DEFAULT 0;

-- 코멘트 추가
COMMENT ON COLUMN weekly_plans.target_sales IS '목표 매출 (원)';
COMMENT ON COLUMN weekly_plans.target_order_sales_contribution IS '목표 수주 - 매출 기여 (원)';
COMMENT ON COLUMN weekly_plans.target_order_profit_contribution IS '목표 수주 - 이익 기여 (원)';
COMMENT ON COLUMN weekly_plans.target_order_total IS '목표 수주 - 합계 (매출기여 + 이익기여, 자동계산) (원)';
COMMENT ON COLUMN weekly_plans.target_collection IS '목표 수금 (원)';

-- 목표 수주 합계 자동 계산 트리거 함수
CREATE OR REPLACE FUNCTION calculate_target_order_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.target_order_total = COALESCE(NEW.target_order_sales_contribution, 0) + COALESCE(NEW.target_order_profit_contribution, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (INSERT 및 UPDATE 시 자동 계산)
DROP TRIGGER IF EXISTS trigger_calculate_target_order_total ON weekly_plans;
CREATE TRIGGER trigger_calculate_target_order_total
  BEFORE INSERT OR UPDATE ON weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION calculate_target_order_total();
