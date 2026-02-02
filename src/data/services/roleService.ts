import apiClient from '../../config/apiClient';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  organizationCode: string;
  permissions: string[]; // Permission IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface RoleResponse {
  success: boolean;
  data: any;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

const roleService = {
  /**
   * Get all roles with optional filters
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      isActive?: boolean;
    }
  ): Promise<{ roles: Role[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }

      const response = await apiClient.get<RoleResponse>(
        `/roles?${params.toString()}`
      );

      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          roles: response.data.data,
          pagination: response.data.pagination,
        };
      }

      return { roles: [], pagination: null };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch roles'
      );
    }
  },

  /**
   * Get single role by ID
   */
  async getById(id: string): Promise<Role> {
    try {
      const response = await apiClient.get<RoleResponse>(`/roles/${id}`);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Role;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Role not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch role');
    }
  },

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get<RoleResponse>(
        `/roles/permissions/all`
      );
      if (Array.isArray(response.data.data)) {
        return response.data.data as Permission[];
      }
      return [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch permissions'
      );
    }
  },

  /**
   * Create new role
   */
  async create(data: CreateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.post<RoleResponse>('/roles', data);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Role;
    } catch (error: any) {
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.includes('name')) {
          throw new Error('Role name already exists in this organization');
        }
        throw new Error('Invalid input data');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to create role'
      );
    }
  },

  /**
   * Update role
   */
  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await apiClient.put<RoleResponse>(`/roles/${id}`, data);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Role;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Role not found');
      }
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.includes('built-in')) {
          throw new Error('Cannot modify built-in roles');
        }
        throw new Error(error.response?.data?.error || 'Cannot update this role');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to update role'
      );
    }
  },

  /**
   * Delete role
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Role not found');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.error ||
            'Cannot delete this role (might be built-in or has active assignments)'
        );
      }
      throw new Error(
        error.response?.data?.error || 'Failed to delete role'
      );
    }
  },

  /**
   * Assign role to staff
   */
  async assignToStaff(roleId: string, staffId: string): Promise<any> {
    try {
      const response = await apiClient.post(`/roles/${roleId}/assign`, {
        staffId,
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Role or staff not found');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to assign role to staff'
      );
    }
  },

  /**
   * Remove role from staff
   */
  async removeFromStaff(roleId: string, staffId: string): Promise<void> {
    try {
      await apiClient.delete(`/roles/${roleId}/unassign`, {
        params: { staffId },
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Role or staff not found');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to remove role from staff'
      );
    }
  },
};

export default roleService;
