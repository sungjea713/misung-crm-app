import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlyStats {
  year: number;
  month: number;
  plan: {
    construction: number;
    additional: number;
    support: number;
    total: number;
  };
  actual: {
    construction: number;
    additional: number;
    support: number;
    total: number;
  };
  achievement: {
    construction: number;
    additional: number;
    support: number;
    total: number;
  };
}

interface ActivityStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyStats[];
    summary: {
      plan: {
        construction: number;
        additional: number;
        support: number;
        total: number;
      };
      actual: {
        construction: number;
        additional: number;
        support: number;
        total: number;
      };
      achievement: {
        construction: number;
        additional: number;
        support: number;
        total: number;
      };
    };
  };
  message?: string;
}

interface UserActivityStats {
  userId: string;
  userName: string;
  userDepartment: string;
  monthly: MonthlyStats[];
  summary: {
    plan: {
      construction: number;
      additional: number;
      support: number;
      total: number;
    };
    actual: {
      construction: number;
      additional: number;
      support: number;
      total: number;
    };
    achievement: {
      construction: number;
      additional: number;
      support: number;
      total: number;
    };
  };
}

interface AllUsersStatsResponse {
  success: boolean;
  data?: UserActivityStats[];
  message?: string;
}

export async function getActivityStats(year: number, userId?: string): Promise<ActivityStatsResponse> {
  try {
    // 주간 계획 데이터 집계
    let weeklyQuery = supabase
      .from('weekly_plans')
      .select('*')
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (userId) {
      weeklyQuery = weeklyQuery.eq('user_id', userId);
    }

    const { data: weeklyData, error: weeklyError } = await weeklyQuery;

    if (weeklyError) {
      console.error('Error fetching weekly plans:', weeklyError);
      return { success: false, message: '주간 계획 데이터를 불러오지 못했습니다.' };
    }

    // 일일 업무 데이터 집계
    let dailyQuery = supabase
      .from('daily_plans')
      .select('*')
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (userId) {
      dailyQuery = dailyQuery.eq('user_id', userId);
    }

    const { data: dailyData, error: dailyError } = await dailyQuery;

    if (dailyError) {
      console.error('Error fetching daily plans:', dailyError);
      return { success: false, message: '일일 업무 데이터를 불러오지 못했습니다.' };
    }

    // 월별 집계
    const monthlyMap = new Map<string, any>();

    // 주간 계획 집계
    weeklyData?.forEach((plan: any) => {
      const date = new Date(plan.created_at);
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          plan: { construction: 0, additional: 0, support: 0, total: 0 },
          actual: { construction: 0, additional: 0, support: 0, total: 0 },
        });
      }

      const stats = monthlyMap.get(key);
      if (plan.activity_construction_sales) stats.plan.construction++;
      if (plan.activity_site_additional_sales) stats.plan.additional++;
      if (plan.activity_site_support) stats.plan.support++;
      stats.plan.total = stats.plan.construction + stats.plan.additional + stats.plan.support;
    });

    // 일일 업무 집계
    dailyData?.forEach((plan: any) => {
      const date = new Date(plan.created_at);
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          plan: { construction: 0, additional: 0, support: 0, total: 0 },
          actual: { construction: 0, additional: 0, support: 0, total: 0 },
        });
      }

      const stats = monthlyMap.get(key);
      if (plan.activity_construction_sales) stats.actual.construction++;
      if (plan.activity_site_additional_sales) stats.actual.additional++;
      if (plan.activity_site_support) stats.actual.support++;
      stats.actual.total = stats.actual.construction + stats.actual.additional + stats.actual.support;
    });

    // 월별 데이터 배열로 변환 및 달성률 계산
    const monthly: MonthlyStats[] = Array.from(monthlyMap.values())
      .sort((a, b) => a.month - b.month)
      .map((stats) => ({
        ...stats,
        achievement: {
          construction: stats.plan.construction > 0
            ? Math.round((stats.actual.construction / stats.plan.construction) * 100)
            : 0,
          additional: stats.plan.additional > 0
            ? Math.round((stats.actual.additional / stats.plan.additional) * 100)
            : 0,
          support: stats.plan.support > 0
            ? Math.round((stats.actual.support / stats.plan.support) * 100)
            : 0,
          total: stats.plan.total > 0
            ? Math.round((stats.actual.total / stats.plan.total) * 100)
            : 0,
        },
      }));

    // 전체 합계 계산
    const summary = {
      plan: { construction: 0, additional: 0, support: 0, total: 0 },
      actual: { construction: 0, additional: 0, support: 0, total: 0 },
      achievement: { construction: 0, additional: 0, support: 0, total: 0 },
    };

    monthly.forEach((m) => {
      summary.plan.construction += m.plan.construction;
      summary.plan.additional += m.plan.additional;
      summary.plan.support += m.plan.support;
      summary.plan.total += m.plan.total;

      summary.actual.construction += m.actual.construction;
      summary.actual.additional += m.actual.additional;
      summary.actual.support += m.actual.support;
      summary.actual.total += m.actual.total;
    });

    summary.achievement.construction = summary.plan.construction > 0
      ? Math.round((summary.actual.construction / summary.plan.construction) * 100)
      : 0;
    summary.achievement.additional = summary.plan.additional > 0
      ? Math.round((summary.actual.additional / summary.plan.additional) * 100)
      : 0;
    summary.achievement.support = summary.plan.support > 0
      ? Math.round((summary.actual.support / summary.plan.support) * 100)
      : 0;
    summary.achievement.total = summary.plan.total > 0
      ? Math.round((summary.actual.total / summary.plan.total) * 100)
      : 0;

    return {
      success: true,
      data: {
        monthly,
        summary,
      },
    };
  } catch (error: any) {
    console.error('Error in getActivityStats:', error);
    return { success: false, message: error.message || '통계 데이터를 불러오지 못했습니다.' };
  }
}
