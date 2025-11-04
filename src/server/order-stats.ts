import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlyOrderData {
  month: number;
  salesContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  profitContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  total: {
    order: number;
    execution: number;
    profit: number;
  };
}

interface OrderStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyOrderData[];
    summary: {
      salesContribution: {
        order: number;
        execution: number;
        profit: number;
      };
      profitContribution: {
        order: number;
        execution: number;
        profit: number;
      };
      total: {
        order: number;
        execution: number;
        profit: number;
      };
    };
  };
  message?: string;
}

export async function getOrderStats(year: number, userName: string): Promise<OrderStatsResponse> {
  try {
    // 1. site_summary에서 사용자 매칭하여 cms 코드 추출
    const { data: siteSummary, error: siteError } = await supabase
      .from('site_summary')
      .select('cms, expected_execution_rate')
      .ilike('sales_manager', `${userName}%`);

    if (siteError) {
      console.error('Error fetching site_summary:', siteError);
      return { success: false, message: '현장 정보를 불러오지 못했습니다.' };
    }

    if (!siteSummary || siteSummary.length === 0) {
      // 데이터가 없어도 빈 결과 반환
      return createEmptyResponse();
    }

    // 2. 매출 기여와 이익 기여로 cms 코드 분류
    const salesCmsList: string[] = [];
    const profitCmsList: string[] = [];

    siteSummary.forEach((row: any) => {
      const rate = row.expected_execution_rate || 0;

      // 매출 기여: 실행률 >= 90 OR 실행률 = 0
      if (rate >= 90 || rate === 0) {
        salesCmsList.push(row.cms);
      }

      // 이익 기여: 실행률 < 90 AND 실행률 != 0
      if (rate < 90 && rate !== 0) {
        profitCmsList.push(row.cms);
      }
    });

    // 3. construction_management에서 매출 기여 데이터 조회
    const salesData = await fetchOrderData(salesCmsList, year);

    // 4. construction_management에서 이익 기여 데이터 조회
    const profitData = await fetchOrderData(profitCmsList, year);

    // 5. 월별 집계
    const monthlyMap = new Map<number, MonthlyOrderData>();
    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, {
        month,
        salesContribution: { order: 0, execution: 0, profit: 0 },
        profitContribution: { order: 0, execution: 0, profit: 0 },
        total: { order: 0, execution: 0, profit: 0 },
      });
    }

    // 매출 기여 데이터 집계
    salesData.forEach((row: any) => {
      const month = extractMonth(row.order_month);
      if (month >= 1 && month <= 12) {
        const current = monthlyMap.get(month)!;
        current.salesContribution.order += row.order_amount || 0;
        current.salesContribution.execution += row.execution_amount || 0;
      }
    });

    // 이익 기여 데이터 집계
    profitData.forEach((row: any) => {
      const month = extractMonth(row.order_month);
      if (month >= 1 && month <= 12) {
        const current = monthlyMap.get(month)!;
        current.profitContribution.order += row.order_amount || 0;
        current.profitContribution.execution += row.execution_amount || 0;
      }
    });

    // 예정 이익 및 합계 계산
    monthlyMap.forEach((data) => {
      // 예정 이익 = 확정 수주 - 실행
      data.salesContribution.profit =
        data.salesContribution.order - data.salesContribution.execution;
      data.profitContribution.profit =
        data.profitContribution.order - data.profitContribution.execution;

      // 합계 계산
      data.total.order = data.salesContribution.order + data.profitContribution.order;
      data.total.execution = data.salesContribution.execution + data.profitContribution.execution;
      data.total.profit = data.salesContribution.profit + data.profitContribution.profit;
    });

    // 6. 배열로 변환 및 정렬
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month - b.month);

    // 7. 전체 합계 계산
    const summary = {
      salesContribution: { order: 0, execution: 0, profit: 0 },
      profitContribution: { order: 0, execution: 0, profit: 0 },
      total: { order: 0, execution: 0, profit: 0 },
    };

    monthly.forEach((m) => {
      summary.salesContribution.order += m.salesContribution.order;
      summary.salesContribution.execution += m.salesContribution.execution;
      summary.salesContribution.profit += m.salesContribution.profit;

      summary.profitContribution.order += m.profitContribution.order;
      summary.profitContribution.execution += m.profitContribution.execution;
      summary.profitContribution.profit += m.profitContribution.profit;

      summary.total.order += m.total.order;
      summary.total.execution += m.total.execution;
      summary.total.profit += m.total.profit;
    });

    return {
      success: true,
      data: {
        monthly,
        summary,
      },
    };
  } catch (error: any) {
    console.error('Error in getOrderStats:', error);
    return { success: false, message: error.message || '수주 통계 데이터를 불러오지 못했습니다.' };
  }
}

// construction_management에서 데이터 조회 헬퍼 함수
async function fetchOrderData(cmsList: string[], year: number): Promise<any[]> {
  if (cmsList.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('construction_management')
    .select('cms, order_month, order_amount, execution_amount')
    .in('cms', cmsList)
    .gte('order_month', `${year}-01`)
    .lt('order_month', `${year + 1}-01`);

  if (error) {
    console.error('Error fetching construction_management:', error);
    return [];
  }

  return data || [];
}

// order_month에서 월 추출 (예: "2025-03" -> 3)
function extractMonth(orderMonth: string | null): number {
  if (!orderMonth) return 0;

  try {
    // "2025-03" 형식 또는 "2025-03-15" 형식 모두 처리
    const parts = orderMonth.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      return month;
    }
  } catch (error) {
    console.error('Invalid order_month format:', orderMonth);
  }

  return 0;
}

// 빈 응답 생성
function createEmptyResponse(): OrderStatsResponse {
  const monthly: MonthlyOrderData[] = [];
  for (let month = 1; month <= 12; month++) {
    monthly.push({
      month,
      salesContribution: { order: 0, execution: 0, profit: 0 },
      profitContribution: { order: 0, execution: 0, profit: 0 },
      total: { order: 0, execution: 0, profit: 0 },
    });
  }

  return {
    success: true,
    data: {
      monthly,
      summary: {
        salesContribution: { order: 0, execution: 0, profit: 0 },
        profitContribution: { order: 0, execution: 0, profit: 0 },
        total: { order: 0, execution: 0, profit: 0 },
      },
    },
  };
}
