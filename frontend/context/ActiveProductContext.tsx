'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { NormalizedProductItem } from '@/lib/api';

interface ActiveProductContextType {
  activeProduct: NormalizedProductItem | null;
  setActiveProduct: (product: NormalizedProductItem | null) => void;
}

const ActiveProductContext = createContext<ActiveProductContextType | undefined>(undefined);

export function ActiveProductProvider({ children }: { children: ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<NormalizedProductItem | null>(null);

  return (
    <ActiveProductContext.Provider value={{ activeProduct, setActiveProduct }}>
      {children}
    </ActiveProductContext.Provider>
  );
}

export function useActiveProduct(): ActiveProductContextType {
  const ctx = useContext(ActiveProductContext);
  if (!ctx) {
    throw new Error('useActiveProduct must be used within an ActiveProductProvider');
  }
  return ctx;
}