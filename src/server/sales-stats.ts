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

export async function getSalesStats(year: number, userName: string, showAllBranches: boolean = false): Promise<SalesStatsResponse> {
  try {
    console.log('📊 [sales-stats] START - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

    // Check if this is a multi-branch user
    const isMultiBranch = userName === '송기정' || userName === '김태현';
    console.log('🔍 [sales-stats] isMultiBranch:', isMultiBranch);

    // 매출 데이터 집계 (inpays 테이블)
    let inpaysQuery = supabase
      .from('inpays')
      .select('sales_date, supply_price')
      .gte('sales_date', `${year}-01-01`)
      .lt('sales_date', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `construction_manager.eq."${userName}",construction_manager.eq."${userName}(In)"`;
      console.log('✅ [sales-stats] Using OR query for inpays:', orCondition);
      inpaysQuery = inpaysQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      console.log('📌 [sales-stats] Using exact match for inpays:', userName);
      inpaysQuery = inpaysQuery.eq('construction_manager', userName);
    }

    const { data: inpaysData, error: inpaysError } = await inpaysQuery;

    if (inpaysError) {
      console.error('Error fetching inpays:', inpaysError);
      return { success: false, message: '매출 데이터를 불러오지 못했습니다.' };
    }

    // 매입 데이터 집계 (outpays 테이블)
    let outpaysQuery = supabase
      .from('outpays')
      .select('purchase_date, supply_price')
      .gte('purchase_date', `${year}-01-01`)
      .lt('purchase_date', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `construction_manager.eq."${userName}",construction_manager.eq."${userName}(In)"`;
      outpaysQuery = outpaysQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      outpaysQuery = outpaysQuery.eq('construction_manager', userName);
    }

    const { data: outpaysData, error: outpaysError} = await outpaysQuery;

    if (outpaysError) {
      console.error('Error fetching outpays:', outpaysError);
      return { success: false, message: '매입 데이터를 불러오지 못했습니다.' };
    }

    // 목표 매출 데이터 집계 (weekly_plans 테이블)
    let weeklyPlansQuery = supabase
      .from('weekly_plans')
      .select('created_at, target_sales')
      .in('plan_type', ['target', 'both'])
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `created_by.eq."${userName}",created_by.eq."${userName}(In)"`;
      console.log('✅ [sales-stats] Using OR query for weekly_plans:', orCondition);
      weeklyPlansQuery = weeklyPlansQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      console.log('📌 [sales-stats] Using exact match for weekly_plans:', userName);
      weeklyPlansQuery = weeklyPlansQuery.eq('created_by', userName);
    }

    const { data: weeklyPlansData, error: weeklyPlansError } = await weeklyPlansQuery;

    console.log('📊 [sales-stats] Weekly plans found:', weeklyPlansData?.length || 0);
    if (weeklyPlansData && weeklyPlansData.length > 0) {
      console.log('📋 [sales-stats] Weekly plans data:', JSON.stringify(weeklyPlansData, null, 2));
    }

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
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.sales_date);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
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
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.purchase_date);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
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
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.created_at);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
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
