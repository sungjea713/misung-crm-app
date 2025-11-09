# 미성이앤씨 CRM - 데이터베이스 스키마

## 주요 테이블

### 1. users (사용자)
**용도**: 시스템 사용자 정보
```typescript
{
  id: string (UUID)
  email: string
  name: string
  department: string (부서)
  site: string (소속 현장)
  position: string (직급)
  phone: string
  role: 'admin' | 'user'
  is_initial_password: boolean
  auto_login: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

### 2. construction_management (현장 관리)
**용도**: 건설 현장 정보
```typescript
{
  id: number
  cms: string (현장 코드, 고유값)
  site_name: string
  site_address: string
  client: string (고객사)
  department: string
  sales_manager: string (영업 담당자)
  construction_manager: string (시공 담당자)
  order_month: string (수주월)
  order_amount: number (수주금액)
  status: string
}
```

### 3. site_summary (현장 요약)
**용도**: 현장별 매출/매입 집계 및 실행률
```typescript
{
  cms: string (현장 코드)
  sales_manager: string (영업 담당자)
  construction_manager: string (시공 담당자)
  sales_amount: string (매출금액, 쉼표 포함)
  purchase_amount: string (매입금액, 쉼표 포함)
  expected_execution_rate: number (예상 실행률)

  // 계산 로직:
  // - 매출 기여: 실행률 >= 90 OR 실행률 = 0
  // - 이익 기여: 실행률 < 90 AND 실행률 != 0
  // - 과투입: 매출금액 - 매입금액 < 0
}
```

### 4. weekly_plans (주간 계획)
**용도**: 주간 활동 계획 및 목표 금액
**최근 변경**: plan_type 컬럼 추가로 활동/목표 분리

```typescript
{
  id: number
  user_id: string
  plan_type: 'activity' | 'target' | 'both'  // 신규

  // 현장 정보 (활동 계획에만 필수)
  cms_id: number
  cms_code: string
  site_name: string
  site_address: string
  sales_manager: string
  construction_manager: string

  // 활동 계획 (plan_type = 'activity' or 'both')
  activity_construction_sales: boolean (시공 현장 매출 활동)
  activity_site_additional_sales: boolean (현장 추가 매출 활동)
  activity_site_support: boolean (현장 지원 활동)

  // 목표 금액 (plan_type = 'target' or 'both')
  target_sales: number (목표 매출)
  target_order_sales_contribution: number (목표 수주 매출 기여)
  target_order_profit_contribution: number (목표 수주 이익 기여)
  target_order_total: number (계산: 매출+이익)
  target_collection: number (목표 수금)

  created_at: timestamp
  updated_at: timestamp
  created_by: string (사용자명)
  updated_by: string
}
```

**인덱스**: idx_weekly_plans_plan_type

### 5. daily_plans (일간 계획)
**용도**: 일일 활동 계획
```typescript
{
  id: number
  user_id: string
  cms_id: number
  cms_code: string
  site_name: string
  site_address: string
  sales_manager: string
  construction_manager: string
  activity_construction_sales: boolean
  activity_site_additional_sales: boolean
  activity_site_support: boolean
  created_at: timestamp (활동일)
  created_by: string
  updated_by: string
}
```

### 6. sales_activities (영업 활동)
**용도**: 견적/수주 활동 기록
**최근 변경**: created_by 지점 구분 지원
```typescript
{
  id: number
  user_id: string
  activity_date: date
  activity_type: 'estimate' | 'contract' (견적/수주)
  site_type: 'existing' | 'new' (기존/신규 현장)

  // 기존 현장
  cms_id: number
  cms_code: string
  site_name: string
  site_address: string
  client: string

  // 신규 현장
  new_client: string
  new_site_name: string

  amount: number (금액)
  execution_rate: number (실행률)
  attachments: string[] (첨부파일)
  created_at: timestamp
  created_by: string (사용자명, 지점 구분: "이름" 또는 "이름(In)")
  updated_by: string
}
```

### 7. invoice_records (계산서 발행)
**용도**: 계산서 발행 기록
**최근 변경**: created_by 지점 구분 지원
```typescript
{
  id: number
  user_id: string
  cms_id: number
  cms_code: string
  site_name: string
  site_address: string
  sales_manager: string
  construction_manager: string

  // site_summary에서 자동 조회
  sales_amount: string (매출금액)
  purchase_amount: string (매입금액)
  profit_difference: number (차액)
  is_over_invested: boolean (과투입 여부)

  // 사용자 입력
  invoice_date: date (발행일)
  invoice_amount: number (발행금액)

  created_at: timestamp
  created_by: string (사용자명, 지점 구분: "이름" 또는 "이름(In)")
  updated_by: string
}
```

### 8. collections (수금 현황) ⭐ 신규
**용도**: 수금 내역 관리
**파일**: supabase-collections.sql
```typescript
{
  id: number
  user_id: string (UUID)
  cms_id: number (현장 ID, nullable)
  cms_code: string (CMS 코드)
  site_name: string (현장명)
  site_address: string (현장 주소)
  sales_manager: string (영업 담당자)
  construction_manager: string (시공 담당자)
  collection_date: date (수금일)
  collection_amount: number (수금 금액)
  outstanding_balance: number (미수금 잔액, 자동 계산)
  created_at: timestamp
  updated_at: timestamp
  created_by: string (사용자명, 지점 구분: "이름" 또는 "이름(In)")
  updated_by: string
}
```

**계산 로직**:
```typescript
// 미수금 잔액 = monthly_collection의 미수금 - 수금 금액
outstanding_balance = monthlyOutstanding - collection_amount
```

**인덱스**:
- idx_collections_user_id
- idx_collections_cms_id
- idx_collections_collection_date
- idx_collections_created_by

### 9. monthly_collection (월별 수금/미수금 현황) ⭐ 신규
**용도**: 관리자 업로드 월별 수금/미수금 데이터
**파일**: supabase-monthly-collection.sql
```typescript
{
  id: UUID (Primary Key)
  year: number (연도)
  month: number (월, 1-12)
  manager_name: string (담당자명, 지점 구분: "이름" 또는 "이름(In)")
  collection_amount: number (확정 수금 금액)
  outstanding_amount: number (미수금 현황)
  created_at: timestamp
  updated_at: timestamp
  created_by: string (관리자명)

  // 유니크 제약: (year, month, manager_name)
}
```

**인덱스**:
- idx_monthly_collection_year_month
- idx_monthly_collection_manager

### 10. monthly_over_investment (월별 과투입 현황)
**용도**: 관리자 업로드 월별 과투입 데이터
```typescript
{
  id: UUID
  year: number
  month: number
  manager_name: string
  amount: number (과투입 금액)
  created_at: timestamp
  updated_at: timestamp
  created_by: string

  // 유니크 제약: (year, month, manager_name)
}
```

## 다중 지점 사용자 패턴 ⭐

### created_by 필드의 지점 구분
특정 사용자(송기정, 김태현)는 본점과 인천 지점을 구분하여 관리:
- **본점**: "송기정", "김태현"
- **인천**: "송기정(In)", "김태현(In)"

### 적용 테이블
- sales_activities
- invoice_records
- collections
- weekly_plans
- daily_plans
- monthly_collection (manager_name 필드)
- monthly_over_investment (manager_name 필드)

### 쿼리 패턴
```typescript
// 단일 지점 조회
.eq('created_by', '송기정')        // 본점만
.eq('created_by', '송기정(In)')    // 인천만

// 전체 지점 조회
.or('created_by.eq."송기정",created_by.eq."송기정(In)"')
```

## 데이터 관계

### 현장 조회 흐름
1. **construction_management** (cms 코드로 현장 검색)
2. **site_summary** (매출/매입/실행률 확인)

### 통계 계산 흐름

#### 영업 활동 현황 (activity-stats.ts)
- **계획**: weekly_plans (plan_type = 'activity' or 'both')
- **실적**: sales_activities
- **그룹**: created_by (사용자명)

#### 월별 매출 (sales-stats.ts)
- **실적**: site_summary (sales_manager 기준)
- **목표**: weekly_plans (plan_type = 'target' or 'both')
- **그룹**: 월별

#### 수주 실적 및 목표 (order-stats.ts)
- **실적**:
  - site_summary → construction_management
  - 실행률 >= 90 or = 0 → 매출 기여
  - 실행률 < 90 and != 0 → 이익 기여
- **목표**: weekly_plans (plan_type = 'target' or 'both', created_by 기준)
- **그룹**: 월별

#### 원가 투입 효율 (cost-efficiency-stats.ts)
- **과투입**: monthly_over_investment
- **확정 매출**: inpays (sales_date 기준)
- **그룹**: 월별

#### 수금 실적 및 미수금 관리 (collection-stats.ts) ⭐ 신규
- **목표 수금**: weekly_plans.target_collection (created_at 기준)
- **사용자 수금**: collections.collection_amount
- **관리자 확정 수금**: monthly_collection.collection_amount
- **현재 미수금 누계**: monthly_collection.outstanding_amount
- **그룹**: 월별

## 중요 쿼리 패턴

### 사용자별 현장 조회
```typescript
// sales_manager로 현장 찾기
.from('site_summary')
.ilike('sales_manager', `${userName}%`)
```

### 목표 금액 조회
```typescript
// created_by로 목표 찾기 (plan_type 필터)
.from('weekly_plans')
.eq('created_by', userName)
.in('plan_type', ['target', 'both'])
```

### 월별 필터링
```typescript
.gte('created_at', `${year}-${month}-01`)
.lt('created_at', nextMonthDate)
```

### 다중 지점 조회
```typescript
// showAllBranches = true
const isMultiBranch = userName === '송기정' || userName === '김태현';
if (isMultiBranch && showAllBranches) {
  const orCondition = `created_by.eq."${userName}",created_by.eq."${userName}(In)"`;
  query = query.or(orCondition);
} else {
  query = query.eq('created_by', userName);
}
```

## 마이그레이션 파일

### supabase-weekly-plans-add-plan-type.sql
- weekly_plan_type ENUM 생성
- plan_type 컬럼 추가 (기본값: 'both')
- 인덱스 생성
- 기존 레코드 자동 분류

### supabase-weekly-plans-add-targets.sql
- target_sales
- target_order_sales_contribution
- target_order_profit_contribution
- target_order_total
- target_collection
- 컬럼 추가 및 자동 계산 트리거

### supabase-collections.sql ⭐ 신규
- collections 테이블 생성
- 수금 기록 관리
- created_by 인덱스 (지점 구분 지원)

### supabase-monthly-collection.sql ⭐ 신규
- monthly_collection 테이블 생성
- 관리자 업로드 수금/미수금 데이터
- (year, month, manager_name) 유니크 제약
