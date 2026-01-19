import type { DashboardStats } from '../types/index';
import { dashboardStatsMock, getStatsByPeriod } from '../mock/stats';

export const statsService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    return dashboardStatsMock;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/stats/dashboard');
    // return response.json();
  },

  getStatsByPeriod: async (period: 'today' | 'week' | 'month'): Promise<DashboardStats> => {
    return getStatsByPeriod(period);
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/stats/dashboard?period=${period}`);
    // return response.json();
  },

  getAuctionStats: async () => {
    // Agregasi data dari auction service
    return {
      totalCreated: dashboardStatsMock.totalAuctions,
      active: dashboardStatsMock.activeAuctions,
      completed: dashboardStatsMock.completedAuctions,
      cancelled: dashboardStatsMock.cancelledAuctions,
    };
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/stats/auctions');
    // return response.json();
  },

  getBidStats: async () => {
    return {
      totalBids: dashboardStatsMock.totalBids,
      averageBidsPerAuction: dashboardStatsMock.averageBidsPerAuction,
      totalVolume: dashboardStatsMock.totalVolume,
    };
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/stats/bids');
    // return response.json();
  },
};
