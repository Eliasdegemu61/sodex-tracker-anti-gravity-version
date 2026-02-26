'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { EnrichedPosition } from '@/lib/sodex-api';
import {
  fetchAllPositions,
  enrichPositions,
  getUserIdByAddress,
  fetchTotalBalance
} from '@/lib/sodex-api';
interface PortfolioContextType {
  walletAddress: string | null;
  sourceWalletAddress: string | null;
  userId: string | null;
  positions: EnrichedPosition[];
  vaultBalance: number;
  isLoading: boolean;
  error: string | null;
  setWalletAddress: (address: string, userId: string, positions: EnrichedPosition[]) => Promise<void>;
  setVaultBalance: (balance: number) => void;
  clearWalletAddress: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({
  children,
  initialUserId,
  initialPositions,
  initialWalletAddress,
  initialSourceWalletAddress
}: {
  children: React.ReactNode;
  initialUserId?: string | null;
  initialPositions?: EnrichedPosition[];
  initialWalletAddress?: string | null;
  initialSourceWalletAddress?: string | null;
}) {
  const [walletAddress, setWalletAddressState] = useState<string | null>(initialWalletAddress || null);
  const [sourceWalletAddress, setSourceWalletAddressState] = useState<string | null>(initialSourceWalletAddress || null);
  const [userId, setUserIdState] = useState<string | null>(initialUserId || null);
  const [positions, setPositions] = useState<EnrichedPosition[]>(initialPositions || []);
  const [vaultBalance, setVaultBalanceState] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage and fetch positions
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (initialUserId || initialWalletAddress) {
        return;
      }

      const savedAddress = localStorage.getItem('portfolio_wallet_address');
      const savedUserId = localStorage.getItem('portfolio_user_id');

      if (savedAddress && savedUserId) {
        setWalletAddressState(savedAddress);
        setUserIdState(savedUserId);

        try {
          setIsLoading(true);
          const positions = await fetchAllPositions(parseInt(savedUserId));
          const enrichedPos = await enrichPositions(positions);
          setPositions(enrichedPos);

          const balance = await fetchTotalBalance(savedUserId);
          setVaultBalanceState(balance.futuresBalance);
        } catch (err) {
          console.error('[v0] Failed to load saved portfolio:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      loadPortfolioData();
    }
  }, [initialUserId, initialWalletAddress]);

  const setWalletAddress = useCallback(
    async (address: string, userId: string, enrichedPositions: EnrichedPosition[]) => {
      try {
        localStorage.setItem('portfolio_wallet_address', address);
        localStorage.setItem('portfolio_user_id', userId);

        setWalletAddressState(address);
        setUserIdState(userId);
        setPositions(enrichedPositions);

        const balance = await fetchTotalBalance(userId);
        setVaultBalanceState(balance.futuresBalance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save portfolio';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const setVaultBalance = useCallback((balance: number) => {
    setVaultBalanceState(balance);
  }, []);

  const clearWalletAddress = useCallback(() => {
    localStorage.removeItem('portfolio_wallet_address');
    localStorage.removeItem('portfolio_user_id');
    setWalletAddressState(null);
    setSourceWalletAddressState(null);
    setUserIdState(null);
    setPositions([]);
    setVaultBalanceState(0);
    setError(null);
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        walletAddress,
        sourceWalletAddress,
        userId,
        positions,
        vaultBalance,
        isLoading,
        error,
        setWalletAddress,
        setVaultBalance,
        clearWalletAddress,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}
