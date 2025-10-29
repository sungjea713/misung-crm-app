import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlySales {
  month: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface SalesStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlySales[];
    summary: {
      revenue: number;
      cost: number;
      profit: number;
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

    // 월별 집계 맵 초기화 (1-12월)
    const monthlyMap = new Map<number, { revenue: number; cost: number }>();
    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, { revenue: 0, cost: 0 });
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

    // 월별 데이터 배열로 변환 및 이익 계산
    const monthly: MonthlySales[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
      }))
      .sort((a, b) => a.month - b.month);

    // 전체 합계 계산
    const summary = {
      revenue: 0,
      cost: 0,
      profit: 0,
    };

    monthly.forEach((m) => {
      summary.revenue += m.revenue;
      summary.cost += m.cost;
      summary.profit += m.profit;
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
