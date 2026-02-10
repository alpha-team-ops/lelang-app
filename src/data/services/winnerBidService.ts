import axios from 'axios';
import type { WinnerBid } from '../types/index';

// Create a specialized client for admin winner bids API (authenticated, auto-filters by organization)
const winnerBidClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/${import.meta.env.VITE_API_VERSION || 'v1'}/admin/bids/winners`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
winnerBidClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Add error interceptor
winnerBidClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export interface GetWinnerBidsRequest {
  status?: string;
  page?: number;
  limit?: number;
}

export interface UpdateWinnerBidStatusRequest {
  status: 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export const winnerBidService = {
  /**
   * Get all winner bids with optional filtering by status
   */
  getAllWinnerBids: async (request?: GetWinnerBidsRequest): Promise<{ winnerBids: WinnerBid[]; pagination: any }> => {
    try {
      const params = new URLSearchParams();
      
      if (request?.status) params.append('status', request.status);
      if (request?.page) params.append('page', request.page.toString());
      if (request?.limit) params.append('limit', request.limit.toString());

      const response = await winnerBidClient.get('', { params: Object.fromEntries(params) });
      
      return {
        winnerBids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch winner bids';
      throw new Error(message);
    }
  },

  /**
   * Get a specific winner bid by ID
   */
  getWinnerBidById: async (id: string): Promise<WinnerBid | null> => {
    try {
      const response = await winnerBidClient.get(`/${id}`);

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch winner bid';
      throw new Error(message);
    }
  },

  /**
   * Get winner bids filtered by status
   */
  getWinnerBidsByStatus: async (status: string, page: number = 1, limit: number = 10): Promise<{ winnerBids: WinnerBid[]; pagination: any }> => {
    try {
      const response = await winnerBidClient.get(`/status/${status}`, {
        params: { page, limit },
      });

      return {
        winnerBids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to fetch winner bids with status ${status}`;
      throw new Error(message);
    }
  },

  /**
   * Get winner bids with overdue payments
   */
  getOverduePayments: async (page: number = 1, limit: number = 10): Promise<{ winnerBids: WinnerBid[]; pagination: any }> => {
    try {
      const response = await winnerBidClient.get('/overdue-payments', {
        params: { page, limit },
      });

      return {
        winnerBids: response.data.data || [],
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch overdue payments';
      throw new Error(message);
    }
  },

  /**
   * Update winner bid status
   * Valid transitions:
   * PAYMENT_PENDING -> PAID
   * PAID -> SHIPPED
   * SHIPPED -> COMPLETED
   * Any status -> CANCELLED
   */
  updateWinnerBidStatus: async (id: string, request: UpdateWinnerBidStatusRequest): Promise<WinnerBid> => {
    try {
      const payload = {
        status: request.status,
      };

      if (request.notes) {
        (payload as any).notes = request.notes;
      }

      const response = await winnerBidClient.put(`/${id}/status`, payload);

      return response.data.data;
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      // Map error codes to user-friendly messages
      const errorMap: { [key: string]: string } = {
        WINNER_NOT_FOUND: 'Winner bid not found.',
        INVALID_STATUS_TRANSITION: 'This status transition is not allowed.',
        PERMISSION_DENIED: 'You do not have permission to update this winner bid.',
        AUCTION_NOT_FOUND: 'Related auction not found.',
      };

      const message = errorMap[errorCode] || errorMessage || 'Failed to update winner bid status';
      throw new Error(message);
    }
  },

  /**
   * Get winner bids pagination helper
   */
  getWinnerBidsPaginated: async (page: number = 1, limit: number = 10, status?: string): Promise<{ winnerBids: WinnerBid[]; pagination: any }> => {
    return winnerBidService.getAllWinnerBids({
      status,
      page,
      limit,
    });
  },
};
