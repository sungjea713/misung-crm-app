import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SalesActivityData {
  user_id: string;
  activity_date: string;
  activity_type: 'estimate' | 'contract';
  site_type: 'existing' | 'new';
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  client?: string;
  amount?: number;
  execution_rate?: number;
  attachments?: string[];
  // Note: created_by and updated_by should NOT be in this interface
  // They are set by the create/update functions based on userName parameter
}

// Reuse construction site search from daily-plans
export async function searchConstructionSites(query: string) {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    // Escape special characters for LIKE pattern
    const escapedQuery = query.replace(/[%_\\]/g, '\\$&');

    const { data, error } = await supabase
      .from('construction_management')
      .select('id, cms, site_name, site_address, client, sales_manager, construction_manager')
      .or(`cms.ilike.*${escapedQuery}*,site_name.ilike.*${escapedQuery}*,site_address.ilike.*${escapedQuery}*,client.ilike.*${escapedQuery}*`)
      .limit(10);

    if (error) {
      console.error('Error searching construction sites:', error);
      return { success: false, message: '현장 검색 중 오류가 발생했습니다.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in searchConstructionSites:', error);
    return { success: false, message: error.message || '현장 검색 중 오류가 발생했습니다.' };
  }
}

// Get all sales activities with filters
export async function getSalesActivities(
  userRole: string,
  userId: string,
  filters: {
    user_id?: string;
    created_by?: string;
    year: number;
    month: number;
    activity_type?: string;
    site_type?: string;
    page?: number;
    limit?: number;
  }
) {
  try {
    const { user_id, created_by, year, month, activity_type, site_type, page = 1, limit = 20 } = filters;

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = supabase
      .from('sales_activities')
      .select('*, users!inner(name, department)', { count: 'exact' })
      .gte('activity_date', startDate.toISOString().split('T')[0])
      .lte('activity_date', endDate.toISOString().split('T')[0])
      .order('activity_date', { ascending: false })
      .order('id', { ascending: false });

    // Filter by user
    if (userRole === 'admin') {
      // If created_by is provided, filter by that (for multi-branch users)
      // Otherwise, filter by user_id
      if (created_by) {
        query = query.eq('created_by', created_by);
      } else if (user_id) {
        query = query.eq('user_id', user_id);
      }
    } else if (userRole === 'user') {
      query = query.eq('user_id', userId);
    }

    // Filter by activity type
    if (activity_type && activity_type !== 'all') {
      query = query.eq('activity_type', activity_type);
    }

    // Filter by site type
    if (site_type && site_type !== 'all') {
      query = query.eq('site_type', site_type);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching sales activities:', error);
      return { success: false, message: '영업 활동 목록을 불러오지 못했습니다.' };
    }

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
    console.error('Error in getSalesActivities:', error);
    return { success: false, message: error.message || '영업 활동 목록을 불러오지 못했습니다.' };
  }
}

// Get single sales activity
export async function getSalesActivity(id: number, userRole: string, userId: string) {
  try {
    let query = supabase
      .from('sales_activities')
      .select('*, users!inner(name, department)')
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sales activity:', error);
      return { success: false, message: '영업 활동을 불러오지 못했습니다.' };
    }

    // Check permission
    if (userRole === 'user' && data.user_id !== userId) {
      return { success: false, message: '권한이 없습니다.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getSalesActivity:', error);
    return { success: false, message: error.message || '영업 활동을 불러오지 못했습니다.' };
  }
}

// Create new sales activity
export async function createSalesActivity(activityData: SalesActivityData & { branch?: string }, userName: string) {
  try {
    // If cms_id is provided but invalid, try to find by cms_code
    if (activityData.cms_id) {
      const { data: siteData } = await supabase
        .from('construction_management')
        .select('id, cms, site_name, site_address, client')
        .eq('id', activityData.cms_id)
        .single();

      if (siteData) {
        // Store snapshot data
        activityData.cms_code = siteData.cms;
        activityData.site_name = siteData.site_name;
        activityData.site_address = siteData.site_address;
        activityData.client = siteData.client;
      } else {
        // cms_id is invalid, set to null
        activityData.cms_id = undefined;
      }
    }

    // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
    let createdByName = userName;
    console.log('🔍 [createSalesActivity] userName received:', userName);
    console.log('🔍 [createSalesActivity] branch received:', activityData.branch);

    if ((userName === '송기정' || userName === '김태현') && activityData.branch) {
      if (activityData.branch === '인천') {
        createdByName = `${userName}(In)`;
      }
      // '본점'인 경우는 suffix 없이 그대로 사용
    }

    console.log('✅ [createSalesActivity] Final createdByName:', createdByName);

    // branch 필드는 DB에 저장하지 않음 (created_by에 반영됨)
    const { branch, ...dataToInsert } = activityData;

    console.log('📝 [createSalesActivity] Data to insert keys:', Object.keys(dataToInsert));
    console.log('📝 [createSalesActivity] created_by in dataToInsert:', 'created_by' in dataToInsert);

    const { data, error } = await supabase
      .from('sales_activities')
      .insert({
        ...dataToInsert,
        created_by: createdByName,
      })
      .select('*, users!inner(name, department)')
      .single();

    if (error) {
      console.error('Error creating sales activity:', error);
      return { success: false, message: '영업 활동 등록에 실패했습니다.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in createSalesActivity:', error);
    return { success: false, message: error.message || '영업 활동 등록에 실패했습니다.' };
  }
}

// Update sales activity
export async function updateSalesActivity(
  id: number,
  activityData: Partial<SalesActivityData> & { branch?: string },
  userRole: string,
  userId: string,
  userName: string
) {
  try {
    // Check permission and get existing data
    const { data: existing } = await supabase
      .from('sales_activities')
      .select('user_id, attachments')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, message: '영업 활동을 찾을 수 없습니다.' };
    }

    // Only admin can update
    if (userRole !== 'admin') {
      return { success: false, message: '수정 권한이 없습니다. 관리자만 수정할 수 있습니다.' };
    }

    // Clean up removed images from storage
    if (activityData.attachments && existing.attachments) {
      const oldAttachments = Array.isArray(existing.attachments) ? existing.attachments : [];
      const newAttachments = activityData.attachments;
      const removedAttachments = oldAttachments.filter((url: string) => !newAttachments.includes(url));

      if (removedAttachments.length > 0) {
        const filePaths = removedAttachments
          .map((url: string) => {
            const urlParts = url.split('/sales-activity-images/');
            return urlParts.length > 1 ? urlParts[1] : null;
          })
          .filter((path): path is string => path !== null);

        if (filePaths.length > 0) {
          try {
            await supabase.storage
              .from('sales-activity-images')
              .remove(filePaths);
            console.log(`Cleaned up ${filePaths.length} removed images for activity ${id}`);
          } catch (err) {
            console.error('Error removing files from storage:', err);
            // Don't throw - continue with update even if cleanup fails
          }
        }
      }
    }

    // If cms_id is provided but invalid, try to find by cms_code
    if (activityData.cms_id) {
      const { data: siteData } = await supabase
        .from('construction_management')
        .select('id, cms, site_name, site_address, client')
        .eq('id', activityData.cms_id)
        .single();

      if (siteData) {
        // Store snapshot data
        activityData.cms_code = siteData.cms;
        activityData.site_name = siteData.site_name;
        activityData.site_address = siteData.site_address;
        activityData.client = siteData.client;
      } else {
        // cms_id is invalid, set to null
        activityData.cms_id = undefined;
      }
    }

    // 다중 지점 사용자(송기정, 김태현)의 경우 branch에 따라 이름 suffix 추가
    let createdByName = userName;
    let updatedByName = userName;
    if ((userName === '송기정' || userName === '김태현') && activityData.branch) {
      if (activityData.branch === '인천') {
        createdByName = `${userName}(In)`;
        updatedByName = `${userName}(In)`;
      }
      // '본점'인 경우는 suffix 없이 그대로 사용
    }

    // branch 필드는 DB에 저장하지 않음 (created_by와 updated_by에 반영됨)
    const { branch, ...dataToUpdate } = activityData;

    const { data, error } = await supabase
      .from('sales_activities')
      .update({
        ...dataToUpdate,
        created_by: createdByName,  // 지점 변경 시 created_by도 업데이트
        updated_by: updatedByName,
      })
      .eq('id', id)
      .select('*, users!inner(name, department)')
      .single();

    if (error) {
      console.error('Error updating sales activity:', error);
      return { success: false, message: '영업 활동 수정에 실패했습니다.' };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in updateSalesActivity:', error);
    return { success: false, message: error.message || '영업 활동 수정에 실패했습니다.' };
  }
}

// Delete sales activity
export async function deleteSalesActivity(id: number, userRole: string, userId: string) {
  try {
    // Check permission
    const { data: existing } = await supabase
      .from('sales_activities')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return { success: false, message: '영업 활동을 찾을 수 없습니다.' };
    }

    // Only admin can delete
    if (userRole !== 'admin') {
      return { success: false, message: '삭제 권한이 없습니다. 관리자만 삭제할 수 있습니다.' };
    }

    // Clean up images from storage before deleting the record
    await cleanupActivityImages(id);

    const { error } = await supabase.from('sales_activities').delete().eq('id', id);

    if (error) {
      console.error('Error deleting sales activity:', error);
      return { success: false, message: '영업 활동 삭제에 실패했습니다.' };
    }

    return { success: true, message: '영업 활동이 삭제되었습니다.' };
  } catch (error: any) {
    console.error('Error in deleteSalesActivity:', error);
    return { success: false, message: error.message || '영업 활동 삭제에 실패했습니다.' };
  }
}

// Get all users (for admin filter)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, department')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return { success: false, message: '사용자 목록을 불러오지 못했습니다.' };
    }

    // Expand multi-branch users (송기정, 김태현) into separate entries
    const expandedData = [];
    for (const user of data) {
      if (user.name === '송기정' || user.name === '김태현') {
        // Add entry for headquarters (본점)
        expandedData.push({
          id: user.id,
          name: user.name,
          department: user.department,
          created_by: user.name, // Filter value for 본점
          display_name: `${user.name} (${user.department})` // Display text
        });
        // Add entry for Incheon branch (인천)
        expandedData.push({
          id: user.id,
          name: `${user.name}(In)`,
          department: user.department,
          created_by: `${user.name}(In)`, // Filter value for 인천
          display_name: `${user.name}(In) (${user.department})` // Display text
        });
      } else {
        expandedData.push({
          id: user.id,
          name: user.name,
          department: user.department,
          created_by: undefined, // Regular users don't need created_by filter
          display_name: `${user.name} (${user.department})`
        });
      }
    }

    return { success: true, data: expandedData };
  } catch (error: any) {
    console.error('Error in getAllUsers:', error);
    return { success: false, message: error.message || '사용자 목록을 불러오지 못했습니다.' };
  }
}

// Cleanup activity images from Supabase Storage
async function cleanupActivityImages(activityId: number) {
  try {
    const { data: activity } = await supabase
      .from('sales_activities')
      .select('attachments')
      .eq('id', activityId)
      .single();

    if (activity?.attachments && Array.isArray(activity.attachments) && activity.attachments.length > 0) {
      const filePaths = activity.attachments
        .map((url: string) => {
          // Extract file path from URL
          // URL format: https://{project}.supabase.co/storage/v1/object/public/sales-activity-images/{path}
          const urlParts = url.split('/sales-activity-images/');
          return urlParts.length > 1 ? urlParts[1] : null;
        })
        .filter((path): path is string => path !== null);

      if (filePaths.length > 0) {
        const { error } = await supabase.storage
          .from('sales-activity-images')
          .remove(filePaths);

        if (error) {
          console.error('Error removing files from storage:', error);
          // Don't throw - cleanup is best effort
        } else {
          console.log(`Cleaned up ${filePaths.length} images for activity ${activityId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up activity images:', error);
    // Don't throw - cleanup is best effort
  }
}
