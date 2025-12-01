import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlyCollectionStats {
  month: number;
  targetCollection: number;       // 목표 수금 (주간 업무 계획)
  userCollection: number;          // 사용자 수금 (수금 현황)
  adminConfirmedCollection: number; // 관리자 확정 수금 (월별 수금 데이터)
  outstandingBalance: number;      // 현재 미수금 누계 (월별 수금 데이터)
}

interface CollectionStatsSummary {
  totalTargetCollection: number;
  totalUserCollection: number;
  totalAdminConfirmedCollection: number;
  totalOutstandingBalance: number;
}

interface CollectionStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyCollectionStats[];
    summary: CollectionStatsSummary;
  };
  message?: string;
}

export async function getCollectionStats(
  year: number,
  userName: string,
  showAllBranches: boolean = false
): Promise<CollectionStatsResponse> {
  try {
    console.log('getCollectionStats - Year:', year, 'User:', userName, 'ShowAllBranches:', showAllBranches);

    // Check if this is a multi-branch user
    const isMultiBranch = userName === '송기정' || userName === '김태현';

    // 1. weekly_plans 테이블에서 목표 수금 데이터 조회
    let weeklyPlansQuery = supabase
      .from('weekly_plans')
      .select('created_at, target_collection')
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
      console.error('Error fetching weekly_plans:', weeklyPlansError);
      return { success: false, message: '주간 계획 데이터를 불러오지 못했습니다.' };
    }

    console.log('Weekly plans data count:', weeklyPlansData?.length || 0);

    // 2. collections 테이블에서 사용자 수금 데이터 조회
    let collectionsQuery = supabase
      .from('collections')
      .select('collection_date, collection_amount')
      .gte('collection_date', `${year}-01-01`)
      .lt('collection_date', `${year + 1}-01-01`);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `created_by.eq."${userName}",created_by.eq."${userName}(In)"`;
      collectionsQuery = collectionsQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      collectionsQuery = collectionsQuery.eq('created_by', userName);
    }

    const { data: collectionsData, error: collectionsError } = await collectionsQuery;

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError);
      return { success: false, message: '수금 데이터를 불러오지 못했습니다.' };
    }

    console.log('Collections data count:', collectionsData?.length || 0);

    // 3. monthly_collection 테이블에서 관리자 확정 수금 및 미수금 데이터 조회
    let monthlyCollectionQuery = supabase
      .from('monthly_collection')
      .select('month, collection_amount, outstanding_amount')
      .eq('year', year);

    if (isMultiBranch && showAllBranches) {
      // Multi-branch user with "all" selected: query both branches
      const orCondition = `manager_name.eq."${userName}",manager_name.eq."${userName}(In)"`;
      monthlyCollectionQuery = monthlyCollectionQuery.or(orCondition);
    } else {
      // Regular filtering by exact match
      monthlyCollectionQuery = monthlyCollectionQuery.eq('manager_name', userName);
    }

    const { data: monthlyCollectionData, error: monthlyCollectionError } = await monthlyCollectionQuery;

    if (monthlyCollectionError) {
      console.error('Error fetching monthly_collection:', monthlyCollectionError);
      // 에러가 나도 계속 진행 (월별 수금 데이터가 없을 수 있음)
    }

    console.log('Monthly collection data count:', monthlyCollectionData?.length || 0);

    // 4. 월별 집계 맵 초기화 (1-12월)
    const monthlyMap = new Map<
      number,
      {
        targetCollection: number;
        userCollection: number;
        adminConfirmedCollection: number;
        outstandingBalance: number;
      }
    >();

    for (let month = 1; month <= 12; month++) {
      monthlyMap.set(month, {
        targetCollection: 0,
        userCollection: 0,
        adminConfirmedCollection: 0,
        outstandingBalance: 0,
      });
    }

    // 5. weekly_plans 데이터를 월별로 집계 (목표 수금)
    weeklyPlansData?.forEach((row: any) => {
      if (row.created_at && row.target_collection) {
        try {
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.created_at);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.targetCollection += row.target_collection || 0;
          }
        } catch (error) {
          console.error('Invalid created_at:', row.created_at);
        }
      }
    });

    // 6. collections 데이터를 월별로 집계 (사용자 수금)
    collectionsData?.forEach((row: any) => {
      if (row.collection_date && row.collection_amount) {
        try {
          // 한국 시간 기준으로 월 추출 (UTC+9)
          const date = new Date(row.collection_date);
          const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
          const month = kstDate.getUTCMonth() + 1;
          if (month >= 1 && month <= 12) {
            const current = monthlyMap.get(month)!;
            current.userCollection += row.collection_amount || 0;
          }
        } catch (error) {
          console.error('Invalid collection_date:', row.collection_date);
        }
      }
    });

    // 7. monthly_collection 데이터를 월별로 매핑 (관리자 확정 수금 및 미수금)
    monthlyCollectionData?.forEach((row: any) => {
      const month = row.month;
      if (month >= 1 && month <= 12) {
        const current = monthlyMap.get(month)!;
        current.adminConfirmedCollection += row.collection_amount || 0;
        current.outstandingBalance += row.outstanding_amount || 0;
      }
    });

    // 8. 월별 데이터 배열 생성
    const monthly: MonthlyCollectionStats[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyMap.get(month)!;

      monthly.push({
        month,
        targetCollection: monthData.targetCollection,
        userCollection: monthData.userCollection,
        adminConfirmedCollection: monthData.adminConfirmedCollection,
        outstandingBalance: monthData.outstandingBalance,
      });
    }

    // 9. 누계 합계 계산
    const summary: CollectionStatsSummary = {
      totalTargetCollection: monthly.reduce((sum, m) => sum + m.targetCollection, 0),
      totalUserCollection: monthly.reduce((sum, m) => sum + m.userCollection, 0),
      totalAdminConfirmedCollection: monthly.reduce((sum, m) => sum + m.adminConfirmedCollection, 0),
      totalOutstandingBalance: monthly.reduce((sum, m) => sum + m.outstandingBalance, 0),
    };

    console.log('Collection Stats Summary:', summary);

    return {
      success: true,
      data: {
        monthly,
        summary,
      },
    };
  } catch (error: any) {
    console.error('Error in getCollectionStats:', error);
    return { success: false, message: error.message || '수금 실적 데이터를 불러오지 못했습니다.' };
  }
}
