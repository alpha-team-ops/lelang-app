import type { Auction, PortalAuction } from '../types/index';
import { adminAuctionsMock } from '../mock/auctions';

export const auctionService = {
  // Admin Auctions
  getAllAdminAuctions: async (): Promise<Auction[]> => {
    // Untuk sekarang pakai mock data
    return adminAuctionsMock;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/auctions');
    // return response.json();
  },

  getAdminAuctionById: async (id: string): Promise<Auction | null> => {
    const auction = adminAuctionsMock.find(a => a.id === id);
    return auction || null;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/${id}`);
    // return response.json();
  },

  getAuctionsByStatus: async (status: Auction['status']): Promise<Auction[]> => {
    return adminAuctionsMock.filter(a => a.status === status);
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions?status=${status}`);
    // return response.json();
  },

  createAuction: async (data: Omit<Auction, 'id' | 'totalBids' | 'currentBid' | 'viewCount'>): Promise<Auction> => {
    const newAuction: Auction = {
      ...data,
      id: Date.now().toString(),
      totalBids: 0,
      currentBid: data.startingPrice,
      viewCount: 0,
    };
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/auctions', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // return response.json();
    
    return newAuction;
  },

  updateAuction: async (id: string, data: Partial<Auction>): Promise<Auction | null> => {
    const auction = adminAuctionsMock.find(a => a.id === id);
    if (!auction) return null;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // return response.json();
    
    return { ...auction, ...data };
  },

  deleteAuction: async (id: string): Promise<boolean> => {
    const index = adminAuctionsMock.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    // Nanti tinggal ganti ke:
    // await fetch(`/api/auctions/${id}`, { method: 'DELETE' });
    
    return true;
  },

  // Portal Auctions (User-facing) - Only LIVE auctions
  getAllPortalAuctions: async (): Promise<PortalAuction[]> => {
    // Filter hanya auctions yang status LIVE dari admin auctions
    const liveAuctions = adminAuctionsMock.filter(a => a.status === 'LIVE');
    
    // Convert admin auctions format ke portal format
    return liveAuctions.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      condition: a.condition,
      currentBid: a.currentBid,
      reservePrice: a.reservePrice,
      endTime: a.endTime,
      participantCount: a.participantCount,
      images: a.images || [],
    }));
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/auctions/portal?status=LIVE');
    // return response.json();
  },

  getPortalAuctionById: async (id: string): Promise<PortalAuction | null> => {
    const auction = adminAuctionsMock.find(a => a.id === id && a.status === 'LIVE');
    if (!auction) return null;
    
    return {
      id: auction.id,
      title: auction.title,
      description: auction.description,
      category: auction.category,
      condition: auction.condition,
      currentBid: auction.currentBid,
      reservePrice: auction.reservePrice,
      endTime: auction.endTime,
      participantCount: auction.participantCount,
      images: auction.images || [],
    };
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal/${id}`);
    // return response.json();
  },

  searchAuctions: async (query: string): Promise<PortalAuction[]> => {
    const liveAuctions = adminAuctionsMock.filter(a => a.status === 'LIVE');
    
    return liveAuctions
      .filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      )
      .map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        condition: a.condition,
        currentBid: a.currentBid,
        reservePrice: a.reservePrice,
        endTime: a.endTime,
        participantCount: a.participantCount,
        images: a.images || [],
      }));
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal/search?q=${query}`);
    // return response.json();
  },

  getAuctionsByCategory: async (category: string): Promise<PortalAuction[]> => {
    const liveAuctions = adminAuctionsMock.filter(a => a.status === 'LIVE' && a.category === category);
    
    return liveAuctions.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
      condition: a.condition,
      currentBid: a.currentBid,
      reservePrice: a.reservePrice,
      endTime: a.endTime,
      participantCount: a.participantCount,
      images: a.images || [],
    }));
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal?category=${category}`);
    // return response.json();
  },
};
