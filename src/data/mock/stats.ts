import type { DashboardStats } from '../types/index';

export const dashboardStatsMock: DashboardStats = {
  totalAuctions: 48,
  activeAuctions: 12,
  totalBids: 1256,
  totalVolume: 125600000,
  completedAuctions: 32,
  pendingAuctions: 4,
  cancelledAuctions: 0,
  averageBidsPerAuction: 26,
};

export const getStatsByPeriod = (period: 'today' | 'week' | 'month') => {
  const stats = { ...dashboardStatsMock };
  
  switch (period) {
    case 'today':
      return {
        ...stats,
        totalAuctions: 5,
        activeAuctions: 3,
        totalBids: 45,
        totalVolume: 12500000,
      };
    case 'week':
      return {
        ...stats,
        totalAuctions: 18,
        activeAuctions: 8,
        totalBids: 312,
        totalVolume: 42300000,
      };
    case 'month':
      return stats;
    default:
      return stats;
  }
};
