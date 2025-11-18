import { createClient } from '@supabase/supabase-js';
import type {
  Construction,
  Item,
  ConstructionSalesDetail
} from '../frontend/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 모든 건설사 목록 조회
 */
export async function getConstructions(): Promise<Construction[]> {
  const { data, error } = await supabase
    .from('constructions')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching constructions:', error);
    throw error;
  }

  return data || [];
}

/**
 * 모든 품목 목록 조회
 */
export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('item_id', { ascending: true });

  if (error) {
    console.error('Error fetching items:', error);
    throw error;
  }

  return data || [];
}

/**
 * 특정 일일 업무 일지의 건설사 영업 상세 정보 조회
 */
export async function getConstructionSalesDetails(
  dailyPlanId: number
): Promise<ConstructionSalesDetail[]> {
  const { data, error } = await supabase
    .from('daily_plan_construction_sales')
    .select(`
      id,
      daily_plan_id,
      construction_id,
      item_id,
      has_quote_submitted,
      has_meeting_conducted,
      created_at,
      updated_at,
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
    .eq('daily_plan_id', dailyPlanId)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching construction sales details:', error);
    throw error;
  }

  // 데이터 형식 변환
  return (data || []).map(item => ({
    id: item.id,
    daily_plan_id: item.daily_plan_id,
    construction_id: item.construction_id,
    item_id: item.item_id,
    has_quote_submitted: item.has_quote_submitted,
    has_meeting_conducted: item.has_meeting_conducted,
    created_at: item.created_at,
    updated_at: item.updated_at,
    construction: item.constructions,
    item: item.items
  }));
}

/**
 * 건설사 영업 상세 정보 저장/수정 (upsert)
 * - 기존 데이터는 모두 삭제하고 새로 입력
 */
export async function upsertConstructionSalesDetails(
  dailyPlanId: number,
  details: Omit<ConstructionSalesDetail, 'id' | 'daily_plan_id' | 'created_at' | 'updated_at'>[]
): Promise<ConstructionSalesDetail[]> {
  // 트랜잭션 처리를 위해 먼저 기존 데이터 삭제
  const { error: deleteError } = await supabase
    .from('daily_plan_construction_sales')
    .delete()
    .eq('daily_plan_id', dailyPlanId);

  if (deleteError) {
    console.error('Error deleting existing construction sales details:', deleteError);
    throw deleteError;
  }

  // 새 데이터가 없으면 빈 배열 반환
  if (!details || details.length === 0) {
    return [];
  }

  // 새 데이터 삽입
  const insertData = details.map(detail => ({
    daily_plan_id: dailyPlanId,
    construction_id: detail.construction_id,
    item_id: detail.item_id,
    has_quote_submitted: detail.has_quote_submitted || false,
    has_meeting_conducted: detail.has_meeting_conducted || false
  }));

  const { data, error: insertError } = await supabase
    .from('daily_plan_construction_sales')
    .insert(insertData)
    .select(`
      id,
      daily_plan_id,
      construction_id,
      item_id,
      has_quote_submitted,
      has_meeting_conducted,
      created_at,
      updated_at,
      constructions!inner(
        id,
        company_name
      ),
      items!inner(
        id,
        item_id,
        item_name
      )
    `);

  if (insertError) {
    console.error('Error inserting construction sales details:', insertError);
    throw insertError;
  }

  // 데이터 형식 변환
  return (data || []).map(item => ({
    id: item.id,
    daily_plan_id: item.daily_plan_id,
    construction_id: item.construction_id,
    item_id: item.item_id,
    has_quote_submitted: item.has_quote_submitted,
    has_meeting_conducted: item.has_meeting_conducted,
    created_at: item.created_at,
    updated_at: item.updated_at,
    construction: item.constructions,
    item: item.items
  }));
}

/**
 * 건설사 영업 상세 정보 삭제
 */
export async function deleteConstructionSalesDetails(
  dailyPlanId: number
): Promise<void> {
  const { error } = await supabase
    .from('daily_plan_construction_sales')
    .delete()
    .eq('daily_plan_id', dailyPlanId);

  if (error) {
    console.error('Error deleting construction sales details:', error);
    throw error;
  }
}

/**
 * 건설사별 영업 활동 통계 조회
 */
export async function getConstructionSalesStats(
  startDate: string,
  endDate: string
): Promise<{
  construction_id: number;
  construction_name: string;
  total_activities: number;
  quote_submitted_count: number;
  meeting_conducted_count: number;
}[]> {
  const { data, error } = await supabase
    .rpc('get_construction_sales_stats', {
      p_start_date: startDate,
      p_end_date: endDate
    });

  if (error) {
    console.error('Error fetching construction sales stats:', error);
    throw error;
  }

  return data || [];
}