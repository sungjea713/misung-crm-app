# 미성이앤씨 CRM - 프로젝트 문서

이 디렉토리는 Claude Code의 토큰 사용을 최적화하기 위한 빠른 참조 문서입니다.

## 문서 목록

### 1. [DATABASE.md](DATABASE.md)
데이터베이스 스키마 전체 구조
- 모든 테이블 정의
- 컬럼 타입 및 용도
- 데이터 관계 및 조회 흐름
- 중요 쿼리 패턴
- 마이그레이션 파일

**언제 사용**: DB 구조 확인, 새 테이블/컬럼 추가, 쿼리 작성

### 2. [FEATURES.md](FEATURES.md)
페이지별 기능 상세 가이드
- 모든 페이지 설명 (실적 관리, 통계 분석)
- API 엔드포인트 목록
- 데이터 소스 및 통계 계산 로직
- 컴포넌트 구조

**언제 사용**: 기능 추가/수정, API 확인, 페이지 로직 이해

### 3. [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
자주 사용하는 작업 패턴
- 파일 구조 빠른 참조
- 일반적인 작업 패턴 (필드 추가, 통계 페이지 추가, 필터 수정)
- 디버깅 팁
- 주의사항

**언제 사용**: 일상적인 개발 작업, 디버깅, 빠른 참조

## 사용 방법

새로운 대화를 시작할 때 이 파일들을 읽어서 프로젝트 컨텍스트를 빠르게 파악하세요:

```
"먼저 .claude/docs/QUICK-REFERENCE.md를 읽어줘"
"DATABASE.md에서 weekly_plans 테이블 구조를 확인해줘"
"FEATURES.md에서 수주 실적 통계 로직을 설명해줘"
```

## 문서 업데이트

프로젝트에 중요한 변경사항이 있을 때 이 문서들을 업데이트하세요:
- 새 테이블/컬럼 추가
- 새 페이지/기능 추가
- 주요 로직 변경
- 자주 겪는 문제의 해결책

## 프로젝트 개요

**기술 스택**:
- Runtime: Bun
- Backend: Bun.serve() with routes
- Frontend: React + TypeScript
- Database: Supabase (PostgreSQL)
- Deployment: Railway

**주요 디렉토리**:
```
src/
├── frontend/
│   ├── pages/          페이지 컴포넌트
│   ├── components/     재사용 컴포넌트
│   ├── types/          TypeScript 타입
│   └── hooks/          React Hooks
└── server/             백엔드 API
```

**개발 서버**:
```bash
PORT=3017 bun run dev
```

**최근 주요 변경**:
- **2025-11-09**: 수금 관리 기능 추가
  - collections 테이블 (수금 내역 기록)
  - monthly_collection 테이블 (관리자 월별 수금/미수금 업로드)
  - 수금 실적 및 미수금 관리 현황 페이지
  - 다중 지점 데이터 관리 개선
  - 주간 계획에 target_collection (목표 수금) 추가
- **2025-01-08**: 주간 계획 분리
  - weekly_plans에 plan_type 추가
  - 목표 활동/목표 금액 분리
  - 수주 실적 API 목표 조회 개선
