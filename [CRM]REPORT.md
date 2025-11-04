# 미성 E&C CRM 시스템 상세 명세서

## 문서 정보
- 작성일: 2025-10-30
- 프로젝트명: 미성 E&C CRM 시스템
- 버전: 1.0.0
- 작성자: Claude Code

---

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [백엔드 API 설계](#4-백엔드-api-설계)
5. [프론트엔드 설계](#5-프론트엔드-설계)
6. [기능별 상세 구현](#6-기능별-상세-구현)
7. [배포 및 운영](#7-배포-및-운영)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목적
미성 E&C의 영업 및 현장 관리 업무를 디지털화하고 효율화하기 위한 웹 기반 CRM 시스템 구축

### 1.2 주요 목표
- 영업 활동 및 현장 관리 데이터의 체계적 관리
- 실시간 매출/매입 데이터 분석 및 시각화
- 사용자별 권한 관리 및 데이터 접근 제어
- 모바일 및 데스크톱 환경 지원

### 1.3 시스템 특징
- Bun 런타임 기반의 고성능 서버
- Supabase PostgreSQL을 활용한 안정적인 데이터 관리
- React 기반의 반응형 사용자 인터페이스
- SmartWiz ERP 시스템과의 데이터 동기화

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택

#### 2.1.1 런타임 및 언어
- **Bun**: v1.0 이상
  - JavaScript/TypeScript 런타임
  - 빠른 패키지 설치 및 실행 속도
  - 내장 번들러 및 테스트 러너
- **TypeScript**: v5.3.3
  - 타입 안정성 보장
  - 개발 생산성 향상

#### 2.1.2 프론트엔드
- **React**: v18.2.0
  - 컴포넌트 기반 UI 개발
  - Virtual DOM을 통한 효율적인 렌더링
- **Tailwind CSS**: v3.4.0
  - 유틸리티 우선 CSS 프레임워크
  - 일관된 디자인 시스템
- **Recharts**: v3.3.0
  - React 기반 차트 라이브러리
  - 매출/매입 데이터 시각화
- **Lucide React**: v0.303.0
  - 현대적인 아이콘 세트
  - 가벼운 SVG 아이콘
- **Headless UI**: v2.2.9
  - 접근성 높은 UI 컴포넌트
  - 모달, 드롭다운 등

#### 2.1.3 백엔드
- **Bun.serve()**: 내장 HTTP 서버
  - WebSocket 지원
  - 라우팅 및 미들웨어
- **Supabase Client**: v2.39.0
  - PostgreSQL 데이터베이스 연동
  - Row Level Security (RLS)
  - Supabase Storage (이미지 업로드)

#### 2.1.4 개발 도구
- **Vite**: v7.1.12
  - 빠른 HMR (Hot Module Replacement)
  - 프로덕션 빌드 최적화
- **PostCSS & Autoprefixer**: v8.4.32, v10.4.16
  - CSS 후처리 및 브라우저 호환성

### 2.2 시스템 아키텍처

#### 2.2.1 전체 구조
```
┌─────────────────────────────────────────────────────────┐
│                      클라이언트                          │
│  (React + TypeScript + Tailwind CSS)                    │
│  - 컴포넌트 기반 UI                                      │
│  - 상태 관리 (useState, useEffect)                       │
│  - API 통신 (fetch)                                      │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP/HTTPS
                  │ (REST API)
┌─────────────────▼───────────────────────────────────────┐
│                   Bun 서버                               │
│  (src/server/index.ts)                                  │
│  - API 라우팅                                            │
│  - 인증/인가                                             │
│  - 비즈니스 로직                                          │
│  - 정적 파일 서빙                                         │
└─────────────────┬───────────────────────────────────────┘
                  │ Supabase Client
                  │ (PostgreSQL Protocol)
┌─────────────────▼───────────────────────────────────────┐
│              Supabase (PostgreSQL)                       │
│  - 사용자 데이터 (users)                                  │
│  - 업무 계획 (weekly_plans, daily_plans)                 │
│  - 영업 활동 (sales_activities)                          │
│  - 계산서 발행 (invoice_records)                         │
│  - ERP 동기화 데이터 (construction_management,           │
│    inpays, outpays, site_summary)                       │
└──────────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Supabase Storage                            │
│  - sales-activities 버킷 (영업 활동 이미지)              │
│  - 자동 파일 정리 (삭제/수정 시)                          │
└──────────────────────────────────────────────────────────┘
```

#### 2.2.2 데이터 흐름

##### 사용자 인증 흐름
```
1. 사용자 로그인 요청 (email, password)
   ↓
2. POST /api/auth/login
   ↓
3. Supabase에서 사용자 조회 및 비밀번호 검증
   ↓
4. JWT 토큰 생성 및 반환
   ↓
5. 클라이언트에서 localStorage에 토큰 저장
   ↓
6. 이후 모든 API 요청에 Authorization 헤더 포함
```

##### 데이터 조회/수정 흐름
```
1. 클라이언트에서 API 요청 (Authorization 헤더 포함)
   ↓
2. 서버에서 토큰 검증
   ↓
3. 사용자 권한 확인 (admin/user)
   ↓
4. Supabase 쿼리 실행 (RLS 적용)
   ↓
5. 데이터 반환
   ↓
6. 클라이언트에서 UI 업데이트
```

#### 2.2.3 폴더 구조
```
misung-crm-app/
├── src/
│   ├── frontend/                    # 프론트엔드 소스
│   │   ├── components/              # 재사용 컴포넌트
│   │   │   ├── Layout.tsx           # 전체 레이아웃
│   │   │   ├── Header.tsx           # 헤더 (로그아웃, 사용자 정보)
│   │   │   ├── Sidebar.tsx          # 사이드바 (네비게이션)
│   │   │   ├── LoginForm.tsx        # 로그인 폼
│   │   │   ├── ChangePasswordModal.tsx  # 비밀번호 변경 모달
│   │   │   ├── SiteSearchInput.tsx  # 현장 검색 컴포넌트
│   │   │   ├── SalesActivityForm.tsx    # 영업 활동 폼
│   │   │   └── SalesActivityTable.tsx   # 영업 활동 테이블
│   │   ├── pages/                   # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx        # 대시보드
│   │   │   ├── performance/         # 실적 입력 페이지
│   │   │   │   ├── WeeklyPlan.tsx   # 주간 업무 계획
│   │   │   │   ├── DailyPlan.tsx    # 일일 업무 일지
│   │   │   │   ├── SalesActivity.tsx    # 영업 활동 관리
│   │   │   │   ├── Invoice.tsx      # 계산서 발행
│   │   │   │   └── Collection.tsx   # 수금 관리 (미구현)
│   │   │   └── analytics/           # 분석 대시보드 페이지
│   │   │       ├── ActivityStatus.tsx   # 영업/현장 관리 실행 현황
│   │   │       ├── MonthlySales.tsx     # 월별 매출 및 목표달성
│   │   │       ├── OrderAchievement.tsx # 수주 실적 및 목표달성률
│   │   │       ├── CostEfficiency.tsx   # 원가 투입 효율 관리
│   │   │       └── CollectionStatus.tsx # 수금 실적 및 미수금 (미구현)
│   │   ├── lib/                     # 유틸리티 라이브러리
│   │   │   └── supabase.ts          # Supabase 클라이언트
│   │   ├── types/                   # TypeScript 타입 정의
│   │   │   └── index.ts             # 공통 타입
│   │   ├── styles/                  # CSS 스타일
│   │   │   └── globals.css          # 전역 스타일
│   │   ├── App.tsx                  # 메인 앱 (라우팅)
│   │   ├── index.tsx                # 엔트리 포인트
│   │   └── index.html               # HTML 템플릿
│   └── server/                      # 백엔드 소스
│       ├── index.ts                 # Bun 서버 (메인 라우팅)
│       ├── auth.ts                  # 인증 로직
│       ├── weekly-plans.ts          # 주간 업무 계획 API
│       ├── daily-plans.ts           # 일일 업무 일지 API
│       ├── activity-stats.ts        # 영업/현장 관리 실행 현황 API
│       ├── sales-stats.ts           # 월별 매출 통계 API
│       ├── sales-activities.ts      # 영업 활동 관리 API
│       ├── order-stats.ts           # 수주 실적 통계 API
│       ├── invoice-records.ts       # 계산서 발행 API
│       ├── cost-efficiency-stats.ts # 원가 투입 효율 API
│       └── db/
│           └── init.ts              # DB 초기화 (사용자 임포트)
├── users.csv                        # 사용자 데이터
├── supabase-setup.sql               # users 테이블 생성 SQL
├── supabase-weekly-plans.sql        # weekly_plans 테이블 생성 SQL
├── supabase-daily-plans.sql         # daily_plans 테이블 생성 SQL
├── supabase-sales-activities.sql    # sales_activities 테이블 생성 SQL
├── supabase-invoice-records.sql     # invoice_records 테이블 생성 SQL
├── package.json                     # 프로젝트 설정
├── tsconfig.json                    # TypeScript 설정
├── tailwind.config.js               # Tailwind CSS 설정
├── Dockerfile                       # Docker 이미지 빌드
├── nixpacks.toml                    # Railway 배포 설정
├── DATABASE.md                      # 데이터베이스 명세
├── README.md                        # 프로젝트 문서
└── REPORT.md                        # 상세 명세서 (본 문서)
```

---

## 3. 데이터베이스 설계

### 3.1 개요
- **DBMS**: Supabase PostgreSQL
- **URL**: https://dmyhhbvhbpwwtrmequop.supabase.co
- **보안**: Row Level Security (RLS) 적용
- **인덱싱**: 주요 조회 컬럼에 인덱스 설정
- **트리거**: updated_at 자동 업데이트

### 3.2 테이블 구조

#### 3.2.1 users (사용자)

##### 테이블 목적
CRM 시스템 사용자 계정 관리

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 기본값 | 설명 |
|--------|------------|-----------|--------|------|
| id | UUID | NO | gen_random_uuid() | 사용자 고유 ID (기본 키) |
| email | TEXT | NO | - | 이메일 (로그인 ID, UNIQUE) |
| password_hash | TEXT | NO | - | 비밀번호 해시 (bcrypt) |
| name | TEXT | NO | - | 사용자 이름 |
| department | TEXT | NO | - | 부서명 |
| site | TEXT | NO | - | 소속 사이트 |
| position | TEXT | NO | - | 직급 |
| phone | TEXT | YES | - | 전화번호 |
| role | TEXT | NO | - | 역할 (admin, user) |
| is_initial_password | BOOLEAN | YES | TRUE | 초기 비밀번호 사용 여부 |
| auto_login | BOOLEAN | YES | FALSE | 자동 로그인 설정 |
| created_at | TIMESTAMPTZ | YES | NOW() | 생성 일시 |
| updated_at | TIMESTAMPTZ | YES | NOW() | 수정 일시 |

##### 인덱스
- `idx_users_email` - email 컬럼 (로그인 성능 향상)
- `idx_users_role` - role 컬럼 (권한 필터링)
- `idx_users_department` - department 컬럼 (부서별 조회)

##### RLS 정책
- `Users can view own data`: 사용자는 자신의 데이터만 조회 가능
- `Users can update own data`: 사용자는 자신의 데이터만 수정 가능
- `Admins can view all users`: 관리자는 모든 사용자 조회 가능
- `Allow insert for service role`: 서비스 역할은 사용자 생성 가능

##### 트리거
- `update_users_updated_at`: UPDATE 시 updated_at 자동 업데이트

##### 비즈니스 로직
1. 초기 비밀번호는 "1234"로 설정
2. 첫 로그인 시 is_initial_password가 true면 비밀번호 변경 강제
3. 관리자(admin)는 전체 사용자 데이터 조회 가능
4. 일반 사용자(user)는 본인 데이터만 조회 가능

---

#### 3.2.2 construction_management (현장관리) - ERP 동기화

##### 테이블 목적
SmartWiz ERP 시스템에서 동기화되는 건설 프로젝트 현장 관리 데이터

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 설명 | 원본 CSV 컬럼명 |
|--------|------------|-----------|------|----------------|
| id | BIGSERIAL | NO | 기본 키 (자동 증가) | - |
| cms | TEXT | YES | CMS 코드 (현장 식별자) | CMS |
| site_name | TEXT | YES | 현장명 | 현장명 |
| site_address | TEXT | YES | 현장 주소 | 현장주소 |
| client | TEXT | YES | 고객사명 | 고객사 |
| department | TEXT | YES | 담당 부서 | 담당부서 |
| sales_manager | TEXT | YES | 영업 담당자 | 영업담당 |
| construction_manager | TEXT | YES | 시공 담당자 | 시공담당 |
| order_month | TEXT | YES | 수주 월 | 수주월 |
| order_amount | NUMERIC | YES | 수주 금액 | 수주금액 |
| item_count | NUMERIC | YES | 품목 수 | 품목수 |
| total_contract_amount | INTEGER | YES | 총 계약 금액 | 총계약금액 |
| execution_amount | NUMERIC | YES | 실행 금액 | 실행금액 |
| execution_rate | NUMERIC | YES | 실행율 (%) | 실행율 |
| start_date | TEXT | YES | 시작일 | 시작 |
| end_date | TEXT | YES | 종료일 | 종료 |
| status | TEXT | YES | 현장 상태 | 상태 |
| registration | TEXT | YES | 등록 정보 | 등록 |
| registration_date | TEXT | YES | 등록일 | 등록일 |
| approval_date | TEXT | YES | 결재일 | 결재일 |
| completion_date | NUMERIC | YES | 완료일 | 완료일 |
| notes | TEXT | YES | 참고사항 | 참고사항 |
| synced_at | TIMESTAMPTZ | NO | 동기화 시각 | - |

##### 인덱스
- `idx_construction_cms` - cms 컬럼
- `idx_construction_site_name` - site_name 컬럼
- `idx_construction_status` - status 컬럼
- `idx_construction_department` - department 컬럼

##### 데이터 특성
- 평균 레코드 수: 약 3,995개
- 동기화 주기: 약 8분마다 전체 데이터 갱신
- 동기화 방식: 기존 데이터 삭제 후 신규 데이터 삽입

---

#### 3.2.3 inpays (매출) - ERP 동기화

##### 테이블 목적
SmartWiz ERP 시스템에서 동기화되는 프로젝트별 매출 거래 내역

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 설명 | 원본 CSV 컬럼명 |
|--------|------------|-----------|------|----------------|
| id | BIGSERIAL | NO | 기본 키 (자동 증가) | - |
| construction_manager | TEXT | YES | 시공 담당자 | 시공 |
| sales_manager | TEXT | YES | 영업 담당자 | 영업 |
| department | TEXT | YES | 담당 부서 | 부서 |
| cms | TEXT | YES | CMS 코드 | CMS |
| site_name | TEXT | YES | 현장명 | 현장명 |
| client | TEXT | YES | 고객사명 | 고객사 |
| item | TEXT | YES | ITEM 코드 | ITEM |
| product_name | TEXT | YES | 품명 | 품명 |
| unit | TEXT | YES | 단위 | 단위 |
| quantity | NUMERIC | YES | 수량 | 수량 |
| unit_price | NUMERIC | YES | 단가 | 단가 |
| supply_price | INTEGER | YES | 공급가액 | 공급가액 |
| vat | NUMERIC | YES | 부가세 | 부가세 |
| total_amount | NUMERIC | YES | 합계금액 | 합계금액 |
| site_amount | NUMERIC | YES | 현장금액 | 현장금액 |
| sales_date | TEXT | YES | 매출일 (YYYY-MM-DD) | 매출일 |
| notes | TEXT | YES | 비고 | 비고 |
| creator | TEXT | YES | 작성자 | 작성자 |
| created_at | TEXT | YES | 등록일 | 등록일 |
| modifier | TEXT | YES | 수정자 | 수정자 |
| modified_at | TEXT | YES | 수정일 | 수정일 |
| synced_at | TIMESTAMPTZ | NO | 동기화 시각 | - |

##### 인덱스
- `idx_inpays_cms` - cms 컬럼
- `idx_inpays_site_name` - site_name 컬럼
- `idx_inpays_sales_date` - sales_date 컬럼
- `idx_inpays_department` - department 컬럼

##### 데이터 특성
- 평균 레코드 수: 약 11,148개
- 동기화 주기: 약 8분마다 전체 데이터 갱신

---

#### 3.2.4 outpays (매입) - ERP 동기화

##### 테이블 목적
SmartWiz ERP 시스템에서 동기화되는 프로젝트별 매입(구매) 거래 내역

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 설명 | 원본 CSV 컬럼명 |
|--------|------------|-----------|------|----------------|
| id | BIGSERIAL | NO | 기본 키 (자동 증가) | - |
| construction_manager | TEXT | YES | 시공 담당자 | 시공 |
| sales_manager | TEXT | YES | 영업 담당자 | 영업 |
| department | TEXT | YES | 담당 부서 | 부서 |
| type | TEXT | YES | 매입 타입 | 타입 |
| cms | TEXT | YES | CMS 코드 | CMS |
| site_name | TEXT | YES | 현장명 | 현장명 |
| item | TEXT | YES | ITEM 코드 | ITEM |
| product_name | TEXT | YES | 품명 | 품명 |
| unit | TEXT | YES | 단위 | 단위 |
| quantity | NUMERIC | YES | 수량 | 수량 |
| unit_price | NUMERIC | YES | 단가 | 단가 |
| supply_price | INTEGER | YES | 공급가액 | 공급가액 |
| vat | NUMERIC | YES | 부가세 | 부가세 |
| total_amount | NUMERIC | YES | 합계금액 | 합계금액 |
| purchase_date | TEXT | YES | 매입일 (YYYY-MM-DD) | 매입일 |
| company_name | TEXT | YES | 업체명 | 업체명 |
| business_number | TEXT | YES | 사업자번호 | 사업자번호 |
| notes | TEXT | YES | 비고 | 비고 |
| creator | TEXT | YES | 작성자 | 작성자 |
| created_at | TEXT | YES | 등록일 | 등록일 |
| modifier | TEXT | YES | 수정자 | 수정자 |
| modified_at | TEXT | YES | 수정일 | 수정일 |
| synced_at | TIMESTAMPTZ | NO | 동기화 시각 | - |

##### 인덱스
- `idx_outpays_cms` - cms 컬럼
- `idx_outpays_site_name` - site_name 컬럼
- `idx_outpays_purchase_date` - purchase_date 컬럼
- `idx_outpays_department` - department 컬럼

##### 데이터 특성
- 평균 레코드 수: 약 38,563개
- 동기화 주기: 약 8분마다 전체 데이터 갱신

---

#### 3.2.5 site_summary (현장 요약) - ERP 동기화

##### 테이블 목적
SmartWiz ERP 시스템에서 동기화되는 현장별 재무 현황 요약 정보 (총괄 계약 현황)

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 설명 | 원본 CSV 컬럼명 |
|--------|------------|-----------|------|----------------|
| id | BIGSERIAL | NO | 기본 키 (자동 증가) | - |
| department | TEXT | YES | 부서명 | 부서 |
| sales_manager | TEXT | YES | 영업 담당자 | 영업 |
| construction_manager | TEXT | YES | 시공 담당자 | 시공 |
| status | TEXT | YES | 현장 상태 | 상태 |
| cms | TEXT | YES | CMS 코드 | CMS |
| client | TEXT | YES | 건설사(고객사) | 건설사 |
| site_name | TEXT | YES | 현장명 | 현장 |
| contract_amount | TEXT | YES | 계약금액 (쉼표 포함 문자열) | 계약금액 |
| expected_execution_amount | TEXT | YES | 예상 실행금액 | 예상 실행금액 |
| expected_execution_rate | DECIMAL(15,2) | YES | 예상 실행률 (%) | % |
| expected_profit_amount | TEXT | YES | 예상 손익금액 | 예상 손익금액 |
| expected_profit_rate | DECIMAL(15,2) | YES | 예상 손익률 (%) | %.1 |
| construction_execution | TEXT | YES | 시공실행 금액 | 시공실행 |
| sales_amount | TEXT | YES | 매출금액 (쉼표 포함 문자열) | 매출금액 |
| sales_rate | DECIMAL(15,2) | YES | 매출률 (%) | %.2 |
| purchase_amount | TEXT | YES | 매입금액 (쉼표 포함 문자열) | 매입금액 |
| purchase_rate | DECIMAL(15,2) | YES | 매입률 (%) | %.3 |
| current_profit_status | TEXT | YES | 현손익현황 | 현손익현황 |
| remaining_construction | TEXT | YES | 공사잔액 | 공사잔액 |
| synced_at | TIMESTAMPTZ | NO | 동기화 시각 | - |

##### 인덱스
- `idx_site_summary_cms` - cms 컬럼
- `idx_site_summary_site_name` - site_name 컬럼
- `idx_site_summary_status` - status 컬럼
- `idx_site_summary_department` - department 컬럼

##### 데이터 특성
- 평균 레코드 수: 약 1,294개
- 동기화 주기: 약 8분마다 전체 데이터 갱신
- 특이사항: 금액 필드는 쉼표가 포함된 문자열로 저장 (예: "1,234,567")

---

#### 3.2.6 weekly_plans (주간 업무 계획)

##### 테이블 목적
사용자가 작성하는 주간 업무 계획 데이터 저장

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 기본값 | 설명 |
|--------|------------|-----------|--------|------|
| id | BIGSERIAL | NO | - | 기본 키 (자동 증가) |
| user_id | UUID | NO | - | 작성자 ID (users 참조, CASCADE 삭제) |
| cms_id | BIGINT | YES | - | 현장 ID (construction_management 참조, SET NULL 삭제) |
| cms_code | TEXT | YES | - | CMS 코드 (스냅샷) |
| site_name | TEXT | YES | - | 현장명 (스냅샷) |
| site_address | TEXT | YES | - | 현장 주소 (스냅샷) |
| sales_manager | TEXT | YES | - | 영업 담당자 (스냅샷) |
| construction_manager | TEXT | YES | - | 시공 담당자 (스냅샷) |
| activity_construction_sales | BOOLEAN | YES | FALSE | 활동구분: 건설사 영업 |
| activity_site_additional_sales | BOOLEAN | YES | FALSE | 활동구분: 현장 추가 영업 |
| activity_site_support | BOOLEAN | YES | FALSE | 활동구분: 현장 지원 |
| created_at | TIMESTAMPTZ | YES | NOW() | 생성 날짜 |
| updated_at | TIMESTAMPTZ | YES | NOW() | 수정 날짜 |
| created_by | TEXT | NO | - | 작성자명 |
| updated_by | TEXT | YES | - | 수정자명 |

##### 인덱스
- `idx_weekly_plans_user_id` - user_id 컬럼
- `idx_weekly_plans_created_at` - created_at 컬럼
- `idx_weekly_plans_cms_id` - cms_id 컬럼

##### 트리거
- `trigger_weekly_plans_updated_at`: UPDATE 시 updated_at 자동 업데이트

##### 비즈니스 로직
1. 현장 선택 시 construction_management에서 현장 정보 자동 로드
2. 활동 구분은 중복 선택 가능 (체크박스)
3. 관리자는 모든 사용자의 계획 조회 가능
4. 일반 사용자는 본인의 계획만 조회 가능

---

#### 3.2.7 daily_plans (일일 업무 일지)

##### 테이블 목적
사용자가 작성하는 일일 업무 일지 데이터 저장

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 기본값 | 설명 |
|--------|------------|-----------|--------|------|
| id | BIGSERIAL | NO | - | 기본 키 (자동 증가) |
| user_id | UUID | NO | - | 작성자 ID (users 참조, CASCADE 삭제) |
| cms_id | BIGINT | YES | - | 현장 ID (construction_management 참조, SET NULL 삭제) |
| cms_code | TEXT | YES | - | CMS 코드 (스냅샷) |
| site_name | TEXT | YES | - | 현장명 (스냅샷) |
| site_address | TEXT | YES | - | 현장 주소 (스냅샷) |
| sales_manager | TEXT | YES | - | 영업 담당자 (스냅샷) |
| construction_manager | TEXT | YES | - | 시공 담당자 (스냅샷) |
| activity_construction_sales | BOOLEAN | YES | FALSE | 활동구분: 건설사 영업 |
| activity_site_additional_sales | BOOLEAN | YES | FALSE | 활동구분: 현장 추가 영업 |
| activity_site_support | BOOLEAN | YES | FALSE | 활동구분: 현장 지원 |
| created_at | TIMESTAMPTZ | YES | NOW() | 생성 날짜 |
| updated_at | TIMESTAMPTZ | YES | NOW() | 수정 날짜 |
| created_by | TEXT | NO | - | 작성자명 |
| updated_by | TEXT | YES | - | 수정자명 |

##### 인덱스
- `idx_daily_plans_user_id` - user_id 컬럼
- `idx_daily_plans_created_at` - created_at 컬럼
- `idx_daily_plans_cms_id` - cms_id 컬럼

##### 트리거
- `trigger_daily_plans_updated_at`: UPDATE 시 updated_at 자동 업데이트

##### 비즈니스 로직
- weekly_plans와 동일한 구조 및 로직

---

#### 3.2.8 sales_activities (영업 활동)

##### 테이블 목적
영업 활동(견적/계약) 기록 및 첨부 이미지 관리

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 기본값 | 설명 |
|--------|------------|-----------|--------|------|
| id | BIGSERIAL | NO | - | 기본 키 (자동 증가) |
| user_id | UUID | NO | - | 작성자 ID (users 참조, CASCADE 삭제) |
| activity_date | DATE | NO | - | 활동 날짜 |
| activity_type | TEXT | NO | - | 활동 구분 (estimate: 견적, contract: 계약) |
| site_type | TEXT | NO | - | 현장 구분 (existing: 기존, new: 신규) |
| cms_id | BIGINT | YES | - | 현장 ID (construction_management 참조, SET NULL 삭제) |
| cms_code | TEXT | YES | - | 현장 코드 (스냅샷) |
| site_name | TEXT | YES | - | 현장명 (스냅샷 또는 직접 입력) |
| site_address | TEXT | YES | - | 현장 주소 (스냅샷 또는 직접 입력) |
| client | TEXT | YES | - | 고객사 (스냅샷 또는 직접 입력) |
| amount | DECIMAL(15,2) | YES | - | 금액 (견적금액 또는 계약금액) |
| execution_rate | INTEGER | YES | - | 실행률 (0-100%) |
| attachments | JSONB | YES | '[]' | 첨부 사진 배열 (Supabase Storage URL) |
| created_at | TIMESTAMPTZ | YES | NOW() | 등록 날짜 |
| updated_at | TIMESTAMPTZ | YES | NOW() | 수정 날짜 |
| created_by | TEXT | NO | - | 작성자 이름 |
| updated_by | TEXT | YES | - | 수정자 이름 |

##### 인덱스
- `idx_sales_activities_user_id` - user_id 컬럼
- `idx_sales_activities_activity_date` - activity_date 컬럼
- `idx_sales_activities_activity_type` - activity_type 컬럼
- `idx_sales_activities_site_type` - site_type 컬럼
- `idx_sales_activities_cms_id` - cms_id 컬럼

##### 트리거
- `trigger_sales_activities_updated_at`: UPDATE 시 updated_at 자동 업데이트

##### 비즈니스 로직
1. 기존 현장 선택 시 construction_management에서 현장 정보 자동 로드
2. 신규 현장인 경우 현장명, 주소, 고객사 직접 입력
3. 첨부 이미지는 Supabase Storage의 sales-activities 버킷에 업로드
4. 이미지 파일명 형식: `{user_id}/{timestamp}_{원본파일명}`
5. 삭제 시 Storage에서 이미지 자동 삭제
6. 수정 시 기존 이미지 중 제거된 것은 Storage에서 자동 삭제

---

#### 3.2.9 invoice_records (계산서 발행)

##### 테이블 목적
계산서 발행 기록 및 현장별 매출/매입 차액 관리

##### 컬럼 명세
| 컬럼명 | 데이터 타입 | Null 허용 | 기본값 | 설명 |
|--------|------------|-----------|--------|------|
| id | BIGSERIAL | NO | - | 기본 키 (자동 증가) |
| user_id | UUID | NO | - | 작성자 ID (users 참조, CASCADE 삭제) |
| cms_id | BIGINT | YES | - | 현장 ID (construction_management 참조, SET NULL 삭제) |
| cms_code | TEXT | YES | - | CMS 코드 (스냅샷) |
| site_name | TEXT | YES | - | 현장명 (스냅샷) |
| site_address | TEXT | YES | - | 현장 주소 (스냅샷) |
| sales_manager | TEXT | YES | - | 영업 담당자 (스냅샷) |
| construction_manager | TEXT | YES | - | 시공 담당자 (스냅샷) |
| sales_amount | TEXT | YES | - | 매출금액 (site_summary 스냅샷, 쉼표 포함) |
| purchase_amount | TEXT | YES | - | 매입금액 (site_summary 스냅샷, 쉼표 포함) |
| profit_difference | DECIMAL(15,2) | YES | - | 차액 (매출금액 - 매입금액) |
| is_over_invested | BOOLEAN | YES | - | 과투입 여부 (차액 < 0) |
| invoice_date | DATE | NO | - | 계산서 발행일 |
| invoice_amount | DECIMAL(15,2) | YES | - | 계산서 금액 |
| created_at | TIMESTAMPTZ | YES | NOW() | 생성 날짜 |
| updated_at | TIMESTAMPTZ | YES | NOW() | 수정 날짜 |
| created_by | TEXT | NO | - | 작성자명 |
| updated_by | TEXT | YES | - | 수정자명 |

##### 인덱스
- `idx_invoice_records_user_id` - user_id 컬럼
- `idx_invoice_records_invoice_date` - invoice_date 컬럼
- `idx_invoice_records_cms_id` - cms_id 컬럼
- `idx_invoice_records_created_at` - created_at 컬럼

##### 트리거
- `trigger_invoice_records_updated_at`: UPDATE 시 updated_at 자동 업데이트

##### 비즈니스 로직
1. 현장 선택 시 construction_management와 site_summary에서 정보 로드
2. profit_difference = parseFloat(sales_amount) - parseFloat(purchase_amount)
3. is_over_invested = profit_difference < 0
4. 사용자가 invoice_date와 invoice_amount 입력
5. 스냅샷 방식으로 현장 정보 저장 (ERP 데이터 변경 시에도 과거 기록 유지)

---

### 3.3 테이블 관계도

```
┌─────────────────────┐
│       users         │
│  (사용자)           │
│  - id (PK)          │
│  - email (UNIQUE)   │
│  - role             │
└──────────┬──────────┘
           │ 1
           │
           │ N
┌──────────▼──────────────────────────────────────────────┐
│  weekly_plans / daily_plans / sales_activities /        │
│  invoice_records                                        │
│  (사용자 생성 데이터)                                    │
│  - user_id (FK → users.id, CASCADE)                     │
│  - cms_id (FK → construction_management.id, SET NULL)   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ N
                      │
                      │ 1
┌─────────────────────▼───────────────────────────────────┐
│            construction_management                      │
│            (현장관리 - ERP 동기화)                       │
│            - id (PK)                                    │
│            - cms (CMS 코드)                             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ 1:N (cms 컬럼 기준 조인)
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
┌───────▼──────┐ ┌───▼──────┐ ┌───▼──────┐ ┌────▼─────────┐
│   inpays     │ │ outpays  │ │site_sum- │ │sales_activi- │
│   (매출)     │ │ (매입)   │ │mary      │ │ties          │
│   - cms      │ │ - cms    │ │(현장요약)│ │- cms_id (FK) │
└──────────────┘ └──────────┘ │- cms     │ └──────────────┘
                               └──────────┘
```

### 3.4 데이터 동기화 전략

#### 3.4.1 ERP 동기화 테이블
- **대상 테이블**: construction_management, inpays, outpays, site_summary
- **동기화 주기**: 약 8분마다
- **동기화 방식**:
  1. 기존 데이터 전체 삭제 (`DELETE FROM 테이블명`)
  2. CSV 파일에서 데이터 읽기
  3. 100개씩 배치로 INSERT
  4. synced_at 컬럼에 현재 시각 기록
  5. CSV 및 JSON 파일 삭제

#### 3.4.2 사용자 생성 테이블
- **대상 테이블**: users, weekly_plans, daily_plans, sales_activities, invoice_records
- **데이터 보존**: 영구 보존 (ERP 동기화와 무관)
- **CASCADE 삭제**: users 삭제 시 연관 데이터 자동 삭제
- **SET NULL 삭제**: construction_management 삭제 시 FK를 NULL로 설정 (스냅샷 데이터는 유지)

---

## 4. 백엔드 API 설계

### 4.1 서버 구성

#### 4.1.1 Bun 서버 (src/server/index.ts)
- **포트**: 3017 (개발), 3000 (프로덕션)
- **정적 파일**: Vite 빌드 결과물 서빙
- **API 라우팅**: pathname 기반 라우팅
- **인증**: JWT 토큰 기반 (Authorization 헤더)

#### 4.1.2 환경 변수
```
SUPABASE_URL=https://dmyhhbvhbpwwtrmequop.supabase.co
SUPABASE_ANON_KEY=<Supabase Anon Key>
PORT=3017
NODE_ENV=development
```

### 4.2 인증 API (src/server/auth.ts)

#### 4.2.1 POST /api/auth/login
##### 목적
사용자 로그인 및 JWT 토큰 발급

##### 요청
```typescript
{
  email: string;      // 이메일
  password: string;   // 비밀번호
  autoLogin?: boolean; // 자동 로그인 여부
}
```

##### 응답 (성공)
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    department: string;
    site: string;
    position: string;
    phone: string;
    role: 'admin' | 'user';
    is_initial_password: boolean;
    auto_login: boolean;
  };
  token: string;  // JWT 토큰
}
```

##### 응답 (실패)
```typescript
{
  success: false;
  message: string;  // 오류 메시지
}
```

##### 로직 흐름
1. Supabase에서 email로 사용자 조회
2. bcrypt로 비밀번호 검증
3. JWT 토큰 생성 (페이로드: userId, email, role)
4. autoLogin이 true면 users 테이블의 auto_login 업데이트
5. 사용자 정보 및 토큰 반환

---

#### 4.2.2 POST /api/auth/change-password
##### 목적
비밀번호 변경

##### 요청
```typescript
{
  currentPassword: string;  // 현재 비밀번호
  newPassword: string;      // 새 비밀번호
}
```
- 헤더: `Authorization: Bearer <token>`

##### 응답 (성공)
```typescript
{
  success: true;
  message: "비밀번호가 변경되었습니다."
}
```

##### 로직 흐름
1. JWT 토큰에서 userId 추출
2. 현재 비밀번호 검증
3. 새 비밀번호를 bcrypt로 해싱
4. users 테이블 업데이트 (password_hash, is_initial_password = false)

---

#### 4.2.3 POST /api/auth/logout
##### 목적
자동 로그인 해제

##### 요청
- 헤더: `Authorization: Bearer <token>`

##### 응답
```typescript
{
  success: true;
  message: "로그아웃되었습니다."
}
```

##### 로직 흐름
1. JWT 토큰에서 userId 추출
2. users 테이블의 auto_login을 false로 업데이트

---

### 4.3 업무 계획 API

#### 4.3.1 주간 업무 계획 (src/server/weekly-plans.ts)

##### GET /api/weekly-plans
목적: 주간 업무 계획 목록 조회

요청 파라미터:
```typescript
{
  page?: number;      // 페이지 번호 (기본: 1)
  limit?: number;     // 페이지당 개수 (기본: 10)
  start_date?: string; // 시작일 (YYYY-MM-DD)
  end_date?: string;   // 종료일 (YYYY-MM-DD)
}
```

응답:
```typescript
{
  success: true;
  data: {
    plans: WeeklyPlan[];  // 계획 목록
    total: number;        // 전체 개수
    page: number;         // 현재 페이지
    limit: number;        // 페이지당 개수
  }
}
```

로직:
- admin: 전체 사용자 데이터 조회
- user: 본인 데이터만 조회 (user_id 필터)
- created_at 내림차순 정렬
- 페이지네이션 적용

---

##### POST /api/weekly-plans
목적: 주간 업무 계획 생성

요청:
```typescript
{
  cms_id: number;
  cms_code: string;
  site_name: string;
  site_address: string;
  sales_manager: string;
  construction_manager: string;
  activity_construction_sales: boolean;
  activity_site_additional_sales: boolean;
  activity_site_support: boolean;
}
```

응답:
```typescript
{
  success: true;
  data: WeeklyPlan;  // 생성된 계획
}
```

로직:
1. JWT 토큰에서 userId, userName 추출
2. Supabase에 INSERT
3. created_by에 userName 저장

---

##### PUT /api/weekly-plans/:id
목적: 주간 업무 계획 수정

요청:
```typescript
{
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  activity_construction_sales?: boolean;
  activity_site_additional_sales?: boolean;
  activity_site_support?: boolean;
}
```

로직:
1. 본인 작성 여부 확인 (user_id)
2. Supabase UPDATE
3. updated_by에 userName 저장
4. updated_at 자동 업데이트 (트리거)

---

##### DELETE /api/weekly-plans/:id
목적: 주간 업무 계획 삭제

로직:
1. 본인 작성 여부 확인
2. Supabase DELETE

---

#### 4.3.2 일일 업무 일지 (src/server/daily-plans.ts)
주간 업무 계획과 동일한 API 구조 (테이블만 daily_plans로 변경)

---

### 4.4 영업 활동 API (src/server/sales-activities.ts)

#### 4.4.1 GET /api/sales-activities
목적: 영업 활동 목록 조회

요청 파라미터:
```typescript
{
  user_id?: string;       // 사용자 ID 필터 (admin만 사용)
  year?: number;          // 년도 필터
  month?: number;         // 월 필터
  activity_type?: string; // 활동 구분 (estimate/contract)
  site_type?: string;     // 현장 구분 (existing/new)
  page?: number;          // 페이지 번호
  limit?: number;         // 페이지당 개수
}
```

응답:
```typescript
{
  success: true;
  data: {
    activities: SalesActivity[];
    total: number;
    page: number;
    limit: number;
  }
}
```

로직:
- admin: user_id 파라미터로 필터 가능
- user: 본인 데이터만 조회
- year, month로 activity_date 필터
- activity_type, site_type 필터 적용
- activity_date 내림차순 정렬

---

#### 4.4.2 POST /api/sales-activities
목적: 영업 활동 생성

요청:
```typescript
{
  activity_date: string;  // YYYY-MM-DD
  activity_type: 'estimate' | 'contract';
  site_type: 'existing' | 'new';
  cms_id?: number;        // 기존 현장인 경우
  cms_code?: string;
  site_name: string;
  site_address?: string;
  client?: string;
  amount?: number;
  execution_rate?: number;
  attachments: string[];  // Base64 이미지 배열
}
```

응답:
```typescript
{
  success: true;
  data: SalesActivity;
}
```

로직:
1. attachments의 Base64 이미지를 Supabase Storage에 업로드
2. 파일 경로: `sales-activities/{userId}/{timestamp}_{index}.jpg`
3. 업로드된 URL 배열을 attachments JSONB에 저장
4. Supabase sales_activities 테이블에 INSERT

---

#### 4.4.3 PUT /api/sales-activities/:id
목적: 영업 활동 수정

로직:
1. 기존 attachments 조회
2. 새 attachments와 비교하여 삭제된 파일 식별
3. 삭제된 파일을 Storage에서 제거
4. 새 Base64 이미지 업로드
5. Supabase UPDATE

---

#### 4.4.4 DELETE /api/sales-activities/:id
목적: 영업 활동 삭제

로직:
1. attachments 조회
2. Storage에서 모든 첨부 파일 삭제
3. Supabase DELETE

---

### 4.5 계산서 발행 API (src/server/invoice-records.ts)

#### 4.5.1 GET /api/invoice-records
목적: 계산서 발행 기록 조회

요청 파라미터:
```typescript
{
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}
```

응답:
```typescript
{
  success: true;
  data: {
    records: InvoiceRecord[];
    total: number;
    page: number;
    limit: number;
  }
}
```

---

#### 4.5.2 POST /api/invoice-records
목적: 계산서 발행 기록 생성

요청:
```typescript
{
  cms_id: number;
  cms_code: string;
  site_name: string;
  site_address: string;
  sales_manager: string;
  construction_manager: string;
  invoice_date: string;    // YYYY-MM-DD
  invoice_amount: number;
}
```

로직:
1. cms_code로 site_summary 조회
2. sales_amount, purchase_amount 추출
3. profit_difference 계산 (문자열 → 숫자 변환 후)
4. is_over_invested = profit_difference < 0
5. Supabase INSERT

---

### 4.6 분석 통계 API

#### 4.6.1 영업/현장 관리 실행 현황 (src/server/activity-stats.ts)

##### GET /api/activity-stats
목적: 주간/일일 계획 통계 조회

요청 파라미터:
```typescript
{
  year: number;
  user_name?: string;  // admin만 사용
}
```

응답:
```typescript
{
  success: true;
  data: {
    monthly: MonthlyActivityStats[];  // 월별 통계
    summary: ActivitySummary;         // 연간 요약
  }
}
```

MonthlyActivityStats:
```typescript
{
  month: number;              // 1-12
  weeklyCount: number;        // 주간 계획 수
  dailyCount: number;         // 일일 일지 수
  weeklyProgress: number;     // 주간 진행률 (%)
  dailyProgress: number;      // 일일 진행률 (%)
}
```

로직:
1. weekly_plans와 daily_plans에서 연도별 데이터 조회
2. construction_manager (ILIKE) 또는 user_id로 필터
3. created_at에서 월 추출 (1-12)
4. 월별 카운트 집계
5. 진행률 계산 (주간: 52주 기준, 일일: 365일 기준)

---

#### 4.6.2 월별 매출 통계 (src/server/sales-stats.ts)

##### GET /api/sales-stats
목적: 월별 매출/매입/이익 통계

요청 파라미터:
```typescript
{
  year: number;
  user_name?: string;
}
```

응답:
```typescript
{
  success: true;
  data: {
    monthly: MonthlySalesStats[];
    summary: SalesSummary;
  }
}
```

MonthlySalesStats:
```typescript
{
  month: number;
  revenue: number;   // 매출
  cost: number;      // 매입
  profit: number;    // 이익 (매출 - 매입)
}
```

로직:
1. inpays에서 sales_date 기준으로 매출 집계
2. outpays에서 purchase_date 기준으로 매입 집계
3. construction_manager로 필터
4. 월별 합계 계산
5. profit = revenue - cost

---

#### 4.6.3 수주 실적 통계 (src/server/order-stats.ts)

##### GET /api/order-stats
목적: 수주 실적 및 목표 달성률 통계

요청 파라미터:
```typescript
{
  year: number;
  user_name?: string;
}
```

응답:
```typescript
{
  success: true;
  data: {
    monthly: MonthlyOrderStats[];
    summary: OrderSummary;
  }
}
```

MonthlyOrderStats:
```typescript
{
  month: number;
  confirmedRevenue: number;      // 확정 수주 (매출 기여)
  executingRevenue: number;      // 실행 중 수주
  expectedRevenue: number;       // 예정 수주
  confirmedProfit: number;       // 확정 이익 (이익 기여)
  executingProfit: number;       // 실행 중 이익
  expectedProfit: number;        // 예정 이익
}
```

로직:
1. construction_management에서 현장 데이터 조회
2. execution_rate >= 90: 확정 (confirmedRevenue, confirmedProfit)
3. 10 <= execution_rate < 90: 실행 중 (executingRevenue, executingProfit)
4. execution_rate < 10: 예정 (expectedRevenue, expectedProfit)
5. order_month에서 월 추출하여 집계

---

#### 4.6.4 원가 투입 효율 통계 (src/server/cost-efficiency-stats.ts)

##### GET /api/cost-efficiency-stats
목적: 원가 투입 효율 분석

요청 파라미터:
```typescript
{
  year: number;
  user_name: string;  // 필수
}
```

응답:
```typescript
{
  success: true;
  data: {
    monthly: MonthlyCostEfficiency[];
    summary: CostEfficiencySummary;
  }
}
```

MonthlyCostEfficiency:
```typescript
{
  month: number;
  overInvestment: number;      // 과투입 (절대값)
  confirmedRevenue: number;    // 확정 매출
  difference: number;           // 편차 (과투입 - 확정매출)
}
```

로직:
1. inpays에서 construction_manager로 필터하여 매출 조회
2. sales_date로 연도/월 필터
3. CMS 코드 수집
4. 각 월별 CMS 코드로 site_summary 조회
5. sales_amount - purchase_amount < 0인 현장의 차액 절대값 합산 (overInvestment)
6. inpays의 supply_price 합산 (confirmedRevenue)
7. difference = overInvestment - confirmedRevenue

---

### 4.7 현장 검색 API

#### 4.7.1 GET /api/sites/search
목적: 현장 자동완성 검색

요청 파라미터:
```typescript
{
  query: string;  // 검색어 (현장명 또는 CMS)
  limit?: number; // 결과 개수 (기본: 10)
}
```

응답:
```typescript
{
  success: true;
  data: Site[];
}
```

Site:
```typescript
{
  id: number;
  cms: string;
  site_name: string;
  site_address: string;
  client: string;
  sales_manager: string;
  construction_manager: string;
}
```

로직:
1. construction_management에서 ILIKE 검색
2. cms 또는 site_name 매칭
3. limit 개수만큼 반환

---

### 4.8 사용자 조회 API

#### 4.8.1 GET /api/sales-activities/users
목적: 현재 로그인한 사용자 정보 조회

응답:
```typescript
{
  success: true;
  user: User;
}
```

로직:
1. JWT 토큰에서 userId 추출
2. Supabase users 테이블 조회

---

#### 4.8.2 GET /api/users/list
목적: 사용자 목록 조회 (admin 전용)

응답:
```typescript
{
  success: true;
  users: User[];
}
```

로직:
1. admin 권한 확인
2. users 테이블 전체 조회 (name 오름차순)

---

### 4.9 에러 처리

모든 API는 다음과 같은 에러 응답 형식을 사용:

```typescript
{
  success: false;
  message: string;  // 에러 메시지
}
```

HTTP 상태 코드:
- 200: 성공
- 400: 잘못된 요청 (파라미터 누락 등)
- 401: 인증 실패 (토큰 없음, 만료, 잘못된 비밀번호)
- 403: 권한 없음 (admin 전용 API를 user가 호출)
- 404: 리소스 없음
- 500: 서버 오류

---

## 5. 프론트엔드 설계

### 5.1 기술 스택
- React 18.2.0 (함수형 컴포넌트, Hooks)
- TypeScript (타입 안정성)
- Tailwind CSS (유틸리티 기반 스타일링)
- Recharts (데이터 시각화)
- Lucide React (아이콘)

### 5.2 라우팅 (src/frontend/App.tsx)

#### 5.2.1 라우팅 구조
```typescript
const renderPage = () => {
  switch (currentPage) {
    case '/': return <Dashboard />;
    case '/performance/weekly-plan': return <WeeklyPlan />;
    case '/performance/daily-plan': return <DailyPlan />;
    case '/performance/sales-activity': return <SalesActivity user={user} />;
    case '/performance/invoice': return <Invoice user={user} />;
    case '/analytics/activity-status': return <ActivityStatus user={user} />;
    case '/analytics/monthly-sales': return <MonthlySales user={user} />;
    case '/analytics/order-achievement': return <OrderAchievement user={user} />;
    case '/analytics/cost-efficiency': return <CostEfficiency user={user} />;
    default: return <Dashboard />;
  }
};
```

#### 5.2.2 인증 상태 관리
```typescript
const [user, setUser] = useState<User | null>(null);
const [token, setToken] = useState<string | null>(null);

useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (storedToken && storedUser) {
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }
}, []);
```

로그인 시:
1. localStorage에 token, user 저장
2. State 업데이트
3. is_initial_password가 true면 비밀번호 변경 모달 표시

로그아웃 시:
1. POST /api/auth/logout 호출
2. localStorage 클리어
3. State 초기화

---

### 5.3 공통 컴포넌트

#### 5.3.1 Layout (src/frontend/components/Layout.tsx)
목적: 전체 페이지 레이아웃 (Header + Sidebar + Content)

구조:
```tsx
<div className="flex h-screen">
  <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
  <div className="flex-1 flex flex-col">
    <Header user={user} onLogout={handleLogout} />
    <main className="flex-1 overflow-auto p-6">
      {children}
    </main>
  </div>
</div>
```

---

#### 5.3.2 Header (src/frontend/components/Header.tsx)
목적: 상단 헤더 (사용자 정보, 로그아웃)

기능:
- 현재 시각 표시 (1초마다 업데이트)
- 사용자 이름, 부서, 직급 표시
- 로그아웃 버튼

---

#### 5.3.3 Sidebar (src/frontend/components/Sidebar.tsx)
목적: 좌측 네비게이션 메뉴

메뉴 구조:
```typescript
[
  {
    id: 'dashboard',
    label: '대시보드',
    icon: Home,
    path: '/',
  },
  {
    id: 'performance',
    label: '실적 입력',
    icon: ClipboardList,
    children: [
      { id: 'weekly-plan', label: '주간 업무 계획', path: '/performance/weekly-plan' },
      { id: 'daily-plan', label: '일일 업무 일지', path: '/performance/daily-plan' },
      { id: 'sales-activity', label: '영업 활동 관리', path: '/performance/sales-activity' },
      { id: 'invoice', label: '계산서 발행', path: '/performance/invoice' },
    ],
  },
  {
    id: 'analytics',
    label: '분석 대시보드',
    icon: BarChart3,
    children: [
      { id: 'activity-status', label: '영업/현장 관리 실행 현황', path: '/analytics/activity-status' },
      { id: 'monthly-sales', label: '월별 매출 및 목표달성', path: '/analytics/monthly-sales' },
      { id: 'order-achievement', label: '수주 실적 및 목표달성률', path: '/analytics/order-achievement' },
      { id: 'cost-efficiency', label: '원가 투입 효율 관리', path: '/analytics/cost-efficiency' },
    ],
  },
]
```

---

#### 5.3.4 SiteSearchInput (src/frontend/components/SiteSearchInput.tsx)
목적: 현장 검색 자동완성 입력

기능:
1. 검색어 입력 시 GET /api/sites/search 호출
2. 디바운싱 (300ms)
3. 드롭다운으로 검색 결과 표시
4. 선택 시 onSelect 콜백 호출

사용 예시:
```tsx
<SiteSearchInput
  onSelect={(site) => {
    setFormData({
      cms_id: site.id,
      cms_code: site.cms,
      site_name: site.site_name,
      site_address: site.site_address,
      // ...
    });
  }}
/>
```

---

#### 5.3.5 LoginForm (src/frontend/components/LoginForm.tsx)
목적: 로그인 폼

기능:
- 이메일, 비밀번호 입력
- 자동 로그인 체크박스
- POST /api/auth/login 호출
- 성공 시 onLogin 콜백

---

#### 5.3.6 ChangePasswordModal (src/frontend/components/ChangePasswordModal.tsx)
목적: 비밀번호 변경 모달

기능:
- 현재 비밀번호, 새 비밀번호, 확인 입력
- 새 비밀번호 일치 검증
- POST /api/auth/change-password 호출
- 초기 비밀번호 사용자는 강제 표시 (닫기 불가)

---

### 5.4 페이지 컴포넌트

#### 5.4.1 Dashboard (src/frontend/pages/Dashboard.tsx)
목적: 메인 대시보드

내용:
- 환영 메시지
- 주요 기능 안내
- 빠른 바로가기 카드

---

#### 5.4.2 WeeklyPlan (src/frontend/pages/performance/WeeklyPlan.tsx)
목적: 주간 업무 계획 관리

기능:
1. 계획 목록 조회 (GET /api/weekly-plans)
2. 날짜 범위 필터 (시작일, 종료일)
3. 페이지네이션
4. 새 계획 작성 (모달)
   - 현장 검색 (SiteSearchInput)
   - 활동 구분 체크박스 (중복 선택 가능)
   - POST /api/weekly-plans
5. 계획 수정 (모달)
   - PUT /api/weekly-plans/:id
6. 계획 삭제
   - DELETE /api/weekly-plans/:id

테이블 컬럼:
- 작성일
- 현장명 (CMS)
- 현장 주소
- 영업 담당자
- 시공 담당자
- 활동 구분 (건설사 영업, 현장 추가 영업, 현장 지원)
- 액션 (수정, 삭제)

---

#### 5.4.3 DailyPlan (src/frontend/pages/performance/DailyPlan.tsx)
목적: 일일 업무 일지 관리

기능: WeeklyPlan과 동일 (API 엔드포인트만 /api/daily-plans로 변경)

---

#### 5.4.4 SalesActivity (src/frontend/pages/performance/SalesActivity.tsx)
목적: 영업 활동 관리

기능:
1. 활동 목록 조회 (GET /api/sales-activities)
2. 필터
   - 사용자 선택 (admin만, 드롭다운)
   - 연도/월 선택
   - 활동 구분 (견적/계약)
   - 현장 구분 (기존/신규)
3. 페이지네이션
4. 새 활동 작성 (SalesActivityForm 컴포넌트)
   - 활동 날짜
   - 활동 구분 (견적/계약)
   - 현장 구분 (기존/신규)
   - 기존 현장: SiteSearchInput으로 검색
   - 신규 현장: 현장명, 주소, 고객사 직접 입력
   - 금액, 실행률
   - 이미지 첨부 (다중 선택, Base64 인코딩)
   - POST /api/sales-activities
5. 활동 수정 (SalesActivityForm 컴포넌트)
   - 기존 이미지 표시 (삭제 가능)
   - 새 이미지 추가
   - PUT /api/sales-activities/:id
6. 활동 삭제
   - DELETE /api/sales-activities/:id

테이블 컬럼 (SalesActivityTable):
- 활동 날짜
- 활동 구분
- 현장 구분
- 현장명
- 고객사
- 금액
- 실행률
- 첨부 이미지 개수
- 작성자
- 액션 (수정, 삭제)

---

#### 5.4.5 Invoice (src/frontend/pages/performance/Invoice.tsx)
목적: 계산서 발행 관리

기능:
1. 발행 기록 조회 (GET /api/invoice-records)
2. 연도/월 필터
3. 페이지네이션
4. 새 계산서 발행 (모달)
   - 현장 검색 (SiteSearchInput)
   - 현장 선택 시 site_summary에서 매출/매입 금액 자동 조회
   - 차액 및 과투입 여부 자동 계산
   - 발행일, 발행 금액 입력
   - POST /api/invoice-records
5. 계산서 수정 (모달)
   - PUT /api/invoice-records/:id
6. 계산서 삭제
   - DELETE /api/invoice-records/:id

테이블 컬럼:
- 발행일
- 현장명 (CMS)
- 매출금액
- 매입금액
- 차액 (빨강/초록)
- 과투입 여부 (O/X)
- 계산서 금액
- 작성자
- 액션 (수정, 삭제)

---

#### 5.4.6 ActivityStatus (src/frontend/pages/analytics/ActivityStatus.tsx)
목적: 영업/현장 관리 실행 현황 분석

기능:
1. 통계 조회 (GET /api/activity-stats)
2. 연도 선택 (최근 6년)
3. 사용자 선택 (admin만, 드롭다운)
4. 요약 카드
   - 주간 계획 총 건수
   - 일일 일지 총 건수
   - 주간 진행률 (연 52주 기준)
   - 일일 진행률 (연 365일 기준)
5. 월별 추이 차트 (Recharts LineChart)
   - X축: 월 (1-12)
   - Y축: 건수
   - 주간 계획 (파란색 선)
   - 일일 일지 (초록색 선)

---

#### 5.4.7 MonthlySales (src/frontend/pages/analytics/MonthlySales.tsx)
목적: 월별 매출 및 목표달성 분석

기능:
1. 통계 조회 (GET /api/sales-stats)
2. 연도 선택
3. 사용자 선택 (admin만)
4. 요약 카드
   - 연간 총 매출
   - 연간 총 매입
   - 연간 총 이익
   - 평균 이익률
5. 월별 추이 차트 (Recharts ComposedChart)
   - BarChart: 매출 (파란색), 매입 (빨간색)
   - LineChart: 이익 (초록색 선)

---

#### 5.4.8 OrderAchievement (src/frontend/pages/analytics/OrderAchievement.tsx)
목적: 수주 실적 및 목표달성률 분석

기능:
1. 통계 조회 (GET /api/order-stats)
2. 연도 선택
3. 사용자 선택 (admin만)
4. 요약 카드
   - 연간 확정 수주
   - 연간 실행 중 수주
   - 연간 예정 수주
   - 연간 확정 이익
5. 월별 추이 차트 (Recharts ComposedChart)
   - 매출 기여 (BarChart): 확정/실행/예정
   - 이익 기여 (LineChart): 확정/실행/예정

---

#### 5.4.9 CostEfficiency (src/frontend/pages/analytics/CostEfficiency.tsx)
목적: 원가 투입 효율 관리 분석

기능:
1. 통계 조회 (GET /api/cost-efficiency-stats)
2. 연도 선택 (최근 6년)
3. 사용자 선택 (admin만)
4. 테이블 뷰
   - 컬럼: 월, 과투입 현황, 월별 확정 매출, 편차
   - 12개월 행 + 누계 행
   - 과투입: 빨간색
   - 편차: 음수(빨강), 양수(초록)
5. 금액 포맷팅 (천 단위 쉼표)

테이블 예시:
```
| 월   | 과투입 현황 (원) | 월별 확정 매출 (원) | 편차 (원)       |
|------|------------------|---------------------|-----------------|
| 1월  | 1,234,567        | 2,345,678           | -1,111,111      |
| 2월  | 987,654          | 1,234,567           | -246,913        |
| ...  | ...              | ...                 | ...             |
| 누계 | 12,345,678       | 23,456,789          | -11,111,111     |
```

---

### 5.5 상태 관리

#### 5.5.1 로컬 상태 (useState)
각 페이지 컴포넌트에서 사용:
- 폼 데이터 (formData)
- 목록 데이터 (data)
- 로딩 상태 (loading)
- 모달 표시 여부 (showModal)
- 필터 값 (year, month, user_name 등)
- 페이지네이션 (page, total)

#### 5.5.2 전역 상태 (App.tsx)
- user: 로그인한 사용자 정보
- token: JWT 토큰
- currentPage: 현재 페이지 경로

#### 5.5.3 로컬 스토리지
- token: JWT 토큰 (자동 로그인용)
- user: 사용자 정보 JSON (자동 로그인용)

---

### 5.6 스타일링 (Tailwind CSS)

#### 5.6.1 색상 테마
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#e6f7ed',
    100: '#b3e6ca',
    200: '#80d5a7',
    300: '#4dc384',
    400: '#1ab261',
    500: '#16a34a',  // Primary Green
    600: '#138a3e',
    700: '#0f7132',
    800: '#0c5826',
    900: '#083f1a',
  },
  dark: {
    50: '#f5f5f5',
    100: '#e0e0e0',
    200: '#cccccc',
    300: '#b3b3b3',
    400: '#999999',
    500: '#808080',
    600: '#666666',
    700: '#4d4d4d',
    800: '#333333',
    900: '#1a1a1a',  // Dark Background
  },
}
```

#### 5.6.2 공통 스타일 패턴
버튼:
```tsx
<button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded">
  버튼
</button>
```

카드:
```tsx
<div className="bg-dark-800 rounded-lg shadow-md p-6">
  {/* 내용 */}
</div>
```

테이블:
```tsx
<table className="w-full text-sm text-left">
  <thead className="bg-dark-700">
    <tr>
      <th className="px-4 py-3">컬럼</th>
    </tr>
  </thead>
  <tbody className="bg-dark-800">
    <tr className="border-b border-dark-700 hover:bg-dark-700">
      <td className="px-4 py-3">데이터</td>
    </tr>
  </tbody>
</table>
```

입력 필드:
```tsx
<input
  type="text"
  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded focus:outline-none focus:border-primary-500"
/>
```

---

## 6. 기능별 상세 구현

### 6.1 인증 시스템

#### 6.1.1 로그인 프로세스
1. 사용자가 이메일, 비밀번호 입력
2. LoginForm에서 POST /api/auth/login 호출
3. 서버에서 Supabase users 테이블 조회
4. bcrypt로 비밀번호 검증
5. JWT 토큰 생성 (페이로드: userId, email, role)
6. 클라이언트에서 localStorage에 token, user 저장
7. App.tsx에서 user, token State 업데이트
8. is_initial_password가 true면 ChangePasswordModal 표시

#### 6.1.2 자동 로그인
1. App.tsx의 useEffect에서 localStorage 확인
2. token, user 존재 시 State에 설정
3. 모든 API 요청에 Authorization 헤더 포함

#### 6.1.3 비밀번호 변경
1. ChangePasswordModal에서 현재 비밀번호, 새 비밀번호 입력
2. POST /api/auth/change-password 호출
3. 서버에서 현재 비밀번호 검증
4. 새 비밀번호를 bcrypt로 해싱
5. users 테이블 업데이트 (password_hash, is_initial_password = false)
6. 클라이언트에서 user State 업데이트

#### 6.1.4 로그아웃
1. Header에서 로그아웃 버튼 클릭
2. POST /api/auth/logout 호출 (auto_login false 설정)
3. localStorage 클리어
4. user, token State 초기화

---

### 6.2 주간/일일 업무 계획

#### 6.2.1 데이터 흐름
1. 페이지 로드 시 GET /api/weekly-plans 호출
2. 날짜 범위 필터 변경 시 재조회
3. 페이지 변경 시 재조회
4. 관리자는 전체 사용자 데이터 조회
5. 일반 사용자는 본인 데이터만 조회 (user_id 필터)

#### 6.2.2 현장 선택 프로세스
1. SiteSearchInput에 검색어 입력
2. 디바운싱 후 GET /api/sites/search 호출
3. construction_management에서 ILIKE 검색
4. 드롭다운에 결과 표시
5. 현장 선택 시 onSelect 콜백 호출
6. 폼 데이터 자동 채우기 (cms_id, cms_code, site_name, site_address, sales_manager, construction_manager)

#### 6.2.3 활동 구분 선택
- 체크박스 3개 (중복 선택 가능)
  - activity_construction_sales: 건설사 영업
  - activity_site_additional_sales: 현장 추가 영업
  - activity_site_support: 현장 지원
- 선택된 항목만 true로 설정

#### 6.2.4 CRUD 작업
생성:
1. 폼 작성 후 "저장" 버튼 클릭
2. POST /api/weekly-plans 호출
3. created_by에 사용자 이름 저장
4. 목록 재조회

수정:
1. 테이블 행의 "수정" 버튼 클릭
2. 모달에 기존 데이터 로드
3. 수정 후 "저장" 버튼 클릭
4. PUT /api/weekly-plans/:id 호출
5. updated_by에 사용자 이름 저장
6. 목록 재조회

삭제:
1. "삭제" 버튼 클릭
2. 확인 다이얼로그 표시
3. DELETE /api/weekly-plans/:id 호출
4. 목록 재조회

---

### 6.3 영업 활동 관리

#### 6.3.1 이미지 업로드 프로세스
1. 사용자가 파일 선택 (input type="file" multiple)
2. FileReader로 Base64 인코딩
3. attachments 배열에 추가
4. 미리보기 표시
5. POST /api/sales-activities 호출 시 Base64 배열 전송
6. 서버에서 각 Base64를 디코딩
7. Supabase Storage의 sales-activities 버킷에 업로드
   - 경로: `{userId}/{timestamp}_{index}.jpg`
8. 업로드된 URL 배열을 attachments JSONB에 저장

#### 6.3.2 이미지 삭제 프로세스
수정 시:
1. 기존 attachments URL 배열 로드
2. 사용자가 "X" 버튼으로 이미지 제거
3. 새 이미지 추가 가능
4. PUT /api/sales-activities/:id 호출
5. 서버에서 기존 attachments와 새 attachments 비교
6. 삭제된 URL의 파일을 Storage에서 제거
7. 새 Base64 이미지 업로드
8. 업데이트된 URL 배열 저장

삭제 시:
1. DELETE /api/sales-activities/:id 호출
2. 서버에서 attachments 조회
3. Storage에서 모든 파일 삭제
4. 레코드 삭제

#### 6.3.3 현장 구분 로직
기존 현장:
- SiteSearchInput으로 검색
- construction_management에서 자동 로드
- cms_id에 현장 ID 저장 (FK)

신규 현장:
- 현장명, 주소, 고객사 직접 입력
- cms_id는 null
- cms_code도 null 또는 수동 입력

#### 6.3.4 필터링
관리자:
- 사용자 드롭다운 표시 (전체/특정 사용자)
- GET /api/users/list로 사용자 목록 조회
- user_id 파라미터로 필터

일반 사용자:
- 사용자 드롭다운 숨김
- 자동으로 본인 데이터만 조회

공통:
- 연도/월 선택 (activity_date 필터)
- 활동 구분 (activity_type: estimate/contract)
- 현장 구분 (site_type: existing/new)

---

### 6.4 계산서 발행

#### 6.4.1 현장 선택 및 자동 계산
1. SiteSearchInput으로 현장 검색
2. 현장 선택 시 onSelect 콜백 호출
3. construction_management에서 현장 정보 로드
4. cms_code로 site_summary 조회 (GET /api/sites/summary?cms={cms_code})
5. sales_amount, purchase_amount 추출 (문자열, 쉼표 포함)
6. 클라이언트에서 쉼표 제거 후 숫자 변환
7. profit_difference = sales_amount - purchase_amount
8. is_over_invested = profit_difference < 0
9. 폼에 자동 표시 (빨강/초록 색상 코딩)

#### 6.4.2 발행 기록 생성
1. 사용자가 invoice_date, invoice_amount 입력
2. POST /api/invoice-records 호출
3. 서버에서 스냅샷 데이터 저장
   - construction_management 데이터
   - site_summary 데이터
   - 계산된 profit_difference, is_over_invested
4. 목록 재조회

#### 6.4.3 스냅샷 방식의 장점
- ERP 데이터가 변경되어도 과거 발행 기록은 유지
- 발행 시점의 매출/매입 금액 보존
- 감사 추적 (Audit Trail) 가능

---

### 6.5 영업/현장 관리 실행 현황

#### 6.5.1 통계 계산 로직
1. GET /api/activity-stats 호출
2. 서버에서 weekly_plans, daily_plans 조회
3. construction_manager (ILIKE) 또는 user_id로 필터
4. created_at에서 월 추출 (new Date().getMonth() + 1)
5. 월별 카운트 집계
6. 진행률 계산
   - 주간 진행률 = (총 건수 / 52) * 100
   - 일일 진행률 = (총 건수 / 365) * 100
7. 월별 배열 및 요약 반환

#### 6.5.2 차트 시각화
Recharts LineChart 사용:
```tsx
<LineChart data={data.monthly}>
  <XAxis dataKey="month" label={{ value: '월', position: 'insideBottom' }} />
  <YAxis label={{ value: '건수', angle: -90, position: 'insideLeft' }} />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="weeklyCount" stroke="#3b82f6" name="주간 계획" />
  <Line type="monotone" dataKey="dailyCount" stroke="#10b981" name="일일 일지" />
</LineChart>
```

---

### 6.6 월별 매출 및 목표달성

#### 6.6.1 통계 계산 로직
1. GET /api/sales-stats 호출
2. 서버에서 inpays, outpays 조회
3. construction_manager로 필터
4. sales_date, purchase_date에서 연도/월 추출
5. 월별 집계
   - revenue: inpays의 supply_price 합계
   - cost: outpays의 supply_price 합계
   - profit: revenue - cost
6. 연간 요약
   - totalRevenue, totalCost, totalProfit
   - averageProfitRate = (totalProfit / totalRevenue) * 100

#### 6.6.2 차트 시각화
Recharts ComposedChart 사용:
```tsx
<ComposedChart data={data.monthly}>
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip formatter={(value) => formatCurrency(value)} />
  <Legend />
  <Bar dataKey="revenue" fill="#3b82f6" name="매출" />
  <Bar dataKey="cost" fill="#ef4444" name="매입" />
  <Line type="monotone" dataKey="profit" stroke="#10b981" name="이익" strokeWidth={2} />
</ComposedChart>
```

---

### 6.7 수주 실적 및 목표달성률

#### 6.7.1 통계 계산 로직
1. GET /api/order-stats 호출
2. 서버에서 construction_management 조회
3. construction_manager로 필터
4. order_month에서 월 추출
5. execution_rate에 따라 분류
   - execution_rate >= 90: 확정
   - 10 <= execution_rate < 90: 실행 중
   - execution_rate < 10: 예정
6. 각 분류별 집계
   - Revenue: total_contract_amount 합계
   - Profit: (total_contract_amount * (1 - execution_rate/100)) 추정

#### 6.7.2 매출/이익 기여 분석
매출 기여:
- 확정 수주: 계약금액 전체
- 실행 중 수주: 계약금액 * 실행율
- 예정 수주: 계약금액 * 예상 실행율

이익 기여:
- 확정 이익: (매출 - 매입) 실제 값
- 실행 중 이익: (계약금액 - 실행금액) * 실행율
- 예정 이익: (계약금액 - 예상 실행금액) * 예상 실행율

#### 6.7.3 차트 시각화
```tsx
<ComposedChart data={data.monthly}>
  {/* 매출 기여 (Bar) */}
  <Bar dataKey="confirmedRevenue" stackId="revenue" fill="#3b82f6" name="확정 수주" />
  <Bar dataKey="executingRevenue" stackId="revenue" fill="#f59e0b" name="실행 중 수주" />
  <Bar dataKey="expectedRevenue" stackId="revenue" fill="#6b7280" name="예정 수주" />

  {/* 이익 기여 (Line) */}
  <Line type="monotone" dataKey="confirmedProfit" stroke="#10b981" name="확정 이익" />
  <Line type="monotone" dataKey="executingProfit" stroke="#f59e0b" name="실행 중 이익" strokeDasharray="5 5" />
  <Line type="monotone" dataKey="expectedProfit" stroke="#6b7280" name="예정 이익" strokeDasharray="3 3" />
</ComposedChart>
```

---

### 6.8 원가 투입 효율 관리

#### 6.8.1 통계 계산 로직
1. GET /api/cost-efficiency-stats 호출
2. 서버에서 inpays 조회 (construction_manager 필터)
3. sales_date로 연도/월 필터
4. CMS 코드 수집 (Map<월, Set<CMS>>)
5. 각 월별로:
   a. 월별 확정 매출 계산
      - inpays의 supply_price 합계
   b. 과투입 현황 계산
      - 해당 월의 CMS 코드로 site_summary 조회
      - sales_amount - purchase_amount 계산
      - 차액이 음수인 것만 필터
      - 절대값 합계
   c. 편차 계산
      - 과투입 - 확정 매출
6. 12개월 + 누계 반환

#### 6.8.2 금액 파싱 로직
site_summary의 금액은 쉼표 포함 문자열:
```typescript
function parseAmountString(amountStr: string | null | undefined): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
```

#### 6.8.3 테이블 뷰
```tsx
<table>
  <thead>
    <tr>
      <th>월</th>
      <th>과투입 현황 (원)</th>
      <th>월별 확정 매출 (원)</th>
      <th>편차 (원)</th>
    </tr>
  </thead>
  <tbody>
    {data.monthly.map((monthData) => (
      <tr key={monthData.month}>
        <td>{monthData.month}월</td>
        <td className="text-red-500">
          {formatAmount(monthData.overInvestment)}
        </td>
        <td className="text-white">
          {formatAmount(monthData.confirmedRevenue)}
        </td>
        <td className={monthData.difference < 0 ? 'text-red-500' : 'text-green-500'}>
          {formatAmount(monthData.difference)}
        </td>
      </tr>
    ))}
    {/* 누계 행 */}
    <tr className="font-bold border-t-2">
      <td>누계</td>
      <td className="text-red-500">
        {formatAmount(data.summary.totalOverInvestment)}
      </td>
      <td className="text-white">
        {formatAmount(data.summary.totalConfirmedRevenue)}
      </td>
      <td className={data.summary.totalDifference < 0 ? 'text-red-500' : 'text-green-500'}>
        {formatAmount(data.summary.totalDifference)}
      </td>
    </tr>
  </tbody>
</table>
```

---

## 7. 배포 및 운영

### 7.1 개발 환경

#### 7.1.1 로컬 개발 서버 실행
```bash
# 환경 변수 설정
cp .env.example .env
# SUPABASE_URL, SUPABASE_ANON_KEY 입력

# 의존성 설치
bun install

# 개발 서버 실행 (HMR 활성화)
bun run dev
# 또는
PORT=3017 bun run dev

# 브라우저에서 http://localhost:3017 접속
```

#### 7.1.2 데이터베이스 설정
```bash
# Supabase SQL Editor에서 다음 SQL 파일 실행
1. supabase-setup.sql (users 테이블)
2. supabase-weekly-plans.sql (weekly_plans 테이블)
3. supabase-daily-plans.sql (daily_plans 테이블)
4. supabase-sales-activities.sql (sales_activities 테이블)
5. supabase-invoice-records.sql (invoice_records 테이블)

# 사용자 데이터 초기화
bun run db:init
# users.csv 파일에서 사용자 데이터 임포트
```

#### 7.1.3 Supabase Storage 설정
```bash
# Supabase Dashboard > Storage > Create Bucket
Bucket Name: sales-activities
Public: false (인증된 사용자만 접근)

# Policies 설정
1. SELECT: 인증된 사용자 모두
2. INSERT: 인증된 사용자 모두
3. UPDATE: 본인이 업로드한 파일만
4. DELETE: 본인이 업로드한 파일만
```

---

### 7.2 프로덕션 배포 (Railway)

#### 7.2.1 Railway 배포 설정
프로젝트에는 `nixpacks.toml` 파일이 포함되어 있어 Railway에서 자동으로 Bun 런타임을 사용합니다.

```toml
[phases.setup]
nixPkgs = ['bun']

[phases.build]
cmds = ['bun install']

[start]
cmd = 'bun run src/server/index.ts'
```

#### 7.2.2 배포 단계
1. Railway 대시보드에서 "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. 저장소 연결
4. 환경 변수 설정:
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_ANON_KEY`: Supabase Anon Key
   - `NODE_ENV`: production
   - `PORT`: 3000 (Railway 자동 설정)
5. 자동 배포 시작
6. 배포 완료 후 Railway 제공 URL로 접속

#### 7.2.3 자동 배포
- main 브랜치에 push 시 자동 배포
- 빌드 로그 확인 가능
- 롤백 지원

---

### 7.3 Render.com 배포 (대안)

#### 7.3.1 Dockerfile 사용
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["bun", "run", "src/server/index.ts"]
```

#### 7.3.2 render.yaml 설정
```yaml
services:
  - type: web
    name: misung-crm
    env: docker
    plan: free
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: PORT
        value: 10000
```

---

### 7.4 모니터링 및 로깅

#### 7.4.1 서버 로그
Bun 서버는 콘솔 로그를 출력합니다:
```typescript
console.log('🚀 Starting Misung E&C CRM Server...');
console.log(`📁 Environment: ${process.env.NODE_ENV}`);
console.log(`🔌 Port: ${port}`);
console.log(`✅ Server running on 0.0.0.0:${port}`);
```

API 요청 로그:
```typescript
console.log(`GET /api/sales-activities - User: ${userName} Role: ${userRole}`);
console.log(`POST /api/weekly-plans - User: ${userName} Data:`, formData);
```

#### 7.4.2 에러 로그
```typescript
try {
  // API 로직
} catch (error) {
  console.error('Error in /api/endpoint:', error);
  return Response.json({ success: false, message: error.message }, { status: 500 });
}
```

#### 7.4.3 Railway/Render 로그 확인
- Railway: Dashboard > Deployments > Logs
- Render: Dashboard > Logs

---

### 7.5 백업 및 복구

#### 7.5.1 데이터베이스 백업
Supabase는 자동 백업을 제공합니다:
- Point-in-time Recovery (PITR)
- 일일 자동 백업
- 수동 백업 가능

수동 백업:
```bash
# Supabase Dashboard > Database > Backups > Create backup
```

#### 7.5.2 Storage 백업
Supabase Storage는 자동 복제를 제공합니다.

수동 백업:
```bash
# Supabase CLI 사용
supabase storage download sales-activities ./backup/
```

---

### 7.6 성능 최적화

#### 7.6.1 데이터베이스 인덱스
주요 조회 컬럼에 인덱스 설정:
- users: email, role, department
- weekly_plans, daily_plans: user_id, created_at, cms_id
- sales_activities: user_id, activity_date, activity_type
- invoice_records: user_id, invoice_date, cms_id
- construction_management: cms, site_name, status
- inpays, outpays: cms, sales_date, purchase_date
- site_summary: cms, site_name, status

#### 7.6.2 쿼리 최적화
- 페이지네이션 사용 (LIMIT, OFFSET)
- 필요한 컬럼만 SELECT
- 인덱스 활용한 WHERE 조건
- 배치 INSERT (100개씩)

#### 7.6.3 프론트엔드 최적화
- Vite 빌드 최적화 (코드 스플리팅, 트리 쉐이킹)
- 이미지 최적화 (Base64 → WebP 변환 고려)
- 디바운싱 (검색 입력)
- React.memo 사용 (필요시)

---

## 8. 결론

### 8.1 구현 완료 기능
1. 인증 시스템 (로그인, 비밀번호 변경, 자동 로그인)
2. 주간 업무 계획 관리
3. 일일 업무 일지 관리
4. 영업 활동 관리 (이미지 첨부)
5. 계산서 발행 관리
6. 영업/현장 관리 실행 현황 대시보드
7. 월별 매출 및 목표달성 대시보드
8. 수주 실적 및 목표달성률 대시보드
9. 원가 투입 효율 관리 대시보드

### 8.2 기술적 성과
- Bun 런타임 활용으로 빠른 개발 및 실행 속도
- Supabase를 활용한 안정적인 데이터 관리 및 Storage 연동
- TypeScript로 타입 안정성 확보
- Tailwind CSS로 일관된 디자인 시스템 구축
- Recharts를 활용한 직관적인 데이터 시각화
- JWT 기반 인증 및 RLS를 통한 보안 강화
- 스냅샷 방식으로 데이터 무결성 보장

---

## 부록

### A. 환경 변수 목록
```
SUPABASE_URL=https://dmyhhbvhbpwwtrmequop.supabase.co
SUPABASE_ANON_KEY=<Supabase Anon Key>
PORT=3017
NODE_ENV=development
```

### B. 주요 명령어
```bash
# 개발 서버 실행
bun run dev

# 프로덕션 서버 실행
bun run start

# 데이터베이스 초기화 (사용자 임포트)
bun run db:init

# 의존성 설치
bun install

# TypeScript 컴파일 확인
bun run tsc --noEmit
```

### C. API 엔드포인트 목록
```
POST   /api/auth/login
POST   /api/auth/change-password
POST   /api/auth/logout

GET    /api/weekly-plans
POST   /api/weekly-plans
PUT    /api/weekly-plans/:id
DELETE /api/weekly-plans/:id

GET    /api/daily-plans
POST   /api/daily-plans
PUT    /api/daily-plans/:id
DELETE /api/daily-plans/:id

GET    /api/sales-activities
POST   /api/sales-activities
PUT    /api/sales-activities/:id
DELETE /api/sales-activities/:id
GET    /api/sales-activities/users

GET    /api/invoice-records
POST   /api/invoice-records
PUT    /api/invoice-records/:id
DELETE /api/invoice-records/:id

GET    /api/activity-stats
GET    /api/sales-stats
GET    /api/order-stats
GET    /api/cost-efficiency-stats

GET    /api/sites/search
GET    /api/users/list
```

### D. 데이터베이스 테이블 목록
```
사용자 생성 데이터:
- users (사용자)
- weekly_plans (주간 업무 계획)
- daily_plans (일일 업무 일지)
- sales_activities (영업 활동)
- invoice_records (계산서 발행)

ERP 동기화 데이터:
- construction_management (현장관리)
- inpays (매출)
- outpays (매입)
- site_summary (현장 요약)
```

---

문서 버전: 1.0.0
작성일: 2025-10-30
