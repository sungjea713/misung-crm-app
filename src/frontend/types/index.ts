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
