// Auction Types
export interface Auction {
  id: string;
  title: string;
  itemCode: string;
  description: string;
  category: string;
  condition: string;
  serialNumber?: string; // Serial Number / SN barang
  itemLocation?: string; // Lokasi Barang
  purchaseYear?: number; // Tahun Pembelian Barang
  startingPrice: number;
  bidIncrement: number;
  currentBid: number;
  totalBids: number;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';
  startTime: Date;
  endTime: Date;
  seller: string;
  currentBidder?: string;
  image?: string;
  images?: string[]; // Array of image URLs from Minio
  viewCount: number;
  participantCount: number;
  organizationCode: string; // Organization code mapping
}

export interface PortalAuction {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  currentBid: number;
  bidIncrement: number;
  startingPrice: number; // Starting price of the auction
  startTime?: Date | string; // Start time of the auction
  endTime: Date | string;
  participantCount: number;
  viewCount?: number; // Number of views
  images?: string[]; // Array of image URLs
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';
  organizationCode: string;
  winner?: { fullName?: string; winningBid?: number; status?: string };
}

// WebSocket Event Payloads
// See src/types/websocket.ts for detailed payload structures
export interface BidPlacedPayload {
  auctionId: string;
  currentBid: number;
  participantCount: number;
  bidderName: string;
  timestamp: string;
}

export interface AuctionUpdatedPayload {
  id: string;
  currentBid: number;
  participantCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDING' | 'ENDED' | 'CANCELLED';
  viewCount: number;
  bidderName?: string;
}

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
    status: string;
  };
  participantCount: number;
  endedAt: string;
}

// Bid Activity Types
export interface BidActivity {
  id?: string;
  auctionId?: string;
  auctionTitle?: string;
  bidderId?: string;
  bidder?: string;
  bidderName?: string;
  bidAmount: number;
  timestamp: Date | string;
  status: 'CURRENT' | 'OUTBID' | 'WINNING';
}

// Winner Bid Types
export interface WinnerBid {
  id: string;
  auctionId: string;
  auctionTitle: string;
  serialNumber: string; // Serial Number of the auctioned item
  category: string;
  fullName: string;
  corporateIdNip: string;
  directorate: string;
  organizationCode: string;
  winningBid: number;
  totalParticipants: number;
  auctionEndTime: Date;
  status: 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  paymentDueDate: Date;
  notes?: string;
}

// Statistics Types
export interface DashboardStats {
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalVolume: number;
  completedAuctions: number;
  pendingAuctions: number;
  cancelledAuctions: number;
  averageBidsPerAuction: number;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'seller' | 'buyer' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: Date;
  totalTransactions: number;
  rating: number;
}
