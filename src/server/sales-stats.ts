import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlySales {
  month: number;
  revenue: number;
  cost: number;
  profit: number;
  targetSales: number;
}

interface SalesStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlySales[];
    summary: {
      revenue: number;
      cost: number;
      profit: number;
      targetSales: number;
    };
  };
  message?: string;
}

export async function getSalesStats(year: number, userName: string): Promise<SalesStatsResponse> {
  try {
    // 매출 데이터 집계 (inpays 테이블)
    // ilike 사용하여 "송기정(In)" 같은 형식도 매칭
    const { data: inpaysData, error: inpaysError } = await supabase
      .from('inpays')
      .select('sales_date, supply_price')
      .ilike('construction_manager', `${userName}%`)
      .gte('sales_date', `${year}-01-01`)
      .lt('sales_date', `${year + 1}-01-01`);

    if (inpaysError) {
      console.error('Error fetching inpays:', inpaysError);
      return { success: false, message: '매출 데이터를 불러오지 못했습니다.' };
    }

    // 매입 데이터 집계 (outpays 테이블)
    // ilike 사용하여 "송기정(In)" 같은 형식도 매칭
    const { data: outpaysData, error: outpaysError} = await supabase
      .from('outpays')
      .select('purchase_date, supply_price')
      .ilike('construction_manager', `${userName}%`)
      .gte('purchase_date', `${year}-01-01`)
      .lt('purchase_date', `${year + 1}-01-01`);

    if (outpaysError) {
      console.error('Error fetching outpays:', outpaysError);
      return { success: false, message: '매입 데이터를 불러오지 못했습니다.' };
    }

    // 목표 매출 데이터 집계 (weekly_plans 테이블)
    // created_by로 사용자 매칭 (작성자 기준)
    // plan_type이 'target' 또는 'both'인 레코드만 조회
    const { data: weeklyPlansData, error: weeklyPlansError } = await supabase
      .from('weekly_plans')
      .select('created_at, target_sales')
      .eq('created_by', userName)
      .in('plan_type', ['target', 'both'])
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (weeklyPlansError) {
      console.error('Error fetching weekly_plans:', weeklyPlansError);
      // 목표 매출 조회 실패 시 경고만 출력하고 계속 진행
    }

    // 월별 집계 맵 초기화 (1-12월)
    const monthlyMap = new Map<number, { revenue: number; cost: number; targetSales: number }>();
    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, { revenue: 0, cost: 0, targetSales: 0 });
    }

    // 매출 데이터 집계
    inpaysData?.forEach((row: any) => {
      if (row.sales_date && row.supply_price) {
        try {
          const date = new Date(row.sales_date);
          const month = date.getMonth() + 1; // 1-12
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.revenue += row.supply_price || 0;
          }
        } catch (error) {
          console.error('Invalid sales_date:', row.sales_date);
        }
      }
    });

    // 매입 데이터 집계
    outpaysData?.forEach((row: any) => {
      if (row.purchase_date && row.supply_price) {
        try {
          const date = new Date(row.purchase_date);
          const month = date.getMonth() + 1; // 1-12
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.cost += row.supply_price || 0;
          }
        } catch (error) {
          console.error('Invalid purchase_date:', row.purchase_date);
        }
      }
    });

    // 목표 매출 데이터 집계
    weeklyPlansData?.forEach((row: any) => {
      if (row.created_at && row.target_sales) {
        try {
          const date = new Date(row.created_at);
          const month = date.getMonth() + 1; // 1-12
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.targetSales += row.target_sales || 0;
          }
        } catch (error) {
          console.error('Invalid created_at:', row.created_at);
        }
      }
    });

    // 월별 데이터 배열로 변환 및 이익 계산
    const monthly: MonthlySales[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
        targetSales: data.targetSales,
      }))
      .sort((a, b) => a.month - b.month);

    // 전체 합계 계산
    const summary = {
      revenue: 0,
      cost: 0,
      profit: 0,
      targetSales: 0,
    };

    monthly.forEach((m) => {
      summary.revenue += m.revenue;
      summary.cost += m.cost;
      summary.profit += m.profit;
      summary.targetSales += m.targetSales;
    });

    return {
      success: true,
      data: {
        monthly,
        summary,
      },
    };
  } catch (error: any) {
    console.error('Error in getSalesStats:', error);
    return { success: false, message: error.message || '통계 데이터를 불러오지 못했습니다.' };
  }
}
