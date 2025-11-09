# 미성이앤씨 CRM - 기능별 가이드

## 페이지 구조

### 📊 실적 관리 (Performance)

#### 1. 주간 계획 (/performance/weekly-plan)
**파일**: [WeeklyPlan.tsx](src/frontend/pages/performance/WeeklyPlan.tsx)
**API**: /api/weekly-plans
**서버**: [weekly-plans.ts](src/server/weekly-plans.ts)

**기능**:
- **목표 활동 계획**: 현장별 활동 계획 (현장 선택 필수)
  - 시공 현장 매출 활동
  - 현장 추가 매출 활동
  - 현장 지원 활동

- **목표 금액 계획**: 전체 목표 설정 (현장 선택 없음)
  - 목표 매출
  - 목표 수주 (매출 기여)
  - 목표 수주 (이익 기여)
  - 목표 회수

**컴포넌트**:
- [WeeklyPlanForm.tsx](src/frontend/components/WeeklyPlanForm.tsx)
- [WeeklyPlanTable.tsx](src/frontend/components/WeeklyPlanTable.tsx)

**필터**: 연도, 월, 사용자(관리자만)

#### 2. 일일 계획 (/performance/daily-plan)
**파일**: [DailyPlan.tsx](src/frontend/pages/performance/DailyPlan.tsx)
**API**: /api/daily-plans
**서버**: [daily-plans.ts](src/server/daily-plans.ts)

**기능**: 일일 현장 활동 계획
- 현장 선택 (construction_management 검색)
- 활동 유형 체크박스

#### 3. 영업 활동 (/performance/sales-activity)
**파일**: [SalesActivity.tsx](src/frontend/pages/performance/SalesActivity.tsx)
**API**: /api/sales-activities
**서버**: [sales-activities.ts](src/server/sales-activities.ts)

**기능**: 견적/수주 활동 기록
- **활동 유형**: 견적, 수주
- **현장 유형**: 기존 현장, 신규 현장
- **기존 현장**: construction_management에서 검색
- **신규 현장**: 고객사, 현장명 직접 입력
- 금액, 실행률, 첨부파일

**컴포넌트**:
- [SalesActivityForm.tsx](src/frontend/components/SalesActivityForm.tsx)
- [SalesActivityTable.tsx](src/frontend/components/SalesActivityTable.tsx)

#### 4. 계산서 발행 (/performance/invoice)
**파일**: [Invoice.tsx](src/frontend/pages/performance/Invoice.tsx)
**API**: /api/invoice-records
**서버**: [invoice-records.ts](src/server/invoice-records.ts)

**기능**: 계산서 발행 기록
- 현장 선택 시 site_summary에서 매출/매입 자동 조회
- 과투입 여부 자동 표시
- 계산서 발행일, 금액 입력

**로직**:
```typescript
profit_difference = 매출금액 - 매입금액
is_over_invested = profit_difference < 0
```

#### 5. 수금 관리 (/performance/collection)
**파일**: [Collection.tsx](src/frontend/pages/performance/Collection.tsx)
**API**: /api/collections
**서버**: [collections.ts](src/server/collections.ts)

**기능**: 수금 내역 기록
- 현장 선택 (construction_management 검색)
- 수금일, 수금 금액 입력
- 미수금 잔액 자동 계산 (monthly_collection 기준)
- 지점 구분 지원 (본점/인천)

**계산 로직**:
```typescript
outstanding_balance = monthlyOutstanding - collection_amount
```

**컴포넌트**:
- [CollectionForm.tsx](src/frontend/components/CollectionForm.tsx)
- [CollectionTable.tsx](src/frontend/components/CollectionTable.tsx)

**필터**: 연도, 월, 사용자(관리자만), 지점(다중 지점 사용자)

---

### 📈 통계 및 분석 (Analytics)

#### 1. 영업 활동 현황 (/analytics/activity-status)
**파일**: [ActivityStatus.tsx](src/frontend/pages/analytics/ActivityStatus.tsx)
**API**: /api/activity-stats
**서버**: [activity-stats.ts](src/server/activity-stats.ts)

**데이터 소스**:
- **계획**: weekly_plans (plan_type = 'activity' or 'both')
- **실적**: sales_activities

**통계**:
- 시공 현장 매출 활동
- 현장 추가 매출 활동
- 현장 지원 활동
- 합계 및 달성률

**표시**: 월별 테이블, 연도 합계

#### 2. 월별 매출 (/analytics/monthly-sales)
**파일**: [MonthlySales.tsx](src/frontend/pages/analytics/MonthlySales.tsx)
**API**: /api/sales-stats
**서버**: [sales-stats.ts](src/server/sales-stats.ts)

**데이터 소스**:
- **실적**: site_summary (sales_manager 기준)
- **목표**: weekly_plans (plan_type = 'target' or 'both')

**통계**:
- 확정 매출 (sales_amount)
- 확정 매입 (purchase_amount)
- 매출 이익 (매출 - 매입)
- 목표 매출
- 달성률

**표시**: 월별 테이블, 연도 합계

#### 3. 수주 실적 및 목표 달성률 (/analytics/order-achievement)
**파일**: [OrderAchievement.tsx](src/frontend/pages/analytics/OrderAchievement.tsx)
**API**: /api/order-stats
**서버**: [order-stats.ts](src/server/order-stats.ts)

**데이터 소스**:
- **실적**: site_summary → construction_management
  - 매출 기여: expected_execution_rate >= 90 or = 0
  - 이익 기여: expected_execution_rate < 90 and != 0
- **목표**: weekly_plans (plan_type = 'target' or 'both', created_by 기준)

**통계**:
- 매출 기여 (수주, 실행, 이익)
- 이익 기여 (수주, 실행, 이익)
- 합계
- 목표 대비 달성률

**중요**:
- site_summary가 없는 사용자(admin)도 목표 조회 가능
- created_by로 목표 필터링 (sales_manager 아님)

#### 4. 원가 투입 효율 (/analytics/cost-efficiency)
**파일**: [CostEfficiency.tsx](src/frontend/pages/analytics/CostEfficiency.tsx)
**API**: /api/cost-efficiency-stats
**서버**: [cost-efficiency-stats.ts](src/server/cost-efficiency-stats.ts)

**데이터 소스**:
- site_summary (sales_manager 기준)

**통계**:
- 과투입 금액 (매출 - 매입 < 0인 현장들의 절대값 합계)
- 확정 매출
- 편차 (확정 매출 - 과투입)

**표시**: 월별 테이블, 연도 합계

#### 5. 수금 실적 및 미수금 관리 현황 (/analytics/collection-status)
**파일**: [CollectionStatus.tsx](src/frontend/pages/analytics/CollectionStatus.tsx)
**API**: /api/collection-stats
**서버**: [collection-stats.ts](src/server/collection-stats.ts)

**데이터 소스**:
- **목표 수금**: weekly_plans.target_collection (plan_type = 'target' or 'both')
- **사용자 수금**: collections.collection_amount (사용자 입력)
- **관리자 확정 수금**: monthly_collection.collection_amount (관리자 업로드)
- **현재 미수금 누계**: monthly_collection.outstanding_amount (관리자 업로드)

**통계**:
- 월별 목표 수금 집계
- 월별 사용자 수금 집계
- 월별 관리자 확정 수금
- 월별 미수금 잔액
- 연도 합계

**표시**: 월별 테이블, 연도 합계

**필터**: 연도, 사용자(관리자만), 지점(다중 지점 사용자)

**색상 코드**:
- 목표 수금: 파란색
- 사용자 수금: 녹색
- 관리자 확정 수금: 주황색
- 미수금 누계: 황색

---

## API 엔드포인트

### GET 엔드포인트
```typescript
GET /api/users/me - 현재 사용자 정보
GET /api/weekly-plans - 주간 계획 목록
GET /api/daily-plans - 일일 계획 목록
GET /api/sales-activities - 영업 활동 목록
GET /api/invoice-records - 계산서 발행 목록
GET /api/collections - 수금 내역 목록
GET /api/activity-stats - 영업 활동 통계
GET /api/sales-stats - 월별 매출 통계
GET /api/order-stats - 수주 실적 통계
GET /api/cost-efficiency-stats - 원가 투입 효율
GET /api/collection-stats - 수금 실적 및 미수금 관리
GET /api/construction-sites/search - 현장 검색
GET /api/site-summary/:cms - 현장 요약 정보
GET /api/monthly-collection/:year/:month/:managerName - 월별 수금/미수금 현황
```

### POST 엔드포인트
```typescript
POST /api/login - 로그인
POST /api/logout - 로그아웃
POST /api/change-password - 비밀번호 변경
POST /api/weekly-plans - 주간 계획 생성
POST /api/daily-plans - 일일 계획 생성
POST /api/sales-activities - 영업 활동 생성
POST /api/invoice-records - 계산서 발행 생성
POST /api/collections - 수금 내역 생성
POST /api/monthly-collection/upload - 월별 수금/미수금 현황 업로드 (관리자만)
```

### PUT 엔드포인트
```typescript
PUT /api/weekly-plans/:id - 주간 계획 수정
PUT /api/daily-plans/:id - 일일 계획 수정
PUT /api/sales-activities/:id - 영업 활동 수정
PUT /api/invoice-records/:id - 계산서 발행 수정
PUT /api/collections/:id - 수금 내역 수정
```

### DELETE 엔드포인트
```typescript
DELETE /api/weekly-plans/:id - 주간 계획 삭제
DELETE /api/daily-plans/:id - 일일 계획 삭제
DELETE /api/sales-activities/:id - 영업 활동 삭제
DELETE /api/invoice-records/:id - 계산서 발행 삭제
DELETE /api/collections/:id - 수금 내역 삭제
```

---

## 공통 패턴

### 권한 체크
```typescript
// 관리자만
if (user.role !== 'admin') {
  return { success: false, message: '권한이 없습니다.' };
}

// 본인 또는 관리자
if (user.role !== 'admin' && record.created_by !== user.name) {
  return { success: false, message: '권한이 없습니다.' };
}
```

### 페이지네이션
```typescript
const page = parseInt(url.searchParams.get('page') || '1');
const limit = parseInt(url.searchParams.get('limit') || '20');
const offset = (page - 1) * limit;
```

### 현장 검색
```typescript
// CMS 코드 또는 현장명으로 검색
.or(`cms.ilike.%${searchTerm}%,site_name.ilike.%${searchTerm}%`)
.order('cms')
.limit(20)
```

### 월별 필터링
```typescript
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 1);

.gte('created_at', startDate.toISOString())
.lt('created_at', endDate.toISOString())
```

### 다중 지점 필터링
```typescript
// 다중 지점 사용자 확인
const isMultiBranch = userName === '송기정' || userName === '김태현';

// 전체 지점 조회
if (isMultiBranch && showAllBranches) {
  const orCondition = `created_by.eq."${userName}",created_by.eq."${userName}(In)"`;
  query = query.or(orCondition);
} else {
  query = query.eq('created_by', userName);
}
```

---

## 최근 주요 변경사항

### 2025-11-09: 수금 관리 기능 추가
- collections 테이블 추가 (수금 내역 기록)
- monthly_collection 테이블 추가 (관리자 월별 수금/미수금 업로드)
- 수금 실적 및 미수금 관리 현황 페이지 추가
- 다중 지점 데이터 관리 개선
- 관리자 월별 수금/미수금 엑셀 업로드 기능
- 주간 계획에 target_collection (목표 수금) 컬럼 추가

### 2025-01-08: 주간 계획 분리
- weekly_plans에 plan_type 컬럼 추가
- 목표 활동 계획과 목표 금액 계획 UI 분리
- 목표 금액 계획에서 현장 선택 제거
- 수주 실적 API에서 created_by로 목표 조회
- site_summary 없어도 목표 조회 가능하도록 수정
