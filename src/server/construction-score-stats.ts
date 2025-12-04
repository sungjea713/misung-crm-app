import { createClient } from '@supabase/supabase-js';
import type {
  ConstructionItemScore,
  ConstructionScoreStats,
  ConstructionScoreResponse
} from '../frontend/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 건설사별 영업 점수 통계 조회
 * @param startDate - 조회 시작일 (YYYY-MM-DD)
 * @param endDate - 조회 종료일 (YYYY-MM-DD)
 * @param userId - 사용자 ID (선택)
 * @param createdBy - 작성자 (선택, 다중 지점 사용자용)
 */
export async function getConstructionScoreStats(
  startDate: string,
  endDate: string,
  userId?: string,
  createdBy?: string
): Promise<ConstructionScoreResponse> {
  try {
    // 1. daily_plans에서 기간 내 건설사 영업 활동이 있는 계획들 조회
    // 날짜 범위를 한국 시간 기준으로 변환 (UTC+9)
    const startDateTime = new Date(`${startDate}T00:00:00+09:00`).toISOString();
    const endDateTime = new Date(`${endDate}T23:59:59+09:00`).toISOString();

    let plansQuery = supabase
      .from('daily_plans')
      .select(`
        id,
        created_at,
        user_id,
        created_by,
        activity_construction_sales
      `)
      .eq('activity_construction_sales', true)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime);

    // 사용자 필터링
    if (createdBy) {
      plansQuery = plansQuery.eq('created_by', createdBy);
    } else if (userId) {
      plansQuery = plansQuery.eq('user_id', userId);
    }

    const { data: plans, error: plansError } = await plansQuery;

    if (plansError) {
      throw plansError;
    }

    if (!plans || plans.length === 0) {
      return {
        success: true,
        data: {
          scores: [],
          summary: {
            total_constructions: 0,
            total_activities: 0
          }
        }
      };
    }

    // 2. 해당 계획들의 건설사 영업 상세 정보 조회
    const planIds = plans.map(p => p.id);
    const { data: salesDetails, error: salesError } = await supabase
      .from('daily_plan_construction_sales')
      .select(`
        id,
        daily_plan_id,
        construction_id,
        item_id,
        has_quote_submitted,
        has_meeting_conducted,
        constructions!inner(
          id,
          company_name
        ),
        items!inner(
          id,
          item_id,
          item_name
        )
      `)
      .in('daily_plan_id', planIds);

    if (salesError) {
      throw salesError;
    }

    // 3. 건설사+아이템 조합별로 점수 계산
    // Key: `${construction_id}_${item_id}`
    const itemScoresMap = new Map<string, {
      construction_id: number;
      construction_name: string;
      item_id: number;
      item_name: string;
      quote_activities: string[];  // 날짜 목록
      meeting_activities: string[];  // 날짜 목록
    }>();

    for (const detail of salesDetails || []) {
      const plan = plans.find(p => p.id === detail.daily_plan_id);
      if (!plan) continue;

      const construction = detail.constructions;
      const item = detail.items;
      const key = `${construction.id}_${item.id}`;
      const activityDate = plan.created_at.split('T')[0];

      if (!itemScoresMap.has(key)) {
        itemScoresMap.set(key, {
          construction_id: construction.id,
          construction_name: construction.company_name,
          item_id: item.id,
          item_name: `${item.item_id} - ${item.item_name}`,
          quote_activities: [],
          meeting_activities: []
        });
      }

      const itemData = itemScoresMap.get(key)!;

      // 견적 제출 활동 기록
      if (detail.has_quote_submitted) {
        itemData.quote_activities.push(activityDate);
      }

      // 미팅 진행 활동 기록
      if (detail.has_meeting_conducted) {
        itemData.meeting_activities.push(activityDate);
      }
    }

    // 4. 건설사+아이템별 점수 계산
    const itemScores: ConstructionItemScore[] = Array.from(itemScoresMap.values()).map(item => {
      // 날짜순 정렬
      item.quote_activities.sort();
      item.meeting_activities.sort();

      const quote_count = item.quote_activities.length;
      const meeting_count = item.meeting_activities.length;

      // 점수 계산: 첫 번째 1점, 이후 0.1점씩
      const quote_score = quote_count > 0 ? 1 + (quote_count - 1) * 0.1 : 0;
      const meeting_score = meeting_count > 0 ? 1 + (meeting_count - 1) * 0.1 : 0;

      // 최근 활동일 (견적과 미팅 중 최신)
      const all_dates = [...item.quote_activities, ...item.meeting_activities].sort().reverse();
      const recent_activity_date = all_dates[0] || null;

      let days_since_last_activity = null;
      if (recent_activity_date) {
        const today = new Date();
        const lastActivity = new Date(recent_activity_date);
        days_since_last_activity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        construction_id: item.construction_id,
        construction_name: item.construction_name,
        item_id: item.item_id,
        item_name: item.item_name,
        quote_count,
        quote_score: Number(quote_score.toFixed(2)),
        meeting_count,
        meeting_score: Number(meeting_score.toFixed(2)),
        recent_activity_date,
        days_since_last_activity,
        quote_activities: item.quote_activities,
        meeting_activities: item.meeting_activities
      };
    });

    // 5. 건설사별로 그룹화
    const constructionMap = new Map<number, ConstructionScoreStats>();

    for (const itemScore of itemScores) {
      if (!constructionMap.has(itemScore.construction_id)) {
        constructionMap.set(itemScore.construction_id, {
          construction_id: itemScore.construction_id,
          construction_name: itemScore.construction_name,
          total_activities: 0,
          item_scores: []
        });
      }

      const construction = constructionMap.get(itemScore.construction_id)!;
      construction.item_scores.push(itemScore);
      construction.total_activities += (itemScore.quote_count + itemScore.meeting_count);
    }

    // 6. 총 활동 횟수 기준으로 정렬
    const scores = Array.from(constructionMap.values()).sort((a, b) =>
      b.total_activities - a.total_activities
    );

    // 7. 요약 정보 생성
    const summary = {
      total_constructions: scores.length,
      total_activities: scores.reduce((sum, s) => sum + s.total_activities, 0)
    };

    return {
      success: true,
      data: {
        scores,
        summary
      }
    };

  } catch (error) {
    console.error('Error fetching construction score stats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '점수 통계를 조회하는데 실패했습니다.'
    };
  }
}

/**
 * 특정 사용자의 건설사 영업 점수 통계 조회 (월별)
 */
export async function getUserConstructionScoresByMonth(
  userId: string,
  year: number,
  month: number,
  createdBy?: string
): Promise<ConstructionScoreResponse> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`; // 해당 월의 마지막 날 (한국 시간 기준)

  return getConstructionScoreStats(startDate, endDate, userId, createdBy);
}

/**
 * 특정 사용자의 건설사 영업 점수 통계 조회 (연도별)
 */
export async function getUserConstructionScoresByYear(
  userId: string,
  year: number,
  createdBy?: string
): Promise<ConstructionScoreResponse> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  return getConstructionScoreStats(startDate, endDate, userId, createdBy);
}
