export interface BidActivity {
  id: string;
  auctionId: string;
  auctionTitle: string;
  bidder: string;
  bidAmount: number;
  timestamp: Date;
  status: 'ACCEPTED' | 'OUTBID' | 'PENDING';
}

export const mockBidActivity: BidActivity[] = [
  {
    id: '1',
    auctionId: '1',
    auctionTitle: 'Laptop ASUS ROG Gaming',
    bidder: 'Pembeli_001',
    bidAmount: 8500000,
    timestamp: new Date('2026-01-20T14:30:00'),
    status: 'ACCEPTED',
  },
  {
    id: '2',
    auctionId: '1',
    auctionTitle: 'Laptop ASUS ROG Gaming',
    bidder: 'Pembeli_002',
    bidAmount: 8750000,
    timestamp: new Date('2026-01-20T15:45:00'),
    status: 'ACCEPTED',
  },
  {
    id: '3',
    auctionId: '1',
    auctionTitle: 'Laptop ASUS ROG Gaming',
    bidder: 'Pembeli_001',
    bidAmount: 9000000,
    timestamp: new Date('2026-01-20T16:20:00'),
    status: 'ACCEPTED',
  },
  {
    id: '4',
    auctionId: '9',
    auctionTitle: 'MacBook Pro 13" M2',
    bidder: 'Pembeli_045',
    bidAmount: 14500000,
    timestamp: new Date('2026-01-18T18:30:00'),
    status: 'ACCEPTED',
  },
  {
    id: '5',
    auctionId: '10',
    auctionTitle: 'MacBook Pro 14" M3',
    bidder: 'Pembeli_078',
    bidAmount: 21500000,
    timestamp: new Date('2026-01-16T17:45:00'),
    status: 'ACCEPTED',
  },
  {
    id: '6',
    auctionId: '2',
    auctionTitle: 'Monitor Samsung 4K',
    bidder: 'Pembeli_003',
    bidAmount: 4200000,
    timestamp: new Date('2026-01-20T10:15:00'),
    status: 'OUTBID',
  },
  {
    id: '7',
    auctionId: '2',
    auctionTitle: 'Monitor Samsung 4K',
    bidder: 'Pembeli_004',
    bidAmount: 4500000,
    timestamp: new Date('2026-01-20T11:30:00'),
    status: 'ACCEPTED',
  },
  {
    id: '8',
    auctionId: '3',
    auctionTitle: 'Mechanical Keyboard RGB',
    bidder: 'Pembeli_005',
    bidAmount: 1200000,
    timestamp: new Date('2026-01-20T09:00:00'),
    status: 'ACCEPTED',
  },
];
