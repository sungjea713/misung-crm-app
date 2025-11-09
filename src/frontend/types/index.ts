// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  site: string;
  position: string;
  phone?: string;
  role: 'admin' | 'user';
  branch?: '본점' | '인천';  // Only for multi-branch users (송기정, 김태현)
  is_initial_password: boolean;
  auto_login: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  auto_login?: boolean;
}

export interface ChangePasswordData {
  current_password?: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  requires_password_change?: boolean;
}

// Menu Types
export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  children?: MenuItem[];
}

// Page Props
export interface PageProps {
  title: string;
  description?: string;
}

// Construction Management Types
export interface ConstructionSite {
  id: number;
  cms: string;
  site_name: string;
  site_address: string;
  client: string;
  department: string;
  sales_manager: string;
  construction_manager: string;
  order_month?: string;
  order_amount?: number;
  status?: string;
}

// Weekly Plan Types
export interface WeeklyPlan {
  id: number;
  user_id: string;
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  activity_construction_sales: boolean;
  activity_site_additional_sales: boolean;
  activity_site_support: boolean;
  target_sales?: number;
  target_order_sales_contribution?: number;
  target_order_profit_contribution?: number;
  target_order_total?: number;
  target_collection?: number;
  plan_type?: 'activity' | 'target' | 'both';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface WeeklyPlanFormData {
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  activity_construction_sales: boolean;
  activity_site_additional_sales: boolean;
  activity_site_support: boolean;
  target_sales?: number;
  target_order_sales_contribution?: number;
  target_order_profit_contribution?: number;
  target_order_total?: number;
  target_collection?: number;
  plan_type?: 'activity' | 'target' | 'both';
}

export interface WeeklyPlanFilters {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}

// Daily Plan Types
export interface DailyPlan {
  id: number;
  user_id: string;
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  activity_construction_sales: boolean;
  activity_site_additional_sales: boolean;
  activity_site_support: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface DailyPlanFormData {
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  activity_construction_sales: boolean;
  activity_site_additional_sales: boolean;
  activity_site_support: boolean;
}

export interface DailyPlanFilters {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}

// Activity Stats Types
export interface ActivityStats {
  construction: number;
  additional: number;
  support: number;
  total: number;
}

export interface MonthlyActivityStats {
  year: number;
  month: number;
  plan: ActivityStats;
  actual: ActivityStats;
  achievement: ActivityStats;
}

export interface ActivitySummary {
  plan: ActivityStats;
  actual: ActivityStats;
  achievement: ActivityStats;
}

export interface ActivityStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyActivityStats[];
    summary: ActivitySummary;
  };
  message?: string;
}

// Sales Stats Types
export interface MonthlySalesStats {
  month: number;
  revenue: number;      // 확정 매출 (원 단위)
  cost: number;         // 확정 매입 (원 단위)
  profit: number;       // 매출 이익 (원 단위)
  targetSales: number;  // 목표 매출 (원 단위)
}

export interface SalesSummary {
  revenue: number;
  cost: number;
  profit: number;
  targetSales: number;
}

export interface SalesStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlySalesStats[];
    summary: SalesSummary;
  };
  message?: string;
}

// Sales Activity Types
export interface SalesActivity {
  id: number;
  user_id: string;
  activity_date: string;
  activity_type: 'estimate' | 'contract';
  site_type: 'existing' | 'new';
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  client?: string;
  new_client?: string;        // 신규 현장 고객사
  new_site_name?: string;     // 신규 현장명
  amount?: number;
  execution_rate?: number;
  attachments: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  users?: {
    name: string;
    department: string;
  };
}

export interface SalesActivityFormData {
  activity_date: string;
  activity_type: 'estimate' | 'contract';
  site_type: 'existing' | 'new';
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  client?: string;
  new_client?: string;        // 신규 현장 고객사
  new_site_name?: string;     // 신규 현장명
  amount?: number;
  execution_rate?: number;
  attachments?: string[];
}

export interface SalesActivityFilters {
  user_id?: string;
  year: number;
  month: number;
  activity_type?: string;
  site_type?: string;
  page?: number;
  limit?: number;
}

// Invoice Record Types
export interface InvoiceRecord {
  id: number;
  user_id: string;
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  sales_amount?: string;           // 매출금액 (쉼표 포함 문자열)
  purchase_amount?: string;        // 매입금액 (쉼표 포함 문자열)
  profit_difference?: number;      // 매출금액 - 매입금액
  is_over_invested?: boolean;      // 과투입 여부
  invoice_date: string;            // 계산서 발행일 (YYYY-MM-DD)
  invoice_amount?: number;         // 계산서 금액
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  users?: {
    name: string;
    department: string;
  };
}

export interface InvoiceRecordFormData {
  cms_id?: number;
  cms_code?: string;
  site_name?: string;
  site_address?: string;
  sales_manager?: string;
  construction_manager?: string;
  invoice_date: string;
  invoice_amount?: number;
}

export interface InvoiceRecordFilters {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}

export interface SiteSummary {
  sales_amount?: string;
  purchase_amount?: string;
}

// Cost Efficiency Types
export interface MonthlyCostEfficiency {
  month: number;
  overInvestment: number;      // 과투입 (절대값)
  confirmedRevenue: number;    // 확정 매출
  difference: number;           // 편차
}

export interface CostEfficiencySummary {
  totalOverInvestment: number;
  totalConfirmedRevenue: number;
  totalDifference: number;
}

export interface CostEfficiencyStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyCostEfficiency[];
    summary: CostEfficiencySummary;
  };
  message?: string;
}

// Order Stats Types
export interface MonthlyOrderStats {
  month: number;
  salesContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  profitContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  total: {
    order: number;
    execution: number;
    profit: number;
  };
  targetSalesContribution: number;
  targetProfitContribution: number;
  targetTotal: number;
}

export interface OrderSummary {
  salesContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  profitContribution: {
    order: number;
    execution: number;
    profit: number;
  };
  total: {
    order: number;
    execution: number;
    profit: number;
  };
  targetSalesContribution: number;
  targetProfitContribution: number;
  targetTotal: number;
}

export interface OrderStatsResponse {
  success: boolean;
  data?: {
    monthly: MonthlyOrderStats[];
    summary: OrderSummary;
  };
  message?: string;
}
