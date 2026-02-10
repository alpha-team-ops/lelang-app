import axios from 'axios';
import type { Auction, PortalAuction } from '../types/index';

// Create a specialized client for auctions API (admin endpoints)
const auctionClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/admin/auctions`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a specialized client for portal (public) auctions
const portalClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/auctions`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
auctionClient.interceptors.request.use((config) => {
  // Try access token for admin
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Add token to portal requests if available, and add invitation_code from storage
// Backend Priority:
// 1. Bearer token (FULL access with portalToken)
// 2. X-Portal-Code header (from localStorage after login)
// 3. invitation_code parameter (fallback)
// 4. Auth user (staff with accessToken)
portalClient.interceptors.request.use((config) => {
  // 1. Bearer Token (highest priority)
  // Try portal token first (for portal users with FULL access)
  const portalToken = sessionStorage.getItem('portalToken') || localStorage.getItem('portalToken');
  // Fallback to access token (for staff users viewing as portal)
  const accessToken = localStorage.getItem('accessToken');
  const token = portalToken || accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. X-Portal-Code Header (second priority)
  // This is sent after successful portal login
  const portalCode = localStorage.getItem('portalCode');
  if (portalCode) {
    config.headers['X-Portal-Code'] = portalCode;
  }

  // Initialize params if it doesn't exist
  if (!config.params) {
    config.params = {};
  }

  // 3. invitation_code parameter (fallback for old method)
  if (!config.params.invitation_code) {
    // Try to get from localStorage (saved from URL or portal login)
    const storedInvitationCode = localStorage.getItem('invitationCode');
    if (storedInvitationCode) {
      config.params.invitation_code = storedInvitationCode;
    }
  }

  return config;
});

// Helper function to convert snake_case to camelCase
const convertSnakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertSnakeToCamel);
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      result[camelKey] = convertSnakeToCamel(obj[key]);
    }
  }
  return result;
};

// Add response interceptor for admin auctions
auctionClient.interceptors.response.use(
  (response) => {
    // Transform snake_case to camelCase
    if (response.data && response.data.data) {
      response.data.data = convertSnakeToCamel(response.data.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for portal auctions
portalClient.interceptors.response.use(
  (response) => {
    // Transform snake_case to camelCase
    if (response.data && response.data.data) {
      response.data.data = convertSnakeToCamel(response.data.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface CreateAuctionRequest {
  title: string;
  description?: string;
  category?: string;
  condition?: string;
  serialNumber?: string;
  itemLocation?: string;
  purchaseYear?: number;
  startingPrice: number;
  bidIncrement: number;
  startTime?: string | null;
  endTime?: string | null;
  images?: string[];
}

export interface UpdateAuctionRequest {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  serialNumber?: string;
  itemLocation?: string;
  purchaseYear?: number;
  startingPrice?: number;
  bidIncrement?: number;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  images?: string[];
}

export const auctionService = {
  // Admin Auctions
  getAllAdminAuctions: async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      category?: string;
      sort?: string;
      order?: string;
    }
  ): Promise<{ auctions: Auction[]; pagination: any }> => {
    try {
      const params = {
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.sort && { sort: filters.sort }),
        ...(filters?.order && { order: filters.order }),
      };

      const response = await auctionClient.get('', { params });

      return {
        auctions: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch auctions';
      throw new Error(message);
    }
  },

  getAdminAuctionById: async (id: string): Promise<Auction | null> => {
    try {
      const response = await auctionClient.get(`/${id}`);

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch auction';
      throw new Error(message);
    }
  },

  getAuctionsByStatus: async (status: string, page: number = 1, limit: number = 10): Promise<{ auctions: Auction[]; pagination: any }> => {
    try {
      const response = await auctionClient.get(`/status/${status}`, {
        params: { page, limit },
      });

      return {
        auctions: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to fetch ${status} auctions`;
      throw new Error(message);
    }
  },

  createAuction: async (data: CreateAuctionRequest): Promise<Auction> => {
    try {
      // Convert camelCase to snake_case for API
      // Only include fields that have values (backend will use defaults for optional fields)
      const payload: any = {
        title: data.title,
        starting_price: data.startingPrice,
        bid_increment: data.bidIncrement,
      };

      // Add optional fields only if provided
      if (data.description) payload.description = data.description;
      if (data.category) payload.category = data.category;
      if (data.condition) payload.condition = data.condition;
      if (data.serialNumber) payload.serial_number = data.serialNumber;
      if (data.itemLocation) payload.item_location = data.itemLocation;
      if (data.purchaseYear) payload.purchase_year = data.purchaseYear;
      
      // Images: send array of image URLs
      if (data.images && data.images.length > 0) {
        payload.images = data.images;
      }
      
      // Date/time are optional
      // If start_time is provided, it must be after now (validated in FE)
      // If end_time is provided, it must be after start_time (validated in FE)
      // Only add if they have actual values (not empty string)
      if (data.startTime && data.startTime.trim()) payload.start_time = data.startTime;
      if (data.endTime && data.endTime.trim()) payload.end_time = data.endTime;
      
      const response = await auctionClient.post('', payload);

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create auction';
      const errors = error.response?.data?.errors;
      const errorMsg = errors ? `${message}: ${JSON.stringify(errors)}` : message;
      console.error('API Error:', error.response?.data);
      throw new Error(errorMsg);
    }
  },

  updateAuction: async (id: string, data: UpdateAuctionRequest): Promise<Auction> => {
    try {
      // Convert camelCase to snake_case for API
      const payload: any = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.description !== undefined) payload.description = data.description;
      if (data.category !== undefined) payload.category = data.category;
      if (data.condition !== undefined) payload.condition = data.condition;
      if (data.serialNumber !== undefined) payload.serial_number = data.serialNumber;
      if (data.itemLocation !== undefined) payload.item_location = data.itemLocation;
      if (data.purchaseYear !== undefined) payload.purchase_year = data.purchaseYear;
      if (data.startingPrice !== undefined) payload.starting_price = data.startingPrice;
      if (data.bidIncrement !== undefined) payload.bid_increment = data.bidIncrement;
      if (data.startTime !== undefined) payload.start_time = data.startTime;
      if (data.endTime !== undefined) payload.end_time = data.endTime;
      if (data.status !== undefined) payload.status = data.status;
      if (data.images !== undefined) payload.images = data.images;

      const response = await auctionClient.put(`/${id}`, payload);

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update auction';
      throw new Error(message);
    }
  },

  deleteAuction: async (id: string): Promise<void> => {
    try {
      await auctionClient.delete(`/${id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete auction';
      throw new Error(message);
    }
  },

  // Portal Auctions (User-facing) - LIVE and ENDED auctions
  getAllPortalAuctions: async (
    page: number = 1,
    limit: number = 10,
    filters?: { category?: string }
  ): Promise<{ auctions: PortalAuction[]; pagination: any }> => {
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.category && { category: filters.category }),
      };

      // GET /api/v1/auctions - List all LIVE auctions
      // Authorization header with portalToken will be added by interceptor
      const response = await portalClient.get('', { params });

      return {
        auctions: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch portal auctions';
      throw new Error(message);
    }
  },

  getPortalAuctionById: async (id: string): Promise<PortalAuction | null> => {
    try {
      // GET /api/v1/auctions/{id} - Show LIVE + ENDED auctions
      // Authorization header with portalToken will be added by interceptor
      const response = await portalClient.get(`/${id}`);
      return response.data.data;
    } catch (error: any) {
      return null;
    }
  },

  searchAuctions: async (query: string, category?: string, page: number = 1, limit: number = 10): Promise<PortalAuction[]> => {
    try {
      const params: any = {
        query,
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
      };

      // GET /api/v1/auctions/search - Search LIVE auctions
      // Authorization header with portalToken will be added by interceptor
      const response = await portalClient.get('/search', { params });

      return response.data.data || [];
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to search auctions';
      throw new Error(message);
    }
  },

  getAuctionsByCategory: async (category: string, page: number = 1, limit: number = 10): Promise<PortalAuction[]> => {
    try {
      const params: any = { 
        page: page.toString(), 
        limit: limit.toString() 
      };

      // GET /api/v1/auctions/category/{category} - Filter LIVE by category
      // Authorization header with portalToken will be added by interceptor
      const response = await portalClient.get(`/category/${category}`, { params });

      return response.data.data || [];
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch auctions by category';
      throw new Error(message);
    }
  },

  // Increment view count when user views auction detail
  incrementViewCount: async (auctionId: string): Promise<void> => {
    try {
      // POST /api/v1/auctions/{id}/view - Record view count
      await portalClient.post(`/${auctionId}/view`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to track view';
      throw new Error(message);
    }
  },
};
