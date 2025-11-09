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

    // 1. inpays 테이블에서 해당 연도의 데이터 조회
    let inpaysQuery = supabase
      .from('inpays')
      .select('sales_date, cms, supply_price')
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

    // 2. 월별 집계 맵 초기화 (1-12월)
    const monthlyMap = new Map<
      number,
      {
        cmsSet: Set<string>;        // 월별 CMS 코드 수집
        confirmedRevenue: number;   // 확정 매출
      }
    >();

    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, {
        cmsSet: new Set(),
        confirmedRevenue: 0,
      });
    }

    // 3. inpays 데이터를 월별로 집계
    inpaysData?.forEach((row: any) => {
      if (row.sales_date) {
        try {
          const date = new Date(row.sales_date);
          const month = date.getMonth() + 1; // 1-12
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;

            // CMS 코드 수집
            if (row.cms) {
              current.cmsSet.add(row.cms);
            }

            // 확정 매출 합산
            current.confirmedRevenue += row.supply_price || 0;
          }
        } catch (error) {
          console.error('Invalid sales_date:', row.sales_date);
        }
      }
    });

    // 4. 월별로 site_summary 조회하여 과투입 계산
    const monthly: MonthlyCostEfficiency[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyMap.get(month)!;
      const cmsList = Array.from(monthData.cmsSet);

      let overInvestment = 0;

      if (cmsList.length > 0) {
        // site_summary에서 해당 CMS 코드들 조회
        const { data: siteSummaryData, error: siteSummaryError } = await supabase
          .from('site_summary')
          .select('cms, sales_amount, purchase_amount')
          .in('cms', cmsList);

        if (siteSummaryError) {
          console.error(`Error fetching site_summary for month ${month}:`, siteSummaryError);
        } else if (siteSummaryData) {
          // 각 현장의 매출금액 - 매입금액 계산
          siteSummaryData.forEach((site: any) => {
            const salesNum = parseAmountString(site.sales_amount);
            const purchaseNum = parseAmountString(site.purchase_amount);
            const diff = salesNum - purchaseNum;

            // 음수인 경우만 절대값을 합산 (과투입)
            if (diff < 0) {
              overInvestment += Math.abs(diff);
            }
          });
        }
      }

      // 편차 = 과투입(절대값) - 확정 매출
      const difference = overInvestment - monthData.confirmedRevenue;

      monthly.push({
        month,
        overInvestment,
        confirmedRevenue: monthData.confirmedRevenue,
        difference,
      });
    }

    // 5. 누계 합계 계산
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
