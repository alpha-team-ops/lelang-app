// Analytics Mock Data Types
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

// Mock Analytics Data
export const mockBidTrend: BidTrendData[] = [
  { timeLabel: '00:00', bidCount: 12, avgBidValue: 450000 },
  { timeLabel: '04:00', bidCount: 8, avgBidValue: 380000 },
  { timeLabel: '08:00', bidCount: 45, avgBidValue: 520000 },
  { timeLabel: '12:00', bidCount: 67, avgBidValue: 610000 },
  { timeLabel: '16:00', bidCount: 89, avgBidValue: 680000 },
  { timeLabel: '20:00', bidCount: 102, avgBidValue: 750000 },
  { timeLabel: '23:59', bidCount: 34, avgBidValue: 480000 },
];

export const mockAuctionPerformance: AuctionPerformanceData[] = [
  {
    auctionId: 'AUC-2024-001',
    auctionTitle: 'Vintage Rolex Watch',
    bidCount: 47,
    totalBidValue: 285000000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-002',
    auctionTitle: 'MacBook Pro M3 Max',
    bidCount: 38,
    totalBidValue: 18900000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-003',
    auctionTitle: 'Antique Furniture Set',
    bidCount: 29,
    totalBidValue: 9200000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-004',
    auctionTitle: 'iPhone 15 Pro Bundle',
    bidCount: 56,
    totalBidValue: 28500000,
    status: 'completed',
  },
  {
    auctionId: 'AUC-2024-005',
    auctionTitle: 'Gaming PC RTX 4090',
    bidCount: 23,
    totalBidValue: 19800000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-006',
    auctionTitle: 'Canon Camera Setup',
    bidCount: 18,
    totalBidValue: 8400000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-007',
    auctionTitle: 'Sony Headphones Gold Edition',
    bidCount: 12,
    totalBidValue: 4200000,
    status: 'active',
  },
  {
    auctionId: 'AUC-2024-008',
    auctionTitle: 'Leather Backpack Collection',
    bidCount: 9,
    totalBidValue: 1800000,
    status: 'failed',
  },
];

export const mockConversionMetrics: ConversionMetrics = {
  totalViews: 15600,
  totalBidders: 1248,
  totalWinners: 324,
  viewToBidRate: (1248 / 15600) * 100,
  bidToWinRate: (324 / 1248) * 100,
};

export const mockPriceComparison: PriceComparison[] = [
  {
    auctionId: 'AUC-2024-001',
    auctionTitle: 'Vintage Rolex Watch',
    startingPrice: 180000000,
    reservePrice: 250000000,
    avgWinningPrice: 285000000,
    highestBid: 315000000,
  },
  {
    auctionId: 'AUC-2024-004',
    auctionTitle: 'iPhone 15 Pro Bundle',
    startingPrice: 12000000,
    reservePrice: 15000000,
    avgWinningPrice: 18900000,
    highestBid: 21500000,
  },
  {
    auctionId: 'AUC-2024-005',
    auctionTitle: 'Gaming PC RTX 4090',
    startingPrice: 18000000,
    reservePrice: 19000000,
    avgWinningPrice: 19800000,
    highestBid: 22000000,
  },
  {
    auctionId: 'AUC-2024-006',
    auctionTitle: 'Canon Camera Setup',
    startingPrice: 7500000,
    reservePrice: 8000000,
    avgWinningPrice: 8400000,
    highestBid: 9200000,
  },
];

export const mockTopBidders: TopBidder[] = [
  {
    userId: 'USER-001',
    username: 'luxe_collector_2024',
    totalBids: 234,
    totalBidValue: 1280000000,
    successfulWins: 42,
    isWhaleUser: true,
  },
  {
    userId: 'USER-002',
    username: 'tech_enthusiast_pro',
    totalBids: 187,
    totalBidValue: 820000000,
    successfulWins: 31,
    isWhaleUser: true,
  },
  {
    userId: 'USER-003',
    username: 'auction_hunter_99',
    totalBids: 156,
    totalBidValue: 450000000,
    successfulWins: 28,
    isWhaleUser: false,
  },
  {
    userId: 'USER-004',
    username: 'smart_bidder_88',
    totalBids: 142,
    totalBidValue: 380000000,
    successfulWins: 24,
    isWhaleUser: false,
  },
  {
    userId: 'USER-005',
    username: 'vintage_lover_pro',
    totalBids: 128,
    totalBidValue: 320000000,
    successfulWins: 21,
    isWhaleUser: false,
  },
];

export const mockSuccessRate: SuccessRateData = {
  successfulAuctions: 152,
  failedAuctions: 18,
  successRate: (152 / (152 + 18)) * 100,
  totalAuctions: 170,
};
