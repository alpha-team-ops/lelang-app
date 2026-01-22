// Auction Types
export interface Auction {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  serialNumber?: string; // Serial Number / SN barang
  itemLocation?: string; // Lokasi Barang
  purchaseYear?: number; // Tahun Pembelian Barang
  startingPrice: number;
  reservePrice: number;
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
}

export interface PortalAuction {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  currentBid: number;
  reservePrice: number;
  endTime: Date;
  participantCount: number;
  images?: string[]; // Array of image URLs
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
