import apiClient from '../../config/apiClient';

// Insights Data Types - sesuai dengan BE response
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
  currentBid: number;
  viewCount: number;
  participantCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED';
}

export interface ConversionMetrics {
  totalViews: number;
  totalAuctions: number;
  totalBidders: number;
  totalWinners: number;
  viewToBidRate: number;
  bidToWinRate: number;
}

export interface PriceComparison {
  auctionId: string;
  auctionTitle: string;
  startingPrice: number;
  currentPrice: number;
  avgWinningPrice: number;
  highestBid: number;
  priceIncrease: number;
}

export interface TopBidder {
  userId: string;
  username: string;
  totalBids: number;
  totalBidValue: number;
  maxBidValue: number;
  successfulWins: number;
  isWhaleUser: boolean;
}

export interface SuccessRateData {
  successfulAuctions: number;
  failedAuctions: number;
  totalAuctions: number;
  successRate: number;
  failureRate: number;
}

export interface AuctionStatusSummary {
  total: number;
  draft: number;
  scheduled: number;
  live: number;
  ended: number;
}

export interface BiddingInsights {
  avgTimeToFirstBid: number; // minutes
  engagementRate: number; // percentage
  timeToFirstBidMedian?: number; // optional median
}

export interface DashboardInsightsData {
  bidTrend: BidTrendData[];
  auctionPerformance: AuctionPerformanceData[];
  conversionMetrics: ConversionMetrics;
  priceComparison: PriceComparison[];
  topBidders: TopBidder[];
  successRate: SuccessRateData;
  auctionStatusSummary: AuctionStatusSummary;
  biddingInsights?: BiddingInsights;
}

// Query Parameters Types
export interface BidTrendQueryParams {
  period?: 'hour' | 'day' | 'month';
  startDate?: string;
  endDate?: string;
}

export interface AuctionPerformanceQueryParams {
  limit?: number;
  status?: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED';
  sortBy?: 'bidCount' | 'totalBidValue' | 'viewCount';
}

export interface TopBiddersQueryParams {
  limit?: number;
  minBidValue?: number;
}

export interface AuctionStatusSummaryQueryParams {
  period?: 'day' | 'week' | 'month';
}

// API Response wrapper type
interface ApiResponse<T> {
  status: string;
  data: T;
  timestamp: string;
}

export const insightsService = {
  /**
   * Get complete dashboard insights
   * GET /api/v1/admin/insights?period=day
   */
  getDashboardInsights: async (period: 'day' | 'month' = 'day'): Promise<DashboardInsightsData> => {
    const response = await apiClient.get<ApiResponse<DashboardInsightsData>>('/admin/insights', {
      params: { period },
    });
    return response.data.data;
  },

  /**
   * Get bid trend data
   * GET /api/v1/admin/analytics/bid-trend
   */
  getBidTrend: async (params?: BidTrendQueryParams): Promise<BidTrendData[]> => {
    const response = await apiClient.get<ApiResponse<BidTrendData[]>>(
      '/admin/insights/bid-trend',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get auction performance data
   * GET /api/v1/admin/analytics/auction-performance
   */
  getAuctionPerformance: async (
    params?: AuctionPerformanceQueryParams
  ): Promise<AuctionPerformanceData[]> => {
    const response = await apiClient.get<ApiResponse<AuctionPerformanceData[]>>(
      '/admin/insights/auction-performance',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get conversion metrics
   * GET /api/v1/admin/analytics/conversion-metrics
   */
  getConversionMetrics: async (): Promise<ConversionMetrics> => {
    const response = await apiClient.get<ApiResponse<ConversionMetrics>>(
      '/admin/insights/conversion-metrics'
    );
    return response.data.data;
  },

  /**
   * Get price comparison data
   * GET /api/v1/admin/analytics/price-comparison
   */
  getPriceComparison: async (limit?: number): Promise<PriceComparison[]> => {
    const response = await apiClient.get<ApiResponse<PriceComparison[]>>(
      '/admin/insights/price-comparison',
      { params: limit ? { limit } : {} }
    );
    return response.data.data;
  },

  /**
   * Get top bidders
   * GET /api/v1/admin/analytics/top-bidders
   */
  getTopBidders: async (params?: TopBiddersQueryParams): Promise<TopBidder[]> => {
    const response = await apiClient.get<ApiResponse<TopBidder[]>>(
      '/admin/insights/top-bidders',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get success rate
   * GET /api/v1/admin/analytics/success-rate
   */
  getSuccessRate: async (): Promise<SuccessRateData> => {
    const response = await apiClient.get<ApiResponse<SuccessRateData>>(
      '/admin/insights/success-rate'
    );
    return response.data.data;
  },

  /**
   * Get auction status summary
   * GET /api/v1/admin/insights/auction-status-summary
   */
  getAuctionStatusSummary: async (
    params?: AuctionStatusSummaryQueryParams
  ): Promise<AuctionStatusSummary> => {
    const response = await apiClient.get<ApiResponse<AuctionStatusSummary>>(
      '/admin/insights/auction-status-summary',
      { params }
    );
    return response.data.data;
  },
};
