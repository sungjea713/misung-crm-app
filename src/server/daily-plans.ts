import { createClient } from '@supabase/supabase-js';
import {
  getConstructionSalesDetails,
  upsertConstructionSalesDetails,
  deleteConstructionSalesDetails
} from './construction-sales';

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

// 일일 일지 목록 조회
export async function getDailyPlans(filters: {
  user_id?: string;
  created_by?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}) {
  try {
    const { user_id, created_by, year, month, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 날짜 범위 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = supabase
      .from('daily_plans')
      .select('*, users!inner(name, department)', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If created_by is provided, filter by that (for multi-branch users)
    // Otherwise, filter by user_id
    if (created_by) {
      query = query.eq('created_by', created_by);
    } else if (user_id) {
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

// 일일 일지 상세 조회
export async function getDailyPlan(id: number) {
  try {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*, users!inner(name, department)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 건설사 영업 상세 정보 조회 (activity_construction_sales가 true인 경우에만)
    let constructionSalesDetails = [];
    if (data && data.activity_construction_sales) {
      try {
        constructionSalesDetails = await getConstructionSalesDetails(id);
      } catch (detailError) {
        console.error('Error fetching construction sales details:', detailError);
        // 상세 정보 조회 실패는 치명적이지 않으므로 계속 진행
      }
    }

    return {
      success: true,
      data: {
        ...data,
        construction_sales_details: constructionSalesDetails
      }
    };
  } catch (error: any) {
    console.error('Error fetching weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 일일 일지 생성
export async function createDailyPlan(planData: any, userId: string, userName: string) {
  try {
    // 건설사 영업 상세 정보 분리
    const { construction_sales_details, ...dailyPlanData } = planData;

    // cms_id 안전장치: cms_id가 없거나 유효하지 않으면 cms_code로 찾기
    if (dailyPlanData.cms_id) {
      // cms_id가 있으면 검증
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', dailyPlanData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', dailyPlanData.cms_id);
        dailyPlanData.cms_id = null;
      }
    }

    // cms_id가 없고 cms_code가 있으면 cms_code로 찾기
    if (!dailyPlanData.cms_id && dailyPlanData.cms_code) {
      console.log('Trying to find site by cms_code:', dailyPlanData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', dailyPlanData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        dailyPlanData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', dailyPlanData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', dailyPlanData.cms_code);
      }
    }

    // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
    let createdByName = userName;
    if ((userName === '송기정' || userName === '김태현') && dailyPlanData.branch) {
      if (dailyPlanData.branch === '인천') {
        createdByName = `${userName}(In)`;
      }
      // '본점'인 경우는 suffix 없이 그대로 사용
    }

    // branch 필드는 DB에 저장하지 않음 (created_by에 반영됨)
    const { branch, ...dataToInsert } = dailyPlanData;

    const { data, error } = await supabase
      .from('daily_plans')
      .insert({
        user_id: userId,
        ...dataToInsert,
        created_by: createdByName,
      })
      .select()
      .single();

    if (error) throw error;

    // 건설사 영업 상세 정보 저장 (activity_construction_sales가 true이고 details가 있으면)
    if (data && data.activity_construction_sales && construction_sales_details && construction_sales_details.length > 0) {
      try {
        await upsertConstructionSalesDetails(data.id, construction_sales_details);
      } catch (detailError) {
        console.error('Error saving construction sales details:', detailError);
        // 상세 정보 저장 실패 시 일일 계획도 롤백
        await supabase.from('daily_plans').delete().eq('id', data.id);
        throw detailError;
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 일일 일지 수정
export async function updateDailyPlan(
  id: number,
  planData: any,
  userId: string,
  userName: string,
  userRole?: string
) {
  try {
    // 건설사 영업 상세 정보 분리
    const { construction_sales_details, ...dailyPlanData } = planData;

    // 권한 확인: admin이면 모두 수정 가능, 일반 사용자는 본인 것만 수정 가능
    const { data: existingPlan, error: fetchError } = await supabase
      .from('daily_plans')
      .select('user_id, activity_construction_sales')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingPlan.user_id !== userId) {
      return { success: false, message: '수정 권한이 없습니다.' };
    }

    // cms_id 안전장치: cms_id가 없거나 유효하지 않으면 cms_code로 찾기
    if (dailyPlanData.cms_id) {
      // cms_id가 있으면 검증
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', dailyPlanData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', dailyPlanData.cms_id);
        dailyPlanData.cms_id = null;
      }
    }

    // cms_id가 없고 cms_code가 있으면 cms_code로 찾기
    if (!dailyPlanData.cms_id && dailyPlanData.cms_code) {
      console.log('Trying to find site by cms_code:', dailyPlanData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', dailyPlanData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        dailyPlanData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', dailyPlanData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', dailyPlanData.cms_code);
      }
    }

    // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
    let createdByName = userName;
    let updatedByName = userName;
    if ((userName === '송기정' || userName === '김태현') && dailyPlanData.branch) {
      if (dailyPlanData.branch === '인천') {
        createdByName = `${userName}(In)`;
        updatedByName = `${userName}(In)`;
      }
      // '본점'인 경우는 suffix 없이 그대로 사용
    }

    // branch 필드는 DB에 저장하지 않음 (created_by와 updated_by에 반영됨)
    const { branch, ...dataToUpdate } = dailyPlanData;

    const { data, error } = await supabase
      .from('daily_plans')
      .update({
        ...dataToUpdate,
        created_by: createdByName,  // 지점 변경 시 created_by도 업데이트
        updated_by: updatedByName,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 건설사 영업 상세 정보 처리
    // 1. 이전에는 체크되지 않았는데 이제 체크된 경우 -> 저장
    // 2. 이전에도 체크되고 지금도 체크된 경우 -> 업데이트
    // 3. 이전에는 체크되었는데 이제 체크 해제된 경우 -> 삭제
    if (data.activity_construction_sales) {
      // 건설사 영업이 체크된 경우
      if (construction_sales_details && construction_sales_details.length > 0) {
        // 상세 정보가 있으면 저장/업데이트
        try {
          await upsertConstructionSalesDetails(id, construction_sales_details);
        } catch (detailError) {
          console.error('Error updating construction sales details:', detailError);
          throw detailError;
        }
      } else if (!existingPlan.activity_construction_sales) {
        // 새로 체크했는데 상세 정보가 없는 경우는 에러
        console.warn('Construction sales checked but no details provided');
      }
    } else if (existingPlan.activity_construction_sales && !data.activity_construction_sales) {
      // 체크가 해제된 경우 상세 정보 삭제
      try {
        await deleteConstructionSalesDetails(id);
      } catch (detailError) {
        console.error('Error deleting construction sales details:', detailError);
        // 삭제 실패는 치명적이지 않으므로 계속 진행
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating weekly plan:', error);
    return { success: false, message: error.message };
  }
}

// 일일 일지 삭제
export async function deleteDailyPlan(id: number, userId: string, userRole?: string) {
  try {
    // 권한 확인: admin이면 모두 삭제 가능, 일반 사용자는 본인 것만 삭제 가능
    const { data: existingPlan, error: fetchError } = await supabase
      .from('daily_plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingPlan.user_id !== userId) {
      return { success: false, message: '삭제 권한이 없습니다.' };
    }

    const { error } = await supabase.from('daily_plans').delete().eq('id', id);

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

    // Expand multi-branch users (송기정, 김태현) into separate entries
    const expandedData = [];
    for (const user of data) {
      if (user.name === '송기정' || user.name === '김태현') {
        // Add entry for headquarters (본점)
        expandedData.push({
          id: user.id,
          name: user.name,
          department: user.department,
          email: user.email,
          created_by: user.name, // Filter value for 본점
          display_name: `${user.name} (${user.department})` // Display text
        });
        // Add entry for Incheon branch (인천)
        expandedData.push({
          id: user.id,
          name: `${user.name}(In)`,
          department: user.department,
          email: user.email,
          created_by: `${user.name}(In)`, // Filter value for 인천
          display_name: `${user.name}(In) (${user.department})` // Display text
        });
      } else {
        expandedData.push({
          id: user.id,
          name: user.name,
          department: user.department,
          email: user.email,
          created_by: undefined, // Regular users don't need created_by filter
          display_name: `${user.name} (${user.department})`
        });
      }
    }

    return { success: true, data: expandedData };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, message: error.message };
  }
}