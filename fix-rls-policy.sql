-- ===============================================
-- RLS 정책 수정 - daily_plan_construction_sales 테이블
-- ===============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "View own construction sales or admin" ON daily_plan_construction_sales;
DROP POLICY IF EXISTS "Insert own construction sales" ON daily_plan_construction_sales;
DROP POLICY IF EXISTS "Update own construction sales or admin" ON daily_plan_construction_sales;
DROP POLICY IF EXISTS "Delete own construction sales or admin" ON daily_plan_construction_sales;

-- RLS 비활성화 (임시)
ALTER TABLE daily_plan_construction_sales DISABLE ROW LEVEL SECURITY;

-- 또는 더 간단한 정책으로 재설정
-- ALTER TABLE daily_plan_construction_sales ENABLE ROW LEVEL SECURITY;

-- -- 새로운 간단한 정책들
-- -- 조회: 모든 인증된 사용자
-- CREATE POLICY "Authenticated users can view construction sales"
--   ON daily_plan_construction_sales FOR SELECT
--   USING (auth.role() = 'authenticated');

-- -- 생성: 모든 인증된 사용자
-- CREATE POLICY "Authenticated users can insert construction sales"
--   ON daily_plan_construction_sales FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- -- 수정: 모든 인증된 사용자
-- CREATE POLICY "Authenticated users can update construction sales"
--   ON daily_plan_construction_sales FOR UPDATE
--   USING (auth.role() = 'authenticated');

-- -- 삭제: 모든 인증된 사용자
-- CREATE POLICY "Authenticated users can delete construction sales"
--   ON daily_plan_construction_sales FOR DELETE
--   USING (auth.role() = 'authenticated');