import apiClient from '../../config/apiClient';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
  lastActivity: string;
  organizationCode: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  roleId: string;  // Changed from 'role' to 'roleId' (UUID)
}

export interface UpdateStaffRequest {
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  roleId?: string;  // Changed from 'role' to 'roleId' (UUID)
}

export interface StaffResponse {
  success: boolean;
  data: Staff | Staff[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const staffService = {
  /**
   * Get all staff members with optional filters
   */
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: 'ACTIVE' | 'INACTIVE';
      role?: 'ADMIN' | 'MODERATOR';
      search?: string;
    }
  ): Promise<{ staff: Staff[]; pagination: any }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<StaffResponse>(
        `/staff?${params.toString()}`
      );

      if (response.data.data && Array.isArray(response.data.data)) {
        return {
          staff: response.data.data,
          pagination: response.data.pagination,
        };
      }

      return { staff: [], pagination: null };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.error || 'Failed to fetch staff members'
      );
    }
  },

  /**
   * Get single staff member by ID
   */
  async getById(id: string): Promise<Staff> {
    try {
      const response = await apiClient.get<StaffResponse>(`/staff/${id}`);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Staff;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Staff member not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch staff');
    }
  },

  /**
   * Create new staff member
   */
  async create(data: CreateStaffRequest): Promise<Staff> {
    try {
      const response = await apiClient.post<StaffResponse>('/staff', data);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Staff;
    } catch (error: any) {
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.includes('email')) {
          throw new Error('Email already exists in this organization');
        }
        throw new Error('Invalid input data');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to create staff member'
      );
    }
  },

  /**
   * Update staff member
   */
  async update(id: string, data: UpdateStaffRequest): Promise<Staff> {
    try {
      const response = await apiClient.put<StaffResponse>(`/staff/${id}`, data);
      if (Array.isArray(response.data.data)) {
        return response.data.data[0];
      }
      return response.data.data as Staff;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Staff member not found');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.error || 'Cannot update this staff member');
      }
      throw new Error(
        error.response?.data?.error || 'Failed to update staff member'
      );
    }
  },

  /**
   * Delete staff member
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/staff/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Staff member not found');
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.error ||
            'Cannot delete this staff member (might be critical role)'
        );
      }
      throw new Error(
        error.response?.data?.error || 'Failed to delete staff member'
      );
    }
  },

  /**
   * Update last activity (internal - called on user action)
   */
  async updateActivity(id: string): Promise<void> {
    try {
      await apiClient.put(`/staff/${id}/activity`, {
        lastActivity: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
      // Don't throw - this is non-critical
    }
  },
};

export default staffService;
