import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlyCostEfficiency {
  month: number;
  overInvestment: number;     // 과투입 (절대값)
  confirmedRevenue: number;   // 확정 매출
  difference: number;          // 편차
}

interface CostEfficiencyStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyCostEfficiency[];
    summary: {
      totalOverInvestment: number;
      totalConfirmedRevenue: number;
      totalDifference: number;
    };
  };
  message?: string;
}

// 숫자 문자열 파싱 헬퍼 함수 (쉼표 제거)
function parseAmountString(amountStr: string | null | undefined): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export async function getCostEfficiencyStats(
  year: number,
  userName: string,
  showAllBranches: boolean = false
): Promise<CostEfficiencyStatsResponse> {
  try {
    console.log('getCostEfficiencyStats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

    // Check if this is a multi-branch user
    const isMultiBranch = userName === '송기정' || userName === '김태현';

    // 1. inpays 테이블에서 해당 연도의 확정 매출 데이터 조회
    let inpaysQuery = supabase
      .from('inpays')
      .select('sales_date, supply_price')
      .gte('sales_date', `${year}-01-01`)
      .lt('sales_date', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `construction_manager.eq."${userName}",construction_manager.eq."${userName}(In)"`;
      inpaysQuery = inpaysQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      inpaysQuery = inpaysQuery.eq('construction_manager', userName);
    }

    const { data: inpaysData, error: inpaysError } = await inpaysQuery;

    if (inpaysError) {
      console.error('Error fetching inpays:', inpaysError);
      return { success: false, message: '매출 데이터를 불러오지 못했습니다.' };
    }

    console.log('Inpays data count:', inpaysData?.length || 0);

    // 2. monthly_over_investment 테이블에서 과투입 데이터 조회
    const { data: overInvestmentData, error: overInvestmentError } = await supabase
      .from('monthly_over_investment')
      .select('month, amount')
      .eq('year', year)
      .eq('manager_name', userName);

    if (overInvestmentError) {
      console.error('Error fetching monthly_over_investment:', overInvestmentError);
      // 에러가 나도 계속 진행 (과투입 데이터가 없을 수 있음)
    }

    console.log('Over investment data count:', overInvestmentData?.length || 0);

    // 3. 월별 집계 맵 초기화 (1-12월)
    const monthlyMap = new Map<
      number,
      {
        confirmedRevenue: number;   // 확정 매출
        overInvestment: number;     // 과투입
      }
    >();

    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, {
        confirmedRevenue: 0,
        overInvestment: 0,
      });
    }

    // 4. inpays 데이터를 월별로 집계 (확정 매출)
    inpaysData?.forEach((row: any) => {
      if (row.sales_date) {
        try {
          const date = new Date(row.sales_date);
          const month = date.getMonth() + 1; // 1-12
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.confirmedRevenue += row.supply_price || 0;
          }
        } catch (error) {
          console.error('Invalid sales_date:', row.sales_date);
        }
      }
    });

    // 5. 과투입 데이터를 월별로 집계
    overInvestmentData?.forEach((row: any) => {
      const month = row.month;
      if (month >= 1 && month <= 12) {
        const current = monthlyMap.get(month)!;
        current.overInvestment += row.amount || 0;
      }
    });

    // 6. 월별 데이터 배열 생성
    const monthly: MonthlyCostEfficiency[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyMap.get(month)!;

      // 편차 = 과투입 - 확정 매출
      const difference = monthData.overInvestment - monthData.confirmedRevenue;

      monthly.push({
        month,
        overInvestment: monthData.overInvestment,
        confirmedRevenue: monthData.confirmedRevenue,
        difference,
      });
    }

    // 7. 누계 합계 계산
    const summary = {
      totalOverInvestment: monthly.reduce((sum, m) => sum + m.overInvestment, 0),
      totalConfirmedRevenue: monthly.reduce((sum, m) => sum + m.confirmedRevenue, 0),
      totalDifference: monthly.reduce((sum, m) => sum + m.difference, 0),
    };

    console.log('Cost Efficiency Stats Summary:', summary);

    return {
      success: true,
      data: {
        monthly,
        summary,
      },
    };
  } catch (error: any) {
    console.error('Error in getCostEfficiencyStats:', error);
    return { success: false, message: error.message || '원가 효율 데이터를 불러오지 못했습니다.' };
  }
}
