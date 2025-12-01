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
  targetSalesContribution: number;
  targetProfitContribution: number;
  targetTotal: number;
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
      targetSalesContribution: number;
      targetProfitContribution: number;
      targetTotal: number;
    };
  };
  message?: string;
}

export async function getOrderStats(year: number, userName: string, showAllBranches: boolean = false): Promise<OrderStatsResponse> {
  try {
    console.log('⭐⭐⭐ [order-stats] START - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

    // Check if this is a multi-branch user
    const isMultiBranch = userName === '송기정' || userName === '김태현';

    // 1. site_summary에서 사용자 매칭하여 cms 코드 추출
    let siteSummaryQuery = supabase
      .from('site_summary')
      .select('cms, expected_execution_rate');

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `sales_manager.eq."${userName}",sales_manager.eq."${userName}(In)"`;
      siteSummaryQuery = siteSummaryQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      siteSummaryQuery = siteSummaryQuery.eq('sales_manager', userName);
    }

    const { data: siteSummary, error: siteError } = await siteSummaryQuery;

    if (siteError) {
      console.error('❌ [order-stats] Error fetching site_summary:', siteError);
      return { success: false, message: '현장 정보를 불러오지 못했습니다.' };
    }

    console.log('📋 [order-stats] Found', siteSummary?.length || 0, 'sites in site_summary');

    if (!siteSummary || siteSummary.length === 0) {
      console.log('⚠️ [order-stats] No sites found, but continuing to check weekly_plans...');
      // 데이터가 없어도 빈 결과 반환하지 않고 weekly_plans 조회는 계속 진행
      // return createEmptyResponse();
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

    // 5. weekly_plans에서 목표 수주 데이터 조회
    console.log('🔍 [order-stats] Querying weekly_plans for user:', userName, 'year:', year);
    let weeklyPlansQuery = supabase
      .from('weekly_plans')
      .select('created_at, target_order_sales_contribution, target_order_profit_contribution, plan_type, created_by')
      .in('plan_type', ['target', 'both'])
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `created_by.eq."${userName}",created_by.eq."${userName}(In)"`;
      weeklyPlansQuery = weeklyPlansQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      weeklyPlansQuery = weeklyPlansQuery.eq('created_by', userName);
    }

    const { data: weeklyPlansData, error: weeklyPlansError } = await weeklyPlansQuery;

    if (weeklyPlansError) {
      console.error('❌ [order-stats] Error fetching weekly_plans:', weeklyPlansError);
      // 목표 수주 조회 실패 시 경고만 출력하고 계속 진행
    } else {
      console.log('✅ [order-stats] Found', weeklyPlansData?.length || 0, 'weekly plans');
      console.log('📊 [order-stats] Weekly plans data:', JSON.stringify(weeklyPlansData, null, 2));
    }

    // 6. 월별 집계
    const monthlyMap = new Map<number, MonthlyOrderData>();
    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, {
        month,
        salesContribution: { order: 0, execution: 0, profit: 0 },
        profitContribution: { order: 0, execution: 0, profit: 0 },
        total: { order: 0, execution: 0, profit: 0 },
        targetSalesContribution: 0,
        targetProfitContribution: 0,
        targetTotal: 0,
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

    // 목표 수주 데이터 집계
    weeklyPlansData?.forEach((row: any) => {
      if (row.created_at) {
        try {
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.created_at);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.targetSalesContribution += row.target_order_sales_contribution || 0;
            current.targetProfitContribution += row.target_order_profit_contribution || 0;
          }
        } catch (error) {
          console.error('Invalid created_at:', row.created_at);
        }
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

      // 목표 합계 계산
      data.targetTotal = data.targetSalesContribution + data.targetProfitContribution;
    });

    // 6. 배열로 변환 및 정렬
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month - b.month);

    // 7. 전체 합계 계산
    const summary = {
      salesContribution: { order: 0, execution: 0, profit: 0 },
      profitContribution: { order: 0, execution: 0, profit: 0 },
      total: { order: 0, execution: 0, profit: 0 },
      targetSalesContribution: 0,
      targetProfitContribution: 0,
      targetTotal: 0,
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

      summary.targetSalesContribution += m.targetSalesContribution;
      summary.targetProfitContribution += m.targetProfitContribution;
      summary.targetTotal += m.targetTotal;
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
      targetSalesContribution: 0,
      targetProfitContribution: 0,
      targetTotal: 0,
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
        targetSalesContribution: 0,
        targetProfitContribution: 0,
        targetTotal: 0,
      },
    },
  };
}
