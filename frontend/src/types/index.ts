export type UserRole = 'manager' | 'specialist';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  employee_id?: string;
  profile_picture?: string;
  is_active: boolean;
  created_at: string;
  team_member_id?: number;
  team_name?: string;
  is_approved?: boolean;
  manager_login?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
