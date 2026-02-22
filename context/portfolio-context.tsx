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
    console.log('[v0] Triggering Cinematic Demo Mode - Instant Access Activated');
    setIsTransitioning(true);
    setError(null);

    // 1. Immediate Fallback Set (Zero Delay)
    setIsDemoMode(true);
    setWalletAddressState(DEMO_DISPLAY_ADDRESS);
    setSourceWalletAddressState(DEMO_SOURCE_ADDRESS);
    setUserIdState('1036'); // Static valid userId for demo
    localStorage.setItem('portfolio_demo_mode', 'true');

    // 2. Background Revalidation (Silent)
    const silentRevalidate = async () => {
      try {
        const uid = await getUserIdByAddress(DEMO_SOURCE_ADDRESS);
        const [pos, balance] = await Promise.all([
          fetchAllPositions(uid),
          fetchTotalBalance(uid)
        ]);
        const enriched = await enrichPositions(pos);

        setUserIdState(uid);
        setPositions(enriched);
        setVaultBalanceState(balance.futuresBalance);
        console.log('[v0] Demo data revalidated silently');
      } catch (err) {
        console.warn('[v0] Background revalidation failed, keeping fallback:', err);
        // Do NOT set error state here to keep UX smooth
      }
    };

    silentRevalidate();

    // The transition component will call onComplete which should handle the rest
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
