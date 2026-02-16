import apiClient from '../../config/apiClient';
import type { DashboardStats } from '../types/index';
import { dashboardStatsMock, getStatsByPeriod as getStatsByPeriodMock } from '../mock/stats';

interface StatsApiResponse {
  success: boolean;
  data: DashboardStats;
  message?: string;
}

export const statsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<StatsApiResponse>('/admin/stats');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      console.warn('Stats API returned invalid response, using mock data');
      return dashboardStatsMock;
    } catch (error) {
      console.warn('Stats API error, using mock data:', error);
      return dashboardStatsMock;
    }
  },

  getStatsByPeriod: async (period: 'today' | 'week' | 'month'): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<StatsApiResponse>('/admin/stats', {
        params: { period },
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      console.warn('Stats API returned invalid response, using mock data');
      return getStatsByPeriodMock(period);
    } catch (error) {
      console.warn('Stats API error, using mock data:', error);
      return getStatsByPeriodMock(period);
    }
  },

  getAuctionStats: async () => {
    try {
      const stats = await statsService.getDashboardStats();
      return {
        totalCreated: stats.totalAuctions,
        active: stats.activeAuctions,
        completed: stats.completedAuctions,
        cancelled: stats.cancelledAuctions,
      };
    } catch (error) {
      console.error('Error fetching auction stats:', error);
      throw error;
    }
  },

  getBidStats: async () => {
    try {
      const stats = await statsService.getDashboardStats();
      return {
        totalBids: stats.totalBids,
        averageBidsPerAuction: stats.averageBidsPerAuction,
        totalVolume: stats.totalVolume,
      };
    } catch (error) {
      console.error('Error fetching bid stats:', error);
      throw error;
    }
  },
};
