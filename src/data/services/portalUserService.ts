import apiClient from '../../config/apiClient';

export interface PortalUser {
  id: string;
  fullName: string;
  email: string;
  corporateIdNip: string;
  directorate: string;
  directoriateId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePortalUserRequest {
  fullName: string;
  email: string;
  corporateIdNip: string;
  directoriateId: string;
}

export interface UpdatePortalUserStatusRequest {
  isActive: boolean;
}

export interface ListPortalUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PortalUserResponse {
  success: boolean;
  data: PortalUser | PortalUser[];
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  message?: string;
}

const portalUserService = {
  /**
   * Get all portal users with optional filters and pagination
   */
  async getAll(params?: ListPortalUsersParams): Promise<{
    portalUsers: PortalUser[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status && params.status !== 'ALL') {
        queryParams.append('status', params.status);
      }
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

      const response = await apiClient.get<PortalUserResponse>(
        `/admin/portal-users?${queryParams.toString()}`
      );

      return {
        portalUsers: Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data],
        pagination: response.data.pagination || {
          total: 0,
          per_page: 10,
          current_page: 1,
          last_page: 1,
        },
      };
    } catch (error) {
      console.error('Error fetching portal users:', error);
      throw error;
    }
  },

  /**
   * Get portal user detail by ID
   */
  async getById(id: string): Promise<PortalUser> {
    try {
      const response = await apiClient.get<PortalUserResponse>(
        `/admin/portal-users/${id}`
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;
    } catch (error) {
      console.error('Error fetching portal user:', error);
      throw error;
    }
  },

  /**
   * Create a new portal user
   */
  async create(data: CreatePortalUserRequest): Promise<PortalUser> {
    try {
      const response = await apiClient.post<PortalUserResponse>(
        '/admin/portal-users',
        data
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;
    } catch (error) {
      console.error('Error creating portal user:', error);
      throw error;
    }
  },

  /**
   * Toggle portal user status (ACTIVE/INACTIVE)
   */
  async toggleStatus(id: string, isActive: boolean): Promise<PortalUser> {
    try {
      const response = await apiClient.patch<PortalUserResponse>(
        `/admin/portal-users/${id}/toggle-status`,
        { isActive }
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;
    } catch (error) {
      console.error('Error toggling portal user status:', error);
      throw error;
    }
  },

  /**
   * Delete a portal user
   */
  async delete(id: string): Promise<{ id: string }> {
    try {
      const response = await apiClient.delete<PortalUserResponse>(
        `/admin/portal-users/${id}`
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;
    } catch (error) {
      console.error('Error deleting portal user:', error);
      throw error;
    }
  },

  /**
   * Get portal users statistics
   */
  async getStats(search?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);

      const response = await apiClient.get<{
        success: boolean;
        data: {
          total: number;
          active: number;
          inactive: number;
        };
      }>(`/admin/portal-users/stats?${queryParams.toString()}`);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching portal user stats:', error);
      return { total: 0, active: 0, inactive: 0 };
    }
  },
};

export default portalUserService;
