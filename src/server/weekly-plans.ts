import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 현장 검색 (construction_management 테이블)
export async function searchConstructionSites(query: string) {
  try {
    // 특수문자 이스케이프 처리
    const escapedQuery = query.replace(/[%_\\]/g, '\\$&');

    const { data, error } = await supabase
      .from('construction_management')
      .select('id, cms, site_name, site_address, client, sales_manager, construction_manager')
      .or(`cms.ilike.*${escapedQuery}*,site_name.ilike.*${escapedQuery}*,site_address.ilike.*${escapedQuery}*,client.ilike.*${escapedQuery}*`)
      .limit(10);

    if (error) throw error;

    console.log('Search results:', data?.length, 'sites found');
    if (data && data.length > 0) {
      console.log('First result ID:', data[0].id, 'CMS:', data[0].cms);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error searching construction sites:', error);
    return { success: false, message: error.message };
  }
}

// 주간 계획 목록 조회
export async function getWeeklyPlans(filters: {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}) {
  try {
    const { user_id, year, month, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 날짜 범위 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = supabase
      .from('weekly_plans')
      .select('*, users!inner(name, department)', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  } catch (error: any) {
    console.error('Error fetching weekly plans:', error);
    return { success: false, message: error.message };
  }
}

// 주간 계획 상세 조회
export async function getWeeklyPlan(id: number) {
  try {
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*, users!inner(name, department)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 주간 계획 생성
export async function createWeeklyPlan(planData: any, userId: string, userName: string) {
  try {
    // cms_id 안전장치: cms_id가 없거나 유효하지 않으면 cms_code로 찾기
    if (planData.cms_id) {
      // cms_id가 있으면 검증
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', planData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', planData.cms_id);
        planData.cms_id = null;
      }
    }

    // cms_id가 없고 cms_code가 있으면 cms_code로 찾기
    if (!planData.cms_id && planData.cms_code) {
      console.log('Trying to find site by cms_code:', planData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', planData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        planData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', planData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', planData.cms_code);
      }
    }

    const { data, error } = await supabase
      .from('weekly_plans')
      .insert({
        user_id: userId,
        ...planData,
        created_by: userName,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 주간 계획 수정
export async function updateWeeklyPlan(
  id: number,
  planData: any,
  userId: string,
  userName: string,
  userRole?: string
) {
  try {
    // 권한 확인: admin이면 모두 수정 가능, 일반 사용자는 본인 것만 수정 가능
    const { data: existingPlan, error: fetchError } = await supabase
      .from('weekly_plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingPlan.user_id !== userId) {
      return { success: false, message: '수정 권한이 없습니다.' };
    }

    // cms_id 안전장치: cms_id가 없거나 유효하지 않으면 cms_code로 찾기
    if (planData.cms_id) {
      // cms_id가 있으면 검증
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', planData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', planData.cms_id);
        planData.cms_id = null;
      }
    }

    // cms_id가 없고 cms_code가 있으면 cms_code로 찾기
    if (!planData.cms_id && planData.cms_code) {
      console.log('Trying to find site by cms_code:', planData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', planData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        planData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', planData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', planData.cms_code);
      }
    }

    const { data, error } = await supabase
      .from('weekly_plans')
      .update({
        ...planData,
        updated_by: userName,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 주간 계획 삭제
export async function deleteWeeklyPlan(id: number, userId: string, userRole?: string) {
  try {
    // 권한 확인: admin이면 모두 삭제 가능, 일반 사용자는 본인 것만 삭제 가능
    const { data: existingPlan, error: fetchError } = await supabase
      .from('weekly_plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingPlan.user_id !== userId) {
      return { success: false, message: '삭제 권한이 없습니다.' };
    }

    const { error } = await supabase.from('weekly_plans').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 모든 사용자 조회 (관리자용)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, department, email')
      .order('name', { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, message: error.message };
  }
}