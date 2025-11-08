# API 디버깅 헬퍼

사용자가 어떤 API에 문제가 있는지 확인하세요.

## 단계별 디버깅

### 1. 로그 확인
서버 로그를 확인하여 어떤 에러가 발생했는지 파악하세요.
BashOutput 도구를 사용하여 최신 로그를 확인하세요.

### 2. API 파일 확인
해당 API 파일 (src/server/{api-name}.ts)을 읽고:
- 쿼리 조건 확인
- 필터링 로직 확인
- 에러 처리 확인

### 3. 디버그 로그 추가
문제가 발생한 부분에 console.log 추가:
```typescript
console.log('🔍 [api-name] Description:', variable);
console.log('✅ [api-name] Query result:', data);
console.error('❌ [api-name] Error:', error);
```

### 4. 서버 재시작
변경사항을 반영하려면:
```bash
pkill -9 -f "bun.*src/server/index.ts"
PORT=3017 bun run dev
```

### 5. 데이터 확인
필요시 Supabase에서 직접 쿼리하여 데이터 확인:
```sql
SELECT * FROM table_name WHERE condition LIMIT 10;
```

### 6. 일반적인 문제들

**목표 데이터가 0으로 나오는 경우:**
- weekly_plans 쿼리에서 plan_type 필터 확인
- created_by vs sales_manager 확인
- 날짜 범위 확인

**권한 에러:**
- user.role 확인
- created_by vs user.name 확인

**데이터 형식 에러:**
- site_summary의 금액은 문자열 (쉼표 포함)
- 숫자 변환 필요

문제를 찾으면 수정하고, 디버그 로그는 문제 해결 후 제거하세요.
