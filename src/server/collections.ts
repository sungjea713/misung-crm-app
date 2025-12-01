import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CollectionRecordFormData {
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  collection_date: string;
  collection_amount?: number;
  branch?: '본점' | '인천';  // For multi-branch users
}

interface CollectionRecordFilters {
  user_id?: string;
  created_by?: string;  // For multi-branch users filtering
  year: number;
  month: number;
  page?: number;
  limit?: number;
}

// 사용자 목록 조회 (관리자용)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, department, site')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, message: '사용자 목록을 불러오지 못했습니다.' };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    return { success: false, message: error.message || '사용자 목록을 불러오지 못했습니다.' };
  }
}

// 현장 검색 (계산서 발행과 동일)
export async function searchConstructionSites(query: string) {
  try {
    const { data, error } = await supabase
      .from('construction_sites')
      .select('*')
      .or(`cms.ilike.%${query}%,site_name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Error searching construction sites:', error);
      return { success: false, message: '현장 검색에 실패했습니다.' };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in searchConstructionSites:', error);
    return { success: false, message: error.message || '현장 검색에 실패했습니다.' };
  }
}

// 수금 기록 목록 조회
export async function getCollectionRecords(filters: CollectionRecordFilters) {
  try {
    const { user_id, created_by, year, month, page = 1, limit = 20 } = filters;

    // Build query (한국 시간 기준)
    // DATE 타입은 시간대 영향을 받지 않으므로 YYYY-MM-DD 형식으로 직접 생성
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = supabase
      .from('collections')
      .select('*, users(name, department)', { count: 'exact' })
      .gte('collection_date', startDateStr)
      .lte('collection_date', endDateStr)
      .order('collection_date', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    // For multi-branch users, filter by created_by (includes branch suffix)
    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching collection records:', error);
      return { success: false, message: '수금 기록을 불러오지 못했습니다.' };
    }

    // Format the response - keep original created_by with branch suffix
    const formattedData = data?.map((record: any) => {
      return {
        ...record,
        // Keep the original created_by field as it contains branch info (e.g., "송기정(In)")
        users: {
          name: record.users?.name,
          department: record.users?.department,
        },
      };
    }) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: formattedData,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error: any) {
    console.error('Error in getCollectionRecords:', error);
    return { success: false, message: error.message || '수금 기록을 불러오지 못했습니다.' };
  }
}

// 수금 기록 단건 조회
export async function getCollectionRecord(id: number) {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*, users(name, department)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching collection record:', error);
      return { success: false, message: '수금 기록을 불러오지 못했습니다.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getCollectionRecord:', error);
    return { success: false, message: error.message || '수금 기록을 불러오지 못했습니다.' };
  }
}

// 수금 기록 생성
export async function createCollectionRecord(
  userId: string,
  userName: string,
  data: CollectionRecordFormData
) {
  try {
    // Determine created_by based on branch for multi-branch users
    let createdBy = userName;
    if (data.branch === '인천') {
      createdBy = `${userName}(In)`;
    }

    // 수금일의 년/월 정보 추출
    const collectionDate = new Date(data.collection_date);
    const year = collectionDate.getFullYear();
    const month = collectionDate.getMonth() + 1;

    // 관리자 업로드 미수금 조회
    const { data: monthlyCollectionData } = await supabase
      .from('monthly_collection')
      .select('outstanding_amount')
      .eq('year', year)
      .eq('month', month)
      .eq('manager_name', userName)
      .single();

    const monthlyOutstanding = monthlyCollectionData?.outstanding_amount || 0;
    const collectionAmount = data.collection_amount || 0;
    const outstandingBalance = monthlyOutstanding - collectionAmount;

    const insertData = {
      user_id: userId,
      cms_id: data.cms_id,
      cms_code: data.cms_code,
      site_name: data.site_name,
      site_address: data.site_address,
      sales_manager: data.sales_manager,
      construction_manager: data.construction_manager,
      collection_date: data.collection_date,
      collection_amount: data.collection_amount,
      outstanding_balance: outstandingBalance,
      created_by: createdBy,
    };

    const { data: insertedData, error } = await supabase
      .from('collections')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating collection record:', error);
      return { success: false, message: '수금 기록 등록에 실패했습니다.' };
    }

    return { success: true, data: insertedData };
  } catch (error: any) {
    console.error('Error in createCollectionRecord:', error);
    return { success: false, message: error.message || '수금 기록 등록에 실패했습니다.' };
  }
}

// 수금 기록 수정
export async function updateCollectionRecord(
  id: number,
  userId: string,
  userName: string,
  data: CollectionRecordFormData
) {
  try {
    // Check if record exists and belongs to user
    const { data: existing } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return { success: false, message: '수금 기록을 찾을 수 없거나 수정 권한이 없습니다.' };
    }

    // Determine created_by and updated_by based on branch for multi-branch users
    let createdBy = userName;
    let updatedBy = userName;
    if ((userName === '송기정' || userName === '김태현') && data.branch) {
      if (data.branch === '인천') {
        createdBy = `${userName}(In)`;
        updatedBy = `${userName}(In)`;
      }
      // '본점'인 경우는 suffix 없이 그대로 사용
    }

    // 수금일의 년/월 정보 추출
    const collectionDate = new Date(data.collection_date);
    const year = collectionDate.getFullYear();
    const month = collectionDate.getMonth() + 1;

    // 관리자 업로드 미수금 조회
    const { data: monthlyCollectionData } = await supabase
      .from('monthly_collection')
      .select('outstanding_amount')
      .eq('year', year)
      .eq('month', month)
      .eq('manager_name', userName)
      .single();

    const monthlyOutstanding = monthlyCollectionData?.outstanding_amount || 0;
    const collectionAmount = data.collection_amount || 0;
    const outstandingBalance = monthlyOutstanding - collectionAmount;

    const updateData = {
      cms_id: data.cms_id,
      cms_code: data.cms_code,
      site_name: data.site_name,
      site_address: data.site_address,
      sales_manager: data.sales_manager,
      construction_manager: data.construction_manager,
      collection_date: data.collection_date,
      collection_amount: data.collection_amount,
      outstanding_balance: outstandingBalance,
      created_by: createdBy,  // 지점 변경 시 created_by도 업데이트
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedData, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection record:', error);
      return { success: false, message: '수금 기록 수정에 실패했습니다.' };
    }

    return { success: true, data: updatedData };
  } catch (error: any) {
    console.error('Error in updateCollectionRecord:', error);
    return { success: false, message: error.message || '수금 기록 수정에 실패했습니다.' };
  }
}

// 수금 기록 삭제
export async function deleteCollectionRecord(id: number, userId: string) {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting collection record:', error);
      return { success: false, message: '수금 기록 삭제에 실패했습니다.' };
    }

    return { success: true, message: '수금 기록이 삭제되었습니다.' };
  } catch (error: any) {
    console.error('Error in deleteCollectionRecord:', error);
    return { success: false, message: error.message || '수금 기록 삭제에 실패했습니다.' };
  }
}
