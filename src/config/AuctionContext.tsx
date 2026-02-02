import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Auction } from '../data/types/index';
import type { CreateAuctionRequest, UpdateAuctionRequest } from '../data/services/auctionService';
import { auctionService } from '../data/services/auctionService';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AuctionContextType {
  auctions: Auction[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  fetchAuctions: (page?: number, limit?: number, filters?: any) => Promise<void>;
  getAuctionById: (id: string) => Promise<Auction | null>;
  createAuction: (data: CreateAuctionRequest) => Promise<Auction>;
  updateAuction: (id: string, data: UpdateAuctionRequest) => Promise<Auction>;
  deleteAuction: (id: string) => Promise<void>;
  getAuctionsByStatus: (status: string, page?: number, limit?: number) => Promise<void>;
  clearError: () => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export const AuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchAuctions = useCallback(
    async (page: number = 1, limit: number = 10, filters?: any) => {
      setLoading(true);
      setError(null);
      try {
        const result = await auctionService.getAllAdminAuctions(page, limit, filters);
        setAuctions(result.auctions);
        setPagination(result.pagination);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch auctions');
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAuctionById = useCallback(async (id: string): Promise<Auction | null> => {
    try {
      return await auctionService.getAdminAuctionById(id);
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const createAuction = useCallback(async (data: CreateAuctionRequest): Promise<Auction> => {
    setError(null);
    try {
      const newAuction = await auctionService.createAuction(data);
      setAuctions((prev) => [newAuction, ...prev]);
      return newAuction;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateAuction = useCallback(async (id: string, data: UpdateAuctionRequest): Promise<Auction> => {
    setError(null);
    try {
      const updatedAuction = await auctionService.updateAuction(id, data);
      setAuctions((prev) =>
        prev.map((a) => (a.id === id ? updatedAuction : a))
      );
      return updatedAuction;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteAuction = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await auctionService.deleteAuction(id);
      setAuctions((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getAuctionsByStatus = useCallback(
    async (status: string, page: number = 1, limit: number = 10) => {
      setLoading(true);
      setError(null);
      try {
        const result = await auctionService.getAuctionsByStatus(status, page, limit);
        setAuctions(result.auctions);
        setPagination(result.pagination);
      } catch (err: any) {
        setError(err.message);
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuctionContext.Provider
      value={{
        auctions,
        loading,
        error,
        pagination,
        fetchAuctions,
        getAuctionById,
        createAuction,
        updateAuction,
        deleteAuction,
        getAuctionsByStatus,
        clearError,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
};

export const useAuction = (): AuctionContextType => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
};
