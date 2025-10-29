# 미성 E&C CRM

미성 E&C 영업 및 현장 관리를 위한 CRM 시스템

## 기술 스택

- **Runtime**: Bun
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Bun.serve()
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (이미지 파일)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Render.com

## 주요 기능

### 1. 인증 시스템
- ✅ 이메일 + 비밀번호 로그인
- ✅ 초기 비밀번호(1234) 강제 변경
- ✅ 자동 로그인 기능
- ✅ Role 기반 접근 제어 (admin/user)

### 2. 실적 입력
- ✅ 주간 업무 계획 작성
- ✅ 일일 업무 계획 작성
- ✅ 영업 활동 관리 (Supabase Storage 연동)
  - 견적서/계약서 구분
  - 현장 검색 및 자동완성
  - 이미지 첨부 (Supabase Storage)
  - 금액 및 실행률 관리
- ✅ 계산서 발행
  - 현장 검색 및 선택
  - 매출/매입 금액 자동 조회 (site_summary 연동)
  - 차액 및 과투입 여부 자동 계산
  - 계산서 금액 및 발행일 관리
- ⏳ 수금 관리

### 3. 분석 대시보드
- ✅ 월별 매출 및 목표달성 현황
  - 월별 매출/매입/이익 차트
  - 년도별, 사용자별 필터
  - Recharts 시각화
- ✅ 수주 실적 및 목표 달성률
  - 매출 기여 / 이익 기여 분석 (실행율 기준)
  - 월별 확정 수주, 실행, 예정 이익
  - 요약 카드 및 추이 차트
- ✅ 영업/현장 관리 실행 현황
  - 주간/일일 계획 통계
  - 진행률 및 완료율 분석
- ✅ 원가 투입 효율 관리
  - 과투입 현황 분석 (매출금액 - 매입금액 < 0)
  - 월별 확정 매출 집계 (inpays 기준)
  - 편차 계산 (과투입 - 확정매출)
  - 연도별, 사용자별 필터
- ⏳ 수금 실적 및 미수금 관리

## 시작하기

### 필수 요구사항

- [Bun](https://bun.sh/) (v1.0 이상)
- Supabase 계정 및 프로젝트

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

\`\`\`env
SUPABASE_URL=https://dmyhhbvhbpwwtrmequop.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
NODE_ENV=development
\`\`\`

### 2. Supabase 데이터베이스 설정

Supabase SQL 에디터에서 `supabase-setup.sql` 파일을 실행하여 users 테이블을 생성하세요:

\`\`\`bash
# SQL 파일 내용을 Supabase SQL Editor에 복사하여 실행
cat supabase-setup.sql
\`\`\`

### 3. 의존성 설치

\`\`\`bash
bun install
\`\`\`

### 4. 서버 실행

\`\`\`bash
# 개발 모드 (HMR 활성화)
bun run dev

# 프로덕션 모드
bun run start
\`\`\`

서버가 `http://localhost:3000` 에서 실행됩니다.

### 5. 사용자 초기화

서버를 처음 실행하면 `users.csv` 파일의 데이터가 자동으로 Supabase에 임포트됩니다.

## 로그인 정보

### 초기 비밀번호
모든 사용자의 초기 비밀번호는 `1234`입니다.

### 관리자 계정
- 김성재 (example@misung.co.kr)
- 박진주 (example@misung.co.kr)

## 프로젝트 구조

\`\`\`
misung-crm-app/
├── src/
│   ├── frontend/              # 프론트엔드 코드
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── ChangePasswordModal.tsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── performance/   # 실적 입력 페이지
│   │   │   └── analytics/     # 분석 대시보드 페이지
│   │   ├── lib/               # 라이브러리
│   │   ├── types/             # TypeScript 타입
│   │   ├── styles/            # CSS 스타일
│   │   ├── App.tsx            # 메인 앱
│   │   ├── index.tsx          # 엔트리 포인트
│   │   └── index.html         # HTML 템플릿
│   └── server/                # 백엔드 코드
│       ├── index.ts           # Bun 서버
│       ├── auth.ts            # 인증 로직
│       └── db/
│           └── init.ts        # DB 초기화
├── users.csv                  # 사용자 데이터
├── supabase-setup.sql         # Supabase 테이블 생성 SQL
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── render.yaml                # Render.com 배포 설정
├── Dockerfile                 # Docker 설정
└── README.md
\`\`\`

## 배포 (Render.com)

### 1. Render.com에서 새 Web Service 생성

1. Render.com 대시보드에서 "New +" 버튼 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결

### 2. 환경 변수 설정

Render.com 대시보드에서 다음 환경 변수를 설정하세요:

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase Anon Key
- `NODE_ENV`: production
- `PORT`: 10000 (Render.com 기본값)

### 3. 배포 설정

- **Build Command**: `curl -fsSL https://bun.sh/install | bash && export PATH=$HOME/.bun/bin:$PATH && bun install`
- **Start Command**: `bun run src/server/index.ts`
- **Environment**: Docker

또는 `render.yaml` 파일이 자동으로 설정을 적용합니다.

## 개발 가이드

### 새 페이지 추가

1. `src/frontend/pages/` 에 새 페이지 컴포넌트 생성
2. `src/frontend/App.tsx` 의 `renderPage()` 함수에 라우팅 추가
3. `src/frontend/components/Sidebar.tsx` 에 메뉴 항목 추가

### API 엔드포인트 추가

1. `src/server/index.ts` 에 새 라우트 추가
2. 필요시 `src/server/` 에 새 핸들러 파일 생성

### 스타일 수정

- Tailwind CSS 사용
- 색상 테마: `tailwind.config.js` 에서 수정
- 글로벌 스타일: `src/frontend/styles/globals.css`

## 최근 업데이트

### 2025-10-30
- ✅ 영업 활동 관리 기능 구현
  - Supabase Storage 연동으로 이미지 업로드
  - 파일 자동 정리 (삭제 시, 수정 시)
  - 현장 검색 및 자동완성
  - 사용자별 필터링 (admin/user)
- ✅ 수주 실적 및 목표 달성률 페이지 구현
  - 매출 기여 / 이익 기여 분석 (실행율 90% 기준)
  - 월별 확정 수주, 실행, 예정 이익 집계
  - Recharts 시각화 (요약 카드 + 추이 차트)
  - site_summary & construction_management 테이블 연동

## 최근 업데이트

### 2025-10-30
- ✅ **원가 투입 효율 관리 기능 구현**
  - 과투입 현황 분석: site_summary 테이블에서 매출-매입 차액이 음수인 현장 집계
  - 월별 확정 매출: inpays 테이블에서 시공담당자별 supply_price 합산
  - 편차 계산: 과투입(절대값) - 확정매출
  - 12개월 + 누계 테이블 뷰
  - 연도 필터 (최근 6년)
  - Admin 사용자 필터 (admin은 전체 사용자, 일반 사용자는 본인만)
  - 색상 코딩: 과투입(빨강), 편차(빨강/초록)

- ✅ **계산서 발행 기능 구현**
  - 현장 검색 및 선택 UI (SiteSearchInput 재사용)
  - site_summary 테이블 연동으로 매출/매입 금액 자동 조회
  - 차액(매출-매입) 및 과투입 여부 자동 계산
  - 계산서 발행일 및 금액 입력
  - CRUD 작업 (생성, 조회, 수정, 삭제)
  - 연도/월별 필터링 및 페이지네이션
  - Admin/일반 사용자 권한 분리

## 다음 단계 (개발 예정)

- [ ] 수금 관리 기능
- [ ] 수금 실적 및 미수금 관리 대시보드
- [ ] Admin 전용 기능 (사용자 관리)
- [ ] 모바일 최적화
- [ ] 실시간 데이터 업데이트 (Supabase Realtime)

## 라이선스

Private - 미성 E&C 내부 사용

## 디자인 가이드

### 색상 접근성 가이드라인
프로젝트의 색상 사용 및 접근성 기준은 [COLOR_GUIDELINES.md](COLOR_GUIDELINES.md) 문서를 참고하세요.

주요 원칙:
- 밝은 배경(Primary Green)에는 어두운 텍스트 사용
- 어두운 배경에는 밝은 텍스트 사용
- WCAG 2.1 기준 준수 (최소 4.5:1 대비율)
- 체크박스와 아이콘은 배경색에 따라 적절한 색상 선택

