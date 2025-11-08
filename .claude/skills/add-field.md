# 새 필드 추가 가이드

사용자가 어떤 테이블에 어떤 필드를 추가하고 싶은지 확인하세요.

필요한 정보:
1. 테이블명
2. 필드명
3. 필드 타입
4. 기본값 (옵션)

확인 후 다음 단계를 수행하세요:

## Step 1: SQL 마이그레이션 파일 생성
`supabase-{table-name}-add-{field-name}.sql` 파일을 생성하고:
```sql
ALTER TABLE table_name ADD COLUMN field_name type DEFAULT value;
COMMENT ON COLUMN table_name.field_name IS '설명';
```

사용자에게 Supabase SQL Editor에서 실행하라고 안내하세요.

## Step 2: TypeScript 타입 업데이트
`src/frontend/types/index.ts`에서 해당 인터페이스에 필드 추가

## Step 3: 폼 컴포넌트 업데이트
해당 폼 컴포넌트 (예: WeeklyPlanForm.tsx)에서:
- formData 상태에 필드 추가
- 입력 필드 UI 추가

## Step 4: 테이블 컴포넌트 업데이트
해당 테이블 컴포넌트 (예: WeeklyPlanTable.tsx)에서:
- 컬럼 추가
- 데이터 표시

## Step 5: API 업데이트
해당 서버 파일 (예: weekly-plans.ts)에서:
- INSERT/UPDATE 쿼리에 필드 추가
- SELECT 쿼리에 필드 추가

모든 단계를 완료한 후 변경사항을 git에 커밋하세요.
