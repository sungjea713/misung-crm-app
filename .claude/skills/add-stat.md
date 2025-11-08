# 새 통계 페이지 추가 가이드

사용자가 어떤 통계를 추가하고 싶은지 확인하세요.

필요한 정보:
1. 통계 페이지 이름
2. 표시할 데이터 (어떤 테이블에서 어떤 데이터)
3. 집계 방법 (월별, 사용자별 등)

확인 후 다음 단계를 수행하세요:

## Step 1: TypeScript 타입 정의
`src/frontend/types/index.ts`에 통계 타입 추가:
```typescript
export interface MonthlyNewStats {
  month: number;
  // 통계 필드들
}

export interface NewStatsSummary {
  // 합계 필드들
}

export interface NewStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyNewStats[];
    summary: NewStatsSummary;
  };
  message?: string;
}
```

## Step 2: 백엔드 API 생성
`src/server/new-stats.ts` 파일 생성:
```typescript
export async function getNewStats(year: number, userName: string) {
  // 1. 데이터 조회
  // 2. 월별 집계
  // 3. 연도 합계
  return { success: true, data: { monthly, summary } };
}
```

## Step 3: 라우팅 추가
`src/server/index.ts`에 엔드포인트 추가:
```typescript
"/api/new-stats": {
  GET: async (req) => {
    const year = parseInt(url.searchParams.get('year'));
    const userName = url.searchParams.get('user_name');
    const stats = await getNewStats(year, userName);
    return Response.json(stats);
  },
}
```

## Step 4: 프론트엔드 페이지 생성
`src/frontend/pages/analytics/NewStats.tsx` 파일 생성:
- useState로 데이터, 연도, 사용자 상태 관리
- fetchStats 함수로 API 호출
- 월별 테이블 표시
- 합계 카드 표시

## Step 5: 메뉴 추가
`src/frontend/App.tsx`의 analyticsMenu에 추가:
```typescript
{
  id: 'new-stats',
  label: '새 통계 이름',
  icon: BarChart,
  path: '/analytics/new-stats',
}
```

## Step 6: 라우트 추가
`src/frontend/App.tsx`의 Routes에 추가:
```typescript
<Route path="/analytics/new-stats" element={<NewStats />} />
```

모든 단계를 완료한 후 변경사항을 git에 커밋하세요.
