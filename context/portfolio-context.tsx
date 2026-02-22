'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { EnrichedPosition } from '@/lib/sodex-api';
import {
  fetchAllPositions,
  enrichPositions,
  getUserIdByAddress,
  fetchTotalBalance
} from '@/lib/sodex-api';
import { DEMO_SOURCE_ADDRESS, DEMO_DISPLAY_ADDRESS } from '@/lib/demo-config';

interface PortfolioContextType {
  walletAddress: string | null;
  sourceWalletAddress: string | null; // Added
  userId: string | null;
  positions: EnrichedPosition[];
  vaultBalance: number;
  isLoading: boolean;
  isTransitioning: boolean;
  setIsTransitioning: (isTransitioning: boolean) => void; // Added
  error: string | null;
  isDemoMode: boolean;
  setWalletAddress: (address: string, userId: string, positions: EnrichedPosition[]) => Promise<void>;
  setVaultBalance: (balance: number) => void;
  clearWalletAddress: () => void;
  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({
  children,
  initialUserId,
  initialPositions
}: {
  children: React.ReactNode;
  initialUserId?: string | null;
  initialPositions?: EnrichedPosition[];
}) {
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);
  const [sourceWalletAddress, setSourceWalletAddressState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(initialUserId || null);
  const [positions, setPositions] = useState<EnrichedPosition[]>(initialPositions || []);
  const [vaultBalance, setVaultBalanceState] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // Added
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initialize from localStorage and fetch positions
  useEffect(() => {
    const loadPortfolioData = async () => {
      // Recovery demo mode state from localStorage
      const savedDemoMode = localStorage.getItem('portfolio_demo_mode') === 'true';

      if (savedDemoMode) {
        setIsLoading(true);
        try {
          console.log('[v0] Loading dynamic demo data');
          const uid = await getUserIdByAddress(DEMO_SOURCE_ADDRESS);
          const [pos, balance] = await Promise.all([
            fetchAllPositions(uid),
            fetchTotalBalance(uid)
          ]);
          const enriched = await enrichPositions(pos);

          setIsDemoMode(true);
          setWalletAddressState(DEMO_DISPLAY_ADDRESS);
          setSourceWalletAddressState(DEMO_SOURCE_ADDRESS);
          setUserIdState(uid);
          setPositions(enriched);
          setVaultBalanceState(balance.futuresBalance);
        } catch (err) {
          console.error('[v0] Failed to load dynamic demo:', err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (initialUserId) {
        // Use initial data provided (for tracker)
        return;
      }

      const savedAddress = localStorage.getItem('portfolio_wallet_address');
      const savedUserId = localStorage.getItem('portfolio_user_id');

      if (savedAddress && savedUserId) {
        setWalletAddressState(savedAddress);
        setUserIdState(savedUserId);

        try {
          setIsLoading(true);
          // Fetch and enrich positions for the saved userId
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
  }, [initialUserId]);

  const setWalletAddress = useCallback(
    async (address: string, userId: string, enrichedPositions: EnrichedPosition[]) => {
      try {
        console.log('[v0] Setting wallet address:', address);

        // Save only address and userId to localStorage
        localStorage.setItem('portfolio_wallet_address', address);
        localStorage.setItem('portfolio_user_id', userId);
        localStorage.setItem('portfolio_demo_mode', 'false');

        setWalletAddressState(address);
        setUserIdState(userId);
        setPositions(enrichedPositions);
        setIsDemoMode(false);

        // Fetch balance too
        const balance = await fetchTotalBalance(userId);
        setVaultBalanceState(balance.futuresBalance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save portfolio';
        console.error('[v0] Error setting wallet address:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  const enterDemoMode = useCallback(async () => {
    console.log('[v0] Triggering Demo Mode - Synchronizing data load');
    setIsTransitioning(true);
    setError(null);
    setIsDemoMode(true);
    localStorage.setItem('portfolio_demo_mode', 'true');

    try {
      // 1. Create a promise for the minimum 1.5s delay
      const waitPromise = new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Start the background fetch immediately
      const fetchDataPromise = (async () => {
        const uid = await getUserIdByAddress(DEMO_SOURCE_ADDRESS);
        const [pos, balance] = await Promise.all([
          fetchAllPositions(uid),
          fetchTotalBalance(uid)
        ]);
        const enriched = await enrichPositions(pos);
        return { uid, enriched, balance };
      })();

      // 3. Wait for BOTH the timer and the data fetch to complete
      const [_, data] = await Promise.all([waitPromise, fetchDataPromise]);

      // 4. Update state only after everything is ready
      setUserIdState(data.uid);
      setPositions(data.enriched);
      setVaultBalanceState(data.balance.futuresBalance);
      setWalletAddressState(DEMO_DISPLAY_ADDRESS);
      setSourceWalletAddressState(DEMO_SOURCE_ADDRESS);

      console.log('[v0] Demo loading complete, showing data for UID:', data.uid);
    } catch (err) {
      console.error('[v0] Failed to load demo data:', err);
      setError('Failed to load demo data. Please try again.');
    } finally {
      setIsTransitioning(false);
    }
  }, []);

  const exitDemoMode = useCallback(() => {
    console.log('[v0] Exiting Demo Mode');
    localStorage.setItem('portfolio_demo_mode', 'false');
    setIsDemoMode(false);
    clearWalletAddress();
  }, []);

  const setVaultBalance = useCallback((balance: number) => {
    setVaultBalanceState(balance);
  }, []);

  const clearWalletAddress = useCallback(() => {
    localStorage.removeItem('portfolio_wallet_address');
    localStorage.removeItem('portfolio_user_id');
    localStorage.removeItem('portfolio_demo_mode');
    setWalletAddressState(null);
    setSourceWalletAddressState(null);
    setUserIdState(null);
    setPositions([]);
    setVaultBalanceState(0);
    setIsDemoMode(false);
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
        isTransitioning,
        setIsTransitioning,
        error,
        isDemoMode,
        setWalletAddress,
        setVaultBalance,
        clearWalletAddress,
        enterDemoMode,
        exitDemoMode,
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
