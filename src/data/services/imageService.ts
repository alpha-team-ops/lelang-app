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
      // Validate file before upload
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxFileSize = 10 * 1024 * 1024; // 10MB per file

      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error(`Unsupported file format: ${file.type}. Supported: JPEG, PNG, WebP, GIF`);
      }

      if (file.size > maxFileSize) {
        throw new Error(`File too large. Max size: 10MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await imageClient.post<ImageUploadResponse>('/upload', formData);

      return response.data;
    } catch (error: any) {
      // Get detailed error from response
      const errorData = error.response?.data;
      let message = 'Failed to upload image';
      
      if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.errors) {
        // Handle validation errors from Laravel
        message = typeof errorData.errors === 'string' 
          ? errorData.errors 
          : Object.values(errorData.errors)[0] as string;
      }
      
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

      // Validate files before upload
      const validatedFiles: File[] = [];
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxFileSize = 10 * 1024 * 1024; // 10MB per file

      for (const file of files) {
        // Check file type
        if (!allowedMimeTypes.includes(file.type)) {
          continue;
        }

        // Check file size
        if (file.size > maxFileSize) {
          continue;
        }

        validatedFiles.push(file);
      }

      if (validatedFiles.length === 0) {
        throw new Error('No valid image files to upload. Supported formats: JPEG, PNG, WebP, GIF. Max size: 10MB per file');
      }

      const formData = new FormData();
      validatedFiles.forEach((file, idx) => {
        formData.append(`files[${idx}]`, file);
      });
      
      const response = await imageClient.post<BulkImageUploadResponse>('/bulk-upload', formData);

      return response.data;
    } catch (error: any) {
      // Get detailed error from response
      const errorData = error.response?.data;
      let message = 'Failed to upload images';
      
      if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.errors) {
        // Handle validation errors from Laravel
        if (typeof errorData.errors === 'string') {
          message = errorData.errors;
        } else if (Array.isArray(errorData.errors)) {
          message = errorData.errors.join(', ');
        } else {
          message = Object.values(errorData.errors).flat().join(', ');
        }
      }
      
      throw new Error(message);
    }
  },
};
