-- ===============================================
-- 건설사 영업 기능을 위한 데이터베이스 스키마
-- ===============================================

-- 1. constructions 테이블 (건설사 마스터)
CREATE TABLE IF NOT EXISTS constructions (
  id BIGSERIAL PRIMARY KEY,
  company_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_constructions_company_name ON constructions(company_name);
COMMENT ON TABLE constructions IS '건설사 마스터 테이블';
COMMENT ON COLUMN constructions.company_name IS '건설사명';

-- 2. items 테이블 (품목 마스터)
CREATE TABLE IF NOT EXISTS items (
  id BIGSERIAL PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_item_id ON items(item_id);
COMMENT ON TABLE items IS '품목 마스터 테이블';
COMMENT ON COLUMN items.item_id IS '품목 코드 (H, B, AD, ID, M, ST, SR, F)';
COMMENT ON COLUMN items.item_name IS '품목명 (계단, 발코니 등)';

-- 3. daily_plan_construction_sales 테이블 (건설사 영업 상세)
CREATE TABLE IF NOT EXISTS daily_plan_construction_sales (
  id BIGSERIAL PRIMARY KEY,
  daily_plan_id BIGINT NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  construction_id BIGINT NOT NULL REFERENCES constructions(id),
  item_id BIGINT NOT NULL REFERENCES items(id),
  has_quote_submitted BOOLEAN DEFAULT false,
  has_meeting_conducted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_plan_id, construction_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_plan_construction_sales_daily_plan_id
  ON daily_plan_construction_sales(daily_plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_construction_sales_construction_id
  ON daily_plan_construction_sales(construction_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_construction_sales_item_id
  ON daily_plan_construction_sales(item_id);

COMMENT ON TABLE daily_plan_construction_sales IS '일일 업무 일지 - 건설사 영업 상세 정보';
COMMENT ON COLUMN daily_plan_construction_sales.daily_plan_id IS '일일 업무 일지 ID';
COMMENT ON COLUMN daily_plan_construction_sales.construction_id IS '건설사 ID';
COMMENT ON COLUMN daily_plan_construction_sales.item_id IS '품목 ID';
COMMENT ON COLUMN daily_plan_construction_sales.has_quote_submitted IS '견적 제출 여부';
COMMENT ON COLUMN daily_plan_construction_sales.has_meeting_conducted IS '미팅 진행 여부';

-- 4. 트리거: constructions 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_constructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_constructions_updated_at
  BEFORE UPDATE ON constructions
  FOR EACH ROW
  EXECUTE FUNCTION update_constructions_updated_at();

-- 5. 트리거: items 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_updated_at();

-- 6. 트리거: daily_plan_construction_sales 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_daily_plan_construction_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_plan_construction_sales_updated_at
  BEFORE UPDATE ON daily_plan_construction_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_plan_construction_sales_updated_at();

-- ===============================================
-- 초기 데이터 삽입
-- ===============================================

-- constructions 테이블 데이터 삽입 (102개 건설사)
INSERT INTO constructions (company_name) VALUES
('삼성물산'),
('현대건설㈜'),
('㈜대우건설'),
('현대엔지니어링㈜'),
('디엘이앤씨㈜'),
('지에스건설㈜'),
('㈜포스코이앤씨'),
('롯데건설㈜'),
('에스케이에코플랜트㈜'),
('현대산업개발㈜'),
('㈜한화'),
('㈜호반건설'),
('디엘건설㈜'),
('두산에너빌리티㈜'),
('제일건설㈜'),
('중흥토건㈜'),
('계룡건설산업㈜'),
('㈜서희건설'),
('코오롱글로벌㈜'),
('금호건설㈜'),
('아이에스동서㈜'),
('동부건설㈜'),
('대방건설㈜'),
('㈜태영건설'),
('㈜케이씨씨건설'),
('쌍용건설㈜'),
('우미건설㈜'),
('한신공영㈜'),
('㈜반도건설'),
('에이치엘디앤아이한라㈜'),
('㈜동원개발'),
('두산건설㈜'),
('신세계건설㈜'),
('자이씨앤에이㈜'),
('㈜호반산업'),
('㈜에이치제이중공업'),
('㈜한양'),
('SK에코엔지니어링㈜ '),
('㈜효성중공업'),
('에스지씨이앤씨㈜'),
('진흥기업㈜'),
('㈜동양건설산업'),
('㈜라인산업'),
('씨제이대한통운㈜'),
('㈜금강주택'),
('삼성이엔에이㈜'),
('에이치에스화성㈜'),
('㈜라인건설'),
('㈜대광건영'),
('양우건설㈜'),
('㈜서한'),
('중흥건설㈜'),
('대보건설㈜'),
('자이에스앤디㈜'),
('㈜케이알산업'),
('일성건설㈜'),
('㈜시티건설'),
('남광토건㈜'),
('㈜태왕이앤씨'),
('동문건설㈜'),
('극동건설㈜'),
('㈜금성백조건설'),
('동원건설산업㈜'),
('에이스건설㈜'),
('디에스종합건설㈜'),
('일신건영㈜'),
('㈜성도이엔지'),
('㈜동양'),
('㈜서해종합건설'),
('㈜대명건설'),
('보광종합건설㈜'),
('풍림산업㈜'),
('경남기업㈜'),
('대방산업개발㈜'),
('㈜우미개발'),
('경동건설㈜'),
('요진건설산업㈜'),
('㈜금성백조주택'),
('㈜원건설'),
('강산건설㈜'),
('이수건설㈜'),
('파인건설㈜'),
('금광기업㈜'),
('㈜대림 (DL건설)'),
('㈜흥화'),
('혜림건설㈜'),
('한양산업개발㈜'),
('㈜신성건설'),
('㈜화성개발'),
('㈜광신종합건설'),
('㈜한양건설'),
('대흥건설㈜'),
('㈜유탑건설'),
('㈜대원'),
('㈜보미건설'),
('㈜중앙건설'),
('한성건설㈜'),
('모아건설'),
('유승종합건설'),
('대라수 건설'),
('이랜드건설'),
('세경건설')
ON CONFLICT (company_name) DO NOTHING;

-- items 테이블 데이터 삽입 (8개 품목)
INSERT INTO items (item_id, item_name) VALUES
('H', '계단'),
('B', '발코니'),
('AD', '자폐기 및 도어 클로저'),
('ID', '중문'),
('M', '금속'),
('ST', '석재'),
('SR', '특화난간'),
('F', '울타리')
ON CONFLICT (item_id) DO NOTHING;

-- ===============================================
-- 뷰 생성: 건설사 영업 상세 정보 조회용
-- ===============================================

CREATE OR REPLACE VIEW v_daily_plan_construction_sales AS
SELECT
  dpcs.id,
  dpcs.daily_plan_id,
  dpcs.construction_id,
  c.company_name AS construction_name,
  dpcs.item_id,
  i.item_id AS item_code,
  i.item_name,
  dpcs.has_quote_submitted,
  dpcs.has_meeting_conducted,
  dpcs.created_at,
  dpcs.updated_at
FROM daily_plan_construction_sales dpcs
JOIN constructions c ON dpcs.construction_id = c.id
JOIN items i ON dpcs.item_id = i.id;

COMMENT ON VIEW v_daily_plan_construction_sales IS '일일 업무 일지 건설사 영업 상세 정보 뷰';

-- ===============================================
-- 권한 설정 (Supabase RLS)
-- ===============================================

-- RLS 활성화
ALTER TABLE constructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plan_construction_sales ENABLE ROW LEVEL SECURITY;

-- constructions 테이블 정책 (모든 사용자 조회 가능)
CREATE POLICY "Anyone can view constructions"
  ON constructions FOR SELECT
  USING (true);

-- items 테이블 정책 (모든 사용자 조회 가능)
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  USING (true);

-- daily_plan_construction_sales 테이블 정책
-- 조회: 본인 데이터 또는 admin
CREATE POLICY "View own construction sales or admin"
  ON daily_plan_construction_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = daily_plan_construction_sales.daily_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );

-- 생성: 본인 데이터만
CREATE POLICY "Insert own construction sales"
  ON daily_plan_construction_sales FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_plans dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = daily_plan_construction_sales.daily_plan_id
        AND u.id = auth.uid()
    )
  );

-- 수정: 본인 데이터 또는 admin
CREATE POLICY "Update own construction sales or admin"
  ON daily_plan_construction_sales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = daily_plan_construction_sales.daily_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );

-- 삭제: 본인 데이터 또는 admin
CREATE POLICY "Delete own construction sales or admin"
  ON daily_plan_construction_sales FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.id = daily_plan_construction_sales.daily_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );

-- ===============================================
-- 통계 함수 (선택사항)
-- ===============================================

-- 특정 기간의 건설사별 영업 활동 통계
CREATE OR REPLACE FUNCTION get_construction_sales_stats(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  construction_id BIGINT,
  construction_name TEXT,
  total_activities INT,
  quote_submitted_count INT,
  meeting_conducted_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS construction_id,
    c.company_name AS construction_name,
    COUNT(dpcs.id)::INT AS total_activities,
    SUM(CASE WHEN dpcs.has_quote_submitted THEN 1 ELSE 0 END)::INT AS quote_submitted_count,
    SUM(CASE WHEN dpcs.has_meeting_conducted THEN 1 ELSE 0 END)::INT AS meeting_conducted_count
  FROM constructions c
  LEFT JOIN daily_plan_construction_sales dpcs ON c.id = dpcs.construction_id
  LEFT JOIN daily_plans dp ON dpcs.daily_plan_id = dp.id
  WHERE dp.created_at::DATE BETWEEN p_start_date AND p_end_date
  GROUP BY c.id, c.company_name
  HAVING COUNT(dpcs.id) > 0
  ORDER BY total_activities DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_construction_sales_stats IS '기간별 건설사 영업 활동 통계';