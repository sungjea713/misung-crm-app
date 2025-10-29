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
}

export interface WeeklyPlanFilters {
  user_id?: string;
  year: number;
  month: number;
  page?: number;
  limit?: number;
}
