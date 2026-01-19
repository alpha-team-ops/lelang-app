import type { Auction, PortalAuction } from '../types/index';
import { adminAuctionsMock, portalAuctionsMock } from '../mock/auctions';

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

  // Portal Auctions (User-facing)
  getAllPortalAuctions: async (): Promise<PortalAuction[]> => {
    return portalAuctionsMock;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch('/api/auctions/portal');
    // return response.json();
  },

  getPortalAuctionById: async (id: string): Promise<PortalAuction | null> => {
    const auction = portalAuctionsMock.find(a => a.id === id);
    return auction || null;
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal/${id}`);
    // return response.json();
  },

  searchAuctions: async (query: string): Promise<PortalAuction[]> => {
    return portalAuctionsMock.filter(a =>
      a.namaBarang.toLowerCase().includes(query.toLowerCase()) ||
      a.kategori.toLowerCase().includes(query.toLowerCase()) ||
      a.deskripsi.toLowerCase().includes(query.toLowerCase())
    );
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal/search?q=${query}`);
    // return response.json();
  },

  getAuctionsByCategory: async (category: string): Promise<PortalAuction[]> => {
    return portalAuctionsMock.filter(a => a.kategori === category);
    
    // Nanti tinggal ganti ke:
    // const response = await fetch(`/api/auctions/portal?category=${category}`);
    // return response.json();
  },
};
