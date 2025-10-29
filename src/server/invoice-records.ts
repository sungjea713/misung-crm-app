import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 숫자 문자열 파싱 헬퍼 함수 (쉼표 제거)
function parseAmountString(amountStr: string | null | undefined): number {
  if (!amountStr) return 0;
  // 쉼표 제거 후 숫자로 변환
  const cleaned = amountStr.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// 현장 검색 (construction_management 테이블) - weekly-plans와 동일
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

// site_summary에서 매출/매입 금액 조회
export async function getSiteSummary(cmsCode: string) {
  try {
    const { data, error } = await supabase
      .from('site_summary')
      .select('sales_amount, purchase_amount')
      .eq('cms', cmsCode)
      .single();

    if (error) {
      console.warn('Site summary not found for cms:', cmsCode);
      return { success: true, data: null };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching site summary:', error);
    return { success: false, message: error.message };
  }
}

// 계산서 발행 목록 조회
export async function getInvoiceRecords(filters: {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}) {
  try {
    const { user_id, year, month, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 날짜 범위 계산 (invoice_date 기준)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 날짜를 YYYY-MM-DD 형식으로 변환
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let query = supabase
      .from('invoice_records')
      .select('*, users!inner(name, department)', { count: 'exact' })
      .gte('invoice_date', startDateStr)
      .lte('invoice_date', endDateStr)
      .order('invoice_date', { ascending: false })
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
    console.error('Error fetching invoice records:', error);
    return { success: false, message: error.message };
  }
}

// 계산서 발행 상세 조회
export async function getInvoiceRecord(id: number) {
  try {
    const { data, error } = await supabase
      .from('invoice_records')
      .select('*, users!inner(name, department)')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching invoice record:', error);
    return { success: false, message: error.message };
  }
}

// 계산서 발행 생성
export async function createInvoiceRecord(invoiceData: any, userId: string, userName: string) {
  try {
    // cms_id 검증 및 cms_code로 찾기
    if (invoiceData.cms_id) {
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', invoiceData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', invoiceData.cms_id);
        invoiceData.cms_id = null;
      }
    }

    if (!invoiceData.cms_id && invoiceData.cms_code) {
      console.log('Trying to find site by cms_code:', invoiceData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', invoiceData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        invoiceData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', invoiceData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', invoiceData.cms_code);
      }
    }

    // site_summary에서 매출/매입 금액 가져오기
    let salesAmount = '0';
    let purchaseAmount = '0';
    let profitDifference = 0;
    let isOverInvested = false;

    if (invoiceData.cms_code) {
      const summaryResult = await getSiteSummary(invoiceData.cms_code);
      if (summaryResult.success && summaryResult.data) {
        salesAmount = summaryResult.data.sales_amount || '0';
        purchaseAmount = summaryResult.data.purchase_amount || '0';

        // 차액 계산 (문자열 → 숫자 변환)
        const salesNum = parseAmountString(salesAmount);
        const purchaseNum = parseAmountString(purchaseAmount);
        profitDifference = salesNum - purchaseNum;
        isOverInvested = profitDifference < 0;

        console.log('Site summary found:', {
          cms: invoiceData.cms_code,
          salesAmount,
          purchaseAmount,
          profitDifference,
          isOverInvested,
        });
      } else {
        console.warn('No site summary found for cms:', invoiceData.cms_code);
      }
    }

    const { data, error } = await supabase
      .from('invoice_records')
      .insert({
        user_id: userId,
        cms_id: invoiceData.cms_id,
        cms_code: invoiceData.cms_code,
        site_name: invoiceData.site_name,
        site_address: invoiceData.site_address,
        sales_manager: invoiceData.sales_manager,
        construction_manager: invoiceData.construction_manager,
        sales_amount: salesAmount,
        purchase_amount: purchaseAmount,
        profit_difference: profitDifference,
        is_over_invested: isOverInvested,
        invoice_date: invoiceData.invoice_date,
        invoice_amount: invoiceData.invoice_amount,
        created_by: userName,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating invoice record:', error);
    return { success: false, message: error.message };
  }
}

// 계산서 발행 수정
export async function updateInvoiceRecord(
  id: number,
  invoiceData: any,
  userId: string,
  userName: string,
  userRole?: string
) {
  try {
    // 권한 확인: admin이면 모두 수정 가능, 일반 사용자는 본인 것만 수정 가능
    const { data: existingRecord, error: fetchError } = await supabase
      .from('invoice_records')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingRecord.user_id !== userId) {
      return { success: false, message: '수정 권한이 없습니다.' };
    }

    // cms_id 검증 및 cms_code로 찾기
    if (invoiceData.cms_id) {
      const { data: siteExists, error: checkError } = await supabase
        .from('construction_management')
        .select('id')
        .eq('id', invoiceData.cms_id)
        .single();

      if (checkError || !siteExists) {
        console.error('Site not found by cms_id:', invoiceData.cms_id);
        invoiceData.cms_id = null;
      }
    }

    if (!invoiceData.cms_id && invoiceData.cms_code) {
      console.log('Trying to find site by cms_code:', invoiceData.cms_code);
      const { data: sites, error: searchError } = await supabase
        .from('construction_management')
        .select('id, cms')
        .eq('cms', invoiceData.cms_code);

      if (!searchError && sites && sites.length > 0) {
        invoiceData.cms_id = sites[0].id;
        console.log('Found site by cms_code, set cms_id to:', invoiceData.cms_id);
      } else {
        console.warn('Site not found by cms_code:', invoiceData.cms_code);
      }
    }

    // site_summary에서 매출/매입 금액 가져오기
    let salesAmount = '0';
    let purchaseAmount = '0';
    let profitDifference = 0;
    let isOverInvested = false;

    if (invoiceData.cms_code) {
      const summaryResult = await getSiteSummary(invoiceData.cms_code);
      if (summaryResult.success && summaryResult.data) {
        salesAmount = summaryResult.data.sales_amount || '0';
        purchaseAmount = summaryResult.data.purchase_amount || '0';

        const salesNum = parseAmountString(salesAmount);
        const purchaseNum = parseAmountString(purchaseAmount);
        profitDifference = salesNum - purchaseNum;
        isOverInvested = profitDifference < 0;

        console.log('Site summary found:', {
          cms: invoiceData.cms_code,
          salesAmount,
          purchaseAmount,
          profitDifference,
          isOverInvested,
        });
      } else {
        console.warn('No site summary found for cms:', invoiceData.cms_code);
      }
    }

    const { data, error } = await supabase
      .from('invoice_records')
      .update({
        cms_id: invoiceData.cms_id,
        cms_code: invoiceData.cms_code,
        site_name: invoiceData.site_name,
        site_address: invoiceData.site_address,
        sales_manager: invoiceData.sales_manager,
        construction_manager: invoiceData.construction_manager,
        sales_amount: salesAmount,
        purchase_amount: purchaseAmount,
        profit_difference: profitDifference,
        is_over_invested: isOverInvested,
        invoice_date: invoiceData.invoice_date,
        invoice_amount: invoiceData.invoice_amount,
        updated_by: userName,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating invoice record:', error);
    return { success: false, message: error.message };
  }
}

// 계산서 발행 삭제
export async function deleteInvoiceRecord(id: number, userId: string, userRole?: string) {
  try {
    // 권한 확인: admin이면 모두 삭제 가능, 일반 사용자는 본인 것만 삭제 가능
    const { data: existingRecord, error: fetchError } = await supabase
      .from('invoice_records')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // admin이 아니고 본인 것이 아니면 거부
    if (userRole !== 'admin' && existingRecord.user_id !== userId) {
      return { success: false, message: '삭제 권한이 없습니다.' };
    }

    const { error } = await supabase.from('invoice_records').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting invoice record:', error);
    return { success: false, message: error.message };
  }
}
