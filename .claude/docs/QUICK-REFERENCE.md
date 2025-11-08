# 빠른 참조 가이드

## 자주 수정하는 파일

### 프론트엔드 페이지
```
src/frontend/pages/
├── performance/          실적 관리
│   ├── WeeklyPlan.tsx   주간 계획
│   ├── DailyPlan.tsx    일일 계획
│   ├── SalesActivity.tsx 영업 활동
│   ├── Invoice.tsx      계산서 발행
│   └── Collection.tsx   수금 관리
└── analytics/           통계 분석
    ├── ActivityStatus.tsx    영업 활동 현황
    ├── MonthlySales.tsx      월별 매출
    ├── OrderAchievement.tsx  수주 실적
    ├── CostEfficiency.tsx    원가 투입 효율
    └── CollectionStatus.tsx  수금 현황
```

### 프론트엔드 컴포넌트
```
src/frontend/components/
├── WeeklyPlanForm.tsx       주간 계획 입력 폼
├── WeeklyPlanTable.tsx      주간 계획 테이블
├── DailyPlanForm.tsx        일일 계획 입력 폼
├── DailyPlanTable.tsx       일일 계획 테이블
├── SalesActivityForm.tsx    영업 활동 입력 폼
├── SalesActivityTable.tsx   영업 활동 테이블
├── InvoiceForm.tsx          계산서 발행 입력 폼
└── InvoiceTable.tsx         계산서 발행 테이블
```

### 백엔드 API
```
src/server/
├── index.ts                 메인 서버 (라우팅)
├── auth.ts                  인증
├── weekly-plans.ts          주간 계획 API
├── daily-plans.ts           일일 계획 API
├── sales-activities.ts      영업 활동 API
├── invoice-records.ts       계산서 발행 API
├── activity-stats.ts        영업 활동 통계
├── sales-stats.ts           월별 매출 통계
├── order-stats.ts           수주 실적 통계
└── cost-efficiency-stats.ts 원가 투입 효율
```

### 타입 정의
```
src/frontend/types/index.ts  모든 TypeScript 타입 정의
```

---

## 일반적인 작업 패턴

### 1. 새로운 필드 추가하기

#### Step 1: 데이터베이스 마이그레이션
```sql
ALTER TABLE table_name ADD COLUMN new_field type;
```

#### Step 2: 타입 정의 업데이트
```typescript
// src/frontend/types/index.ts
export interface TableName {
  ...
  new_field: type;
}
```

#### Step 3: 폼 컴포넌트 업데이트
```typescript
// src/frontend/components/TableNameForm.tsx
const [formData, setFormData] = useState({
  ...
  new_field: defaultValue,
});
```

#### Step 4: 테이블 컴포넌트 업데이트
```typescript
// src/frontend/components/TableNameTable.tsx
<TableCell>{record.new_field}</TableCell>
```

#### Step 5: API 업데이트
```typescript
// src/server/table-name.ts
.insert({ ..., new_field: data.new_field })
```

---

### 2. 새로운 통계 페이지 추가하기

#### Step 1: 백엔드 API 생성
```typescript
// src/server/new-stats.ts
export async function getNewStats(year: number, userName: string) {
  // 데이터 조회
  // 월별 집계
  // 연도 합계
  return { success: true, data: { monthly, summary } };
}
```

#### Step 2: 라우팅 추가
```typescript
// src/server/index.ts
"/api/new-stats": {
  GET: async (req) => {
    const stats = await getNewStats(year, userName);
    return Response.json(stats);
  },
}
```

#### Step 3: 프론트엔드 페이지 생성
```typescript
// src/frontend/pages/analytics/NewStats.tsx
const fetchStats = async () => {
  const response = await fetch(`/api/new-stats?year=${year}&user_name=${user}`);
  const result = await response.json();
  setData(result.data);
};
```

#### Step 4: 메뉴 추가
```typescript
// src/frontend/App.tsx
{
  id: 'new-stats',
  label: '새 통계',
  icon: BarChart,
  path: '/analytics/new-stats',
}
```

---

### 3. 필터 조건 수정하기

#### 사용자별 필터링
```typescript
// sales_manager로 검색 (현장 기반)
.ilike('sales_manager', `${userName}%`)

// created_by로 검색 (작성자 기반)
.eq('created_by', userName)

// user_id로 검색 (UUID)
.eq('user_id', userId)
```

#### 날짜 범위 필터링
```typescript
// 특정 월
.gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
.lt('created_at', nextMonthDate)

// 특정 연도
.gte('created_at', `${year}-01-01`)
.lt('created_at', `${year + 1}-01-01`)
```

#### plan_type 필터링
```typescript
// 활동 계획만
.in('plan_type', ['activity', 'both'])

// 목표 금액만
.in('plan_type', ['target', 'both'])

// 모두
.in('plan_type', ['activity', 'target', 'both'])
```

---

## 디버깅 팁

### 백엔드 로깅
```typescript
console.log('🔍 [function-name] Description:', variable);
console.log('✅ [function-name] Success:', result);
console.error('❌ [function-name] Error:', error);
console.log('⚠️ [function-name] Warning:', message);
console.log('📊 [function-name] Data:', JSON.stringify(data, null, 2));
```

### 서버 재시작
```bash
# 개발 서버
pkill -9 -f "bun.*src/server/index.ts"
PORT=3017 bun run dev

# 또는
bun run dev  # package.json에 정의된 스크립트
```

### 데이터베이스 확인
```typescript
// Supabase SQL Editor에서
SELECT * FROM table_name WHERE condition LIMIT 10;
```

---

## 환경 변수

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
PORT=3017
```

---

## Git 워크플로우

```bash
# 상태 확인
git status

# 변경사항 확인
git diff

# 커밋
git add -A
git commit -m "메시지"

# 푸시
git push
```

---

## 주의사항

### 1. weekly_plans 쿼리 시
- **활동 계획**: plan_type 필터 필요
- **목표 금액**: created_by 사용 (sales_manager 아님!)

### 2. site_summary 쿼리 시
- **매출/매입**: 문자열 (쉼표 포함) → 숫자 변환 필요
- **실행률**: expected_execution_rate로 매출/이익 기여 구분

### 3. 권한 체크
- 일반 사용자: 본인 데이터만
- 관리자: 모든 데이터 + 사용자 선택 가능

### 4. 날짜 형식
- DB: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- 입력: YYYY-MM-DD
- 표시: YYYY.MM.DD

---

## 성능 최적화

### 1. 인덱스 활용
```sql
CREATE INDEX idx_table_column ON table_name(column);
```

### 2. 필요한 컬럼만 조회
```typescript
.select('id, name, created_at')  // 필요한 것만
```

### 3. 페이지네이션
```typescript
.range(offset, offset + limit - 1)
```

### 4. 집계는 서버에서
```typescript
// ❌ 나쁨: 모든 데이터 가져와서 프론트에서 집계
// ✅ 좋음: 서버에서 집계해서 결과만 전달
```

---

## 배포

### Railway 배포
```bash
# 자동 배포 (main 브랜치 푸시 시)
git push origin main

# 환경변수 설정 (Railway 대시보드)
SUPABASE_URL
SUPABASE_ANON_KEY
PORT
```

### 빌드 설정
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["bun"]

[phases.build]
cmds = ["bun install --frozen-lockfile"]

[start]
cmd = "bun run src/server/index.ts"
```
