-- Remove execution_rate upper limit constraint
-- 실행률이 100%를 초과할 수 있도록 제약조건 수정

-- 1. 기존 제약조건 삭제
ALTER TABLE sales_activities
DROP CONSTRAINT IF EXISTS sales_activities_execution_rate_check;

-- 2. 새로운 제약조건 추가 (0 이상만 체크, 상한선 없음)
ALTER TABLE sales_activities
ADD CONSTRAINT sales_activities_execution_rate_check
CHECK (execution_rate >= 0);

-- 3. 코멘트 업데이트
COMMENT ON COLUMN sales_activities.execution_rate IS '실행률 (%, 0 이상)';
