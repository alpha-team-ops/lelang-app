import apiClient from '../../config/apiClient';

export interface Directorate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateDirectorateRequest {
  name: string;
  description?: string;
}

export interface DirectorateResponse {
  success: boolean;
  data: Directorate | Directorate[] | { id: string };
  message?: string;
  errorCode?: string;
}

const directorateService = {
  /**
   * Get all directorates for the organization
   */
  async getAll(): Promise<Directorate[]> {
    try {
      const response = await apiClient.get<DirectorateResponse>(
        '/admin/directorates'
      );
      return Array.isArray(response.data.data)
        ? response.data.data
        : [response.data.data as Directorate];
    } catch (error) {
      console.error('Error fetching directorates:', error);
      throw error;
    }
  },

  /**
   * Create a new directorate
   */
  async create(data: CreateDirectorateRequest): Promise<Directorate> {
    try {
      const response = await apiClient.post<DirectorateResponse>(
        '/admin/directorates',
        data
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as Directorate);
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 422) {
        const errorCode = error.response?.data?.errorCode;
        if (errorCode === 'DUPLICATE_DIRECTORATE') {
          throw new Error('Directorate with this name already exists');
        }
      }
      console.error('Error creating directorate:', error);
      throw error;
    }
  },

  /**
   * Delete a directorate
   */
  async delete(id: string): Promise<{ id: string }> {
    try {
      const response = await apiClient.delete<DirectorateResponse>(
        `/admin/directorates/${id}`
      );
      return Array.isArray(response.data.data)
        ? response.data.data[0]
        : (response.data.data as { id: string });
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 422) {
        const errorCode = error.response?.data?.errorCode;
        if (errorCode === 'DIRECTORATE_IN_USE') {
          throw new Error(error.response?.data?.message || 'Cannot delete directorate. It is in use.');
        }
      }
      console.error('Error deleting directorate:', error);
      throw error;
    }
  },
};

export default directorateService;
