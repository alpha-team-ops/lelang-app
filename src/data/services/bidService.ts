import axios from 'axios';
import type { BidActivity } from '../types/index';

// Create a specialized client for bids API
const bidClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/bids`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
bidClient.interceptors.request.use((config) => {
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

  // Get bid activity for a specific auction (public endpoint)
  getBidsForAuction: async (request: GetBidActivityRequest): Promise<{ bids: BidActivity[]; pagination: any }> => {
    try {
      const params = new URLSearchParams();
      
      if (request.auctionId) params.append('auctionId', request.auctionId);
      if (request.page) params.append('page', request.page.toString());
      if (request.limit) params.append('limit', request.limit.toString());

      const response = await bidClient.get(`/activity?${params}`);
      
      return {
        bids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch bid activity';
      throw new Error(message);
    }
  },

  // Get all bid activity (public endpoint)
  getAllBidActivity: async (page: number = 1, limit: number = 10): Promise<{ bids: BidActivity[]; pagination: any }> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await bidClient.get(`/activity?${params}`);
      
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
