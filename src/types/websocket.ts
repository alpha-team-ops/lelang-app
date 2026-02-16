/**
 * WebSocket Event Payloads untuk Real-time Auction Updates via Laravel Echo + Reverb
 * 
 * Channel: auction.{auctionId}
 * Broadcaster: Reverb (Laravel WebSocket Server)
 */

/**
 * BID PLACED EVENT
 * Triggered ketika user berhasil menempatkan bid baru
 * 
 * Channel: auction.{auctionId}
 * Event: bid.placed
 */
export interface BidPlacedPayload {
  auctionId: string;
  currentBid: number;
  participantCount: number;
  bidderName: string;
  timestamp: string; // ISO 8601 format: 2026-02-12T13:15:45.000000Z
}

/**
 * AUCTION UPDATED EVENT
 * Triggered ketika ada update ke auction (currentBid, status, viewCount, dll)
 * 
 * Channel: auction.{auctionId}
 * Event: auction.updated
 */
export interface AuctionUpdatedPayload {
  id: string;
  currentBid: number;
  participantCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';
  viewCount: number;
  bidderName?: string; // Optional: included untuk context
}

/**
 * AUCTION ENDED EVENT
 * Triggered ketika auction berakhir dan memiliki winner
 * 
 * Channel: auction.{auctionId}
 * Event: auction.ended
 */
export interface AuctionEndedPayload {
  id: string;
  title: string;
  status: 'ENDED';
  winningBid: number;
  winner: {
    id: string;
    fullName: string;
    winningBid: number;
    totalParticipants: number;
    status: 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  };
  participantCount: number;
  endedAt: string; // ISO 8601 format
}

/**
 * REST API Response Types untuk reference
 */

/**
 * Bid Placement Response
 * POST /api/v1/bids/place
 */
export interface BidPlacementResponse {
  success: boolean;
  data: {
    id: string;
    auctionId: string;
    bidAmount: number;
    status: 'CURRENT' | 'OUTBID';
    bidTimestamp: string;
  };
}

/**
 * Auction Detail Response
 * GET /api/v1/auctions/{id}
 */
export interface AuctionDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    status: string;
    currentBid: number;
    bidIncrement: number;
    startTime: string;
    endTime: string;
    participantCount: number;
    viewCount: number;
    bids: Array<{
      id: string;
      bidAmount: number;
      bidderName: string;
      bidTimestamp: string;
    }>;
  };
}

/**
 * Portal Auction Detail Response (Public/Portal endpoint)
 * GET /api/v1/portal/auctions/{id}
 */
export interface PortalAuctionDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    currentBid: number;
    bidIncrement: number;
    startingPrice: number;
    startTime: string;
    endTime: string;
    participantCount: number;
    viewCount: number;
    images: string[];
    status: string;
    organizationCode: string;
    winner?: {
      fullName: string;
      winningBid: number;
      status: string;
    };
  };
}
