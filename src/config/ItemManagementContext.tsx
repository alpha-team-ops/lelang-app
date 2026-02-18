import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import itemManagementService from '../data/services/itemManagementService';
import { useAuth } from './AuthContext';

interface ItemManagementContextType {
  categories: string[];
  conditions: string[];
  setCategories: (categories: string[]) => void;
  setConditions: (conditions: string[]) => void;
  loading: boolean;
  fetchItems: () => Promise<void>;
}

const ItemManagementContext = createContext<ItemManagementContextType | undefined>(undefined);

export const ItemManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [cats, conds] = await Promise.all([
        itemManagementService.getCategories(),
        itemManagementService.getConditions(),
      ]);
      setCategories(cats || []);
      setConditions(conds || []);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [isAuthenticated]);

  return (
    <ItemManagementContext.Provider
      value={{
        categories,
        conditions,
        setCategories,
        setConditions,
        loading,
        fetchItems,
      }}
    >
      {children}
    </ItemManagementContext.Provider>
  );
};

export const useItemManagement = () => {
  const context = useContext(ItemManagementContext);
  if (!context) {
    throw new Error('useItemManagement must be used within ItemManagementProvider');
  }
  return context;
};
