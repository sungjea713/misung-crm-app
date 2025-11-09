import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MonthlyOverInvestmentRow {
  manager_name: string;
  amount: number;
}

interface MonthlyOverInvestmentData {
  year: number;
  month: number;
  rows: MonthlyOverInvestmentRow[];
}

// 월별 과투입 데이터 조회
export async function getMonthlyOverInvestment(year: number, month: number) {
  try {
    const { data, error } = await supabase
      .from('monthly_over_investment')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('manager_name', { ascending: true });

    if (error) {
      console.error('Error fetching monthly over investment:', error);
      return { success: false, message: '데이터를 불러오지 못했습니다.' };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in getMonthlyOverInvestment:', error);
    return { success: false, message: error.message || '데이터를 불러오지 못했습니다.' };
  }
}

// 월별 과투입 데이터 저장/수정 (기존 데이터 삭제 후 새로 삽입)
export async function saveMonthlyOverInvestment(data: MonthlyOverInvestmentData, createdBy: string) {
  try {
    const { year, month, rows } = data;

    // 1. 기존 데이터 삭제
    const { error: deleteError } = await supabase
      .from('monthly_over_investment')
      .delete()
      .eq('year', year)
      .eq('month', month);

    if (deleteError) {
      console.error('Error deleting existing data:', deleteError);
      return { success: false, message: '기존 데이터 삭제에 실패했습니다.' };
    }

    // 2. 새 데이터 삽입
    const insertData = rows.map(row => ({
      year,
      month,
      manager_name: row.manager_name,
      amount: row.amount,
      created_by: createdBy,
    }));

    const { error: insertError } = await supabase
      .from('monthly_over_investment')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting new data:', insertError);
      return { success: false, message: '데이터 저장에 실패했습니다.' };
    }

    return { success: true, message: '데이터가 저장되었습니다.' };
  } catch (error: any) {
    console.error('Error in saveMonthlyOverInvestment:', error);
    return { success: false, message: error.message || '데이터 저장에 실패했습니다.' };
  }
}

// 월별 과투입 데이터 삭제
export async function deleteMonthlyOverInvestment(year: number, month: number) {
  try {
    const { error } = await supabase
      .from('monthly_over_investment')
      .delete()
      .eq('year', year)
      .eq('month', month);

    if (error) {
      console.error('Error deleting monthly over investment:', error);
      return { success: false, message: '데이터 삭제에 실패했습니다.' };
    }

    return { success: true, message: '데이터가 삭제되었습니다.' };
  } catch (error: any) {
    console.error('Error in deleteMonthlyOverInvestment:', error);
    return { success: false, message: error.message || '데이터 삭제에 실패했습니다.' };
  }
}
