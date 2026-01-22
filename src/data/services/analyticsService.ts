// Analytics Data Types
export interface BidTrendData {
  timeLabel: string;
  bidCount: number;
  avgBidValue: number;
}

export interface AuctionPerformanceData {
  auctionId: string;
  auctionTitle: string;
  bidCount: number;
  totalBidValue: number;
  status: 'active' | 'completed' | 'failed';
}

export interface ConversionMetrics {
  totalViews: number;
  totalBidders: number;
  totalWinners: number;
  viewToBidRate: number;
  bidToWinRate: number;
}

export interface PriceComparison {
  auctionId: string;
  auctionTitle: string;
  startingPrice: number;
  reservePrice: number;
  avgWinningPrice: number;
  highestBid: number;
}

export interface TopBidder {
  userId: string;
  username: string;
  totalBids: number;
  totalBidValue: number;
  successfulWins: number;
  isWhaleUser: boolean;
}

export interface SuccessRateData {
  successfulAuctions: number;
  failedAuctions: number;
  successRate: number;
  totalAuctions: number;
}

export interface AnalyticsData {
  bidTrend: BidTrendData[];
  auctionPerformance: AuctionPerformanceData[];
  conversionMetrics: ConversionMetrics;
  priceComparison: PriceComparison[];
  topBidders: TopBidder[];
  successRate: SuccessRateData;
}

// Import mock data from centralized mock folder
import {
  mockBidTrend,
  mockAuctionPerformance,
  mockConversionMetrics,
  mockPriceComparison,
  mockTopBidders,
  mockSuccessRate,
} from '../mock/analytics';

export const analyticsService = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    return {
      bidTrend: mockBidTrend,
      auctionPerformance: mockAuctionPerformance,
      conversionMetrics: mockConversionMetrics,
      priceComparison: mockPriceComparison,
      topBidders: mockTopBidders,
      successRate: mockSuccessRate,
    };

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics');
    // return response.json();
  },

  getBidTrend: async (): Promise<BidTrendData[]> => {
    return mockBidTrend;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/bid-trend');
    // return response.json();
  },

  getAuctionPerformance: async (): Promise<AuctionPerformanceData[]> => {
    return mockAuctionPerformance;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/auction-performance');
    // return response.json();
  },

  getConversionMetrics: async (): Promise<ConversionMetrics> => {
    return mockConversionMetrics;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/conversion-metrics');
    // return response.json();
  },

  getPriceComparison: async (): Promise<PriceComparison[]> => {
    return mockPriceComparison;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/price-comparison');
    // return response.json();
  },

  getTopBidders: async (): Promise<TopBidder[]> => {
    return mockTopBidders;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/top-bidders');
    // return response.json();
  },

  getSuccessRate: async (): Promise<SuccessRateData> => {
    return mockSuccessRate;

    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/analytics/success-rate');
    // return response.json();
  },
};
