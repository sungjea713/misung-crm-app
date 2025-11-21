-- 주간 계획 건설사 영업 상세 정보 테이블 생성
CREATE TABLE IF NOT EXISTS weekly_plan_construction_sales (
  id SERIAL PRIMARY KEY,
  weekly_plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  construction_id INTEGER NOT NULL REFERENCES constructions(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  has_quote_submitted BOOLEAN DEFAULT FALSE,
  has_meeting_conducted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(weekly_plan_id, construction_id, item_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weekly_plan_construction_sales_weekly_plan_id
  ON weekly_plan_construction_sales(weekly_plan_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plan_construction_sales_construction_id
  ON weekly_plan_construction_sales(construction_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plan_construction_sales_item_id
  ON weekly_plan_construction_sales(item_id);

-- RLS 정책 활성화
ALTER TABLE weekly_plan_construction_sales ENABLE ROW LEVEL SECURITY;

-- 조회: 본인 데이터 또는 admin
CREATE POLICY "View own weekly plan construction sales or admin"
  ON weekly_plan_construction_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      JOIN users u ON wp.user_id = u.id
      WHERE wp.id = weekly_plan_construction_sales.weekly_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );

-- 생성: 본인 데이터만
CREATE POLICY "Insert own weekly plan construction sales"
  ON weekly_plan_construction_sales FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      JOIN users u ON wp.user_id = u.id
      WHERE wp.id = weekly_plan_construction_sales.weekly_plan_id
        AND u.id = auth.uid()
    )
  );

-- 수정: 본인 데이터 또는 admin
CREATE POLICY "Update own weekly plan construction sales or admin"
  ON weekly_plan_construction_sales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      JOIN users u ON wp.user_id = u.id
      WHERE wp.id = weekly_plan_construction_sales.weekly_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );

-- 삭제: 본인 데이터 또는 admin
CREATE POLICY "Delete own weekly plan construction sales or admin"
  ON weekly_plan_construction_sales FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans wp
      JOIN users u ON wp.user_id = u.id
      WHERE wp.id = weekly_plan_construction_sales.weekly_plan_id
        AND (u.id = auth.uid() OR u.role = 'admin')
    )
  );
