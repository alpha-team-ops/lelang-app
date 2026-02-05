import axios from 'axios';

// Create a specialized client for images API
const imageClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/images`,
  timeout: 30000, // Longer timeout for image upload
});

// Add token to requests if available
imageClient.interceptors.request.use((config) => {
  // Try portal token first (for portal users)
  const portalToken = sessionStorage.getItem('portalToken');
  // Fallback to access token (for staff users)
  const accessToken = localStorage.getItem('accessToken');
  const token = portalToken || accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error interceptor
imageClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export interface ImageUploadResponse {
  success: boolean;
  data: {
    id: string;
    url: string;
    path: string;
  };
  message?: string;
}

export interface BulkImageUploadResponse {
  success: boolean;
  data: {
    images: Array<{
      id: string;
      url: string;
      path: string;
    }>;
    count: number;
    errors: any;
  } | Array<{
    id: string;
    url: string;
    path: string;
  }>;
  message?: string;
}

export const imageService = {
  /**
   * Upload a single image
   * @param file The image file to upload
   * @returns Promise containing the uploaded image data with URL
   */
  uploadSingle: async (file: File): Promise<ImageUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await imageClient.post<ImageUploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload image';
      throw new Error(message);
    }
  },

  /**
   * Upload multiple images at once
   * @param files Array of image files to upload
   * @returns Promise containing array of uploaded image data with URLs
   */
  uploadBulk: async (files: File[]): Promise<BulkImageUploadResponse> => {
    try {
      if (files.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No files to upload',
        };
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await imageClient.post<BulkImageUploadResponse>('/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload images';
      throw new Error(message);
    }
  },
};
