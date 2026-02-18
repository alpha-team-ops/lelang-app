import apiClient from '../../config/apiClient';

export const itemManagementService = {
  // Get categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get('/organization/items/categories');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  // Get conditions
  async getConditions(): Promise<string[]> {
    try {
      const response = await apiClient.get('/organization/items/conditions');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  // Add category
  async addCategory(name: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/organization/items/categories', { name });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add category' 
      };
    }
  },

  // Add condition
  async addCondition(name: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/organization/items/conditions', { name });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add condition' 
      };
    }
  },

  // Update category
  async updateCategory(oldName: string, newName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.put(`/organization/items/categories/${encodeURIComponent(oldName)}`, { name: newName });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update category' 
      };
    }
  },

  // Update condition
  async updateCondition(oldName: string, newName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.put(`/organization/items/conditions/${encodeURIComponent(oldName)}`, { name: newName });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update condition' 
      };
    }
  },

  // Delete category
  async deleteCategory(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete(`/organization/items/categories/${encodeURIComponent(name)}`);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete category' 
      };
    }
  },

  // Delete condition
  async deleteCondition(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete(`/organization/items/conditions/${encodeURIComponent(name)}`);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete condition' 
      };
    }
  },

  // Reorder categories
  async reorderCategories(items: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.put('/organization/items/categories/reorder', { items });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to reorder categories' 
      };
    }
  },

  // Reorder conditions
  async reorderConditions(items: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.put('/organization/items/conditions/reorder', { items });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to reorder conditions' 
      };
    }
  },
};

export default itemManagementService;
