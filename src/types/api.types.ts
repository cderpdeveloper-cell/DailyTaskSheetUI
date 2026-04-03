export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string | null;
  data: T;
  errors: Record<string, string[]> | null;
}

export interface MenuItem {
  moduleId: number;
  name: string;
  controller: string | null;
  action: string | null;
  icon: string | null;
  url: string | null;
  parentId: number | null;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  displayOrder: number;
  subMenus: MenuItem[];
}

export interface User {
  id: string;
  employeeID?: number;
  userName: string;
  email: string;
  roleId: number;
  roleName?: string;
  roleType?: string;
  companyId: number;
  isTenant: boolean;
}

export interface Company {
  companyId: number;
  companyName: string;
  email: string | null;
  phoneNo: string | null;
  website: string | null;
  fullAddress: string | null;
  logoUrl: string | null;
  activeStatus: number;
  createDate: string;
  guids: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LookupData {
  id: number;
  name: string;
  lookupName: string;
  icon: string | null;
  activeStatus: number;
  displayOrder: number;
}
