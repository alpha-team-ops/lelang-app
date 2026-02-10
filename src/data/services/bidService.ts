import axios from 'axios';
import type { BidActivity } from '../types/index';

// Create a specialized client for bids API (public)
const bidClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/bids`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a specialized client for admin bids API (authenticated, auto-filters by organization)
const adminBidClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/admin/bids`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
bidClient.interceptors.request.use((config) => {
  // Priority 1: Try portal token first (for portal users with FULL access)
  // Check both sessionStorage (current session) and localStorage (persistent)
  const portalTokenSession = sessionStorage.getItem('portalToken');
  const portalTokenLocal = localStorage.getItem('portalToken');
  const portalToken = portalTokenSession || portalTokenLocal;
  
  // Priority 2: Fallback to access token (for staff users)
  const accessToken = localStorage.getItem('accessToken');
  const token = portalToken || accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Also add X-Portal-Code header if available (for backend fallback)
  const portalCode = localStorage.getItem('portalCode');
  if (portalCode) {
    config.headers['X-Portal-Code'] = portalCode;
  }
  
  return config;
});

// Add token to admin requests (for authenticated admin users)
adminBidClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export interface PlaceBidRequest {
  auctionId: string;
  bidAmount: number;
}

export interface GetBidActivityRequest {
  auctionId?: string;
  page?: number;
  limit?: number;
}

export const bidService = {
  // Place a new bid (requires authentication)
  placeBid: async (request: PlaceBidRequest): Promise<{ id: string; bidAmount: number; status: string; timestamp: string }> => {
    try {
      const response = await bidClient.post('/place', {
        auctionId: request.auctionId,
        bidAmount: request.bidAmount,
      });

      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      const errorCode = error.response?.data?.code;
      
      // Map error codes to user-friendly messages
      const errorMap: { [key: string]: string } = {
        BID_TOO_LOW: 'Bid amount is too low. Please enter a higher bid.',
        AUCTION_NOT_FOUND: 'Auction not found.',
        AUCTION_NOT_LIVE: 'This auction is not currently active.',
        CANNOT_BID_OWN_AUCTION: 'You cannot bid on your own auction.',
        ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
        BID_AFTER_END: 'This auction has already ended.',
        RATE_LIMIT_EXCEEDED: 'Too many bids. Please wait before placing another bid.',
        INVALID_TOKEN: 'Your session has expired. Please login again.',
        MISSING_TOKEN: 'Authentication required. Please login to bid.',
      };

      const message = errorMap[errorCode] || errorMessage || 'Failed to place bid';
      throw new Error(message);
    }
  },

  // Get bid activity for a specific auction (authenticated admin endpoint, auto-filters by organization)
  getBidsForAuction: async (request: GetBidActivityRequest): Promise<{ bids: BidActivity[]; pagination: any }> => {
    try {
      const params = new URLSearchParams();
      
      if (request.auctionId) params.append('auctionId', request.auctionId);
      if (request.page) params.append('page', request.page.toString());
      if (request.limit) params.append('limit', request.limit.toString());

      const response = await adminBidClient.get(`/activity?${params}`);
      
      return {
        bids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch bid activity';
      throw new Error(message);
    }
  },

  // Get all bid activity for admin (authenticated, auto-filters by organization)
  getAllBidActivity: async (page: number = 1, limit: number = 10): Promise<{ bids: BidActivity[]; pagination: any }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await adminBidClient.get(`/activity?${params}`);
      
      return {
        bids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch bid activity';
      throw new Error(message);
    }
  },

  // Get user's bid history (public endpoint)
  getUserBidHistory: async (userId: string, page: number = 1, limit: number = 10): Promise<{ bids: BidActivity[]; pagination: any }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await bidClient.get(`/user/${userId}?${params}`);
      
      return {
        bids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch bid history';
      throw new Error(message);
    }
  },
};
