'use client';

import React, { useEffect } from "react"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { PortfolioOverview } from './portfolio-overview';
import { PnLChart } from './pnl-chart';
import { OpenPositions } from './open-positions';
import { FundFlowTable } from './fund-flow-table';
import { AssetFlowCard } from './asset-flow-card';
import { MonthlyCalendar } from './monthly-calendar';
import { PortfolioProvider } from '@/context/portfolio-context';
import type { EnrichedPosition } from '@/lib/sodex-api';
import { getUserIdByAddress, fetchAllPositions, enrichPositions } from '@/lib/sodex-api';
import { DEMO_SOURCE_ADDRESS, DEMO_DISPLAY_ADDRESS } from '@/lib/demo-config';
import { usePortfolio } from '@/context/portfolio-context';
import { DemoTransition } from './demo-transition';

// Loading Spinner Component
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <span className="text-sm font-medium text-muted-foreground animate-pulse">{message}</span>
    </div>
  );
}

// Loading Skeleton Component
function TrackerLoadingSkeleton() {
  const [showDots, setShowDots] = useState(true);

  useEffect(() => {
    // Show dots for 3 seconds, then fade to skeleton
    const timer = setTimeout(() => setShowDots(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showDots) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner message="Fetching latest data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-secondary/50 rounded w-32"></div>
        <div className="h-4 bg-secondary/50 rounded w-48"></div>
      </div>

      {/* Overview Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-card border border-border">
            <div className="h-4 bg-secondary/50 rounded w-20 mb-4"></div>
            <div className="h-8 bg-secondary/50 rounded w-32"></div>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-card border border-border h-80">
            <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
          </Card>
        </div>
        <Card className="p-6 bg-card border border-border h-80">
          <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
        </Card>
      </div>

    </div>
  );
}

function TrackerContent({ initialSearchAddress }: { initialSearchAddress?: string }) {
  const [searchInput, setSearchInput] = useState(initialSearchAddress || '');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [sourceWalletAddress, setSourceWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global context for demo transition
  const { isTransitioning, setIsTransitioning, isDemoMode } = usePortfolio();

  const handleSearch = async (addressToSearch?: string) => {
    const valueToSearch = (addressToSearch || searchInput || '').trim();
    if (!valueToSearch) return;

    // Special handling for DEMO - Loading feel with transition
    if (valueToSearch === DEMO_DISPLAY_ADDRESS) {
      console.log('[v0] Triggering Demo Search - Synchronizing data load');
      setIsTransitioning(true);
      setError(null);

      try {
        // 1. Create a promise for the minimum 1.5s delay
        const waitPromise = new Promise(resolve => setTimeout(resolve, 1500));

        // 2. Fetch data properly and wait for it
        const fetchDataPromise = (async () => {
          const uid = await getUserIdByAddress(DEMO_SOURCE_ADDRESS);
          const fetchedPositions = await fetchAllPositions(uid);
          const enrichedPositions = await enrichPositions(fetchedPositions);
          return { uid, enrichedPositions };
        })();

        // 3. Wait for BOTH
        const [_, data] = await Promise.all([waitPromise, fetchDataPromise]);

        // 4. Update state only after everything is ready
        setUserId(data.uid);
        setPositions(data.enrichedPositions);
        setWalletAddress(DEMO_DISPLAY_ADDRESS);
        setSourceWalletAddress(DEMO_SOURCE_ADDRESS);
        console.log('[v0] Tracker demo loading complete for UID:', data.uid);
      } catch (err) {
        console.error('[v0] Tracker demo loading failed:', err);
        setError('Failed to load demo data. Please try again.');
        setWalletAddress(null);
      } finally {
        setIsTransitioning(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const addressToFetch = valueToSearch;
      const foundUserId = await getUserIdByAddress(addressToFetch);

      setWalletAddress(valueToSearch);
      setSourceWalletAddress(valueToSearch);
      setUserId(foundUserId);

      const fetchedPositions = await fetchAllPositions(foundUserId);
      const enrichedPositions = await enrichPositions(fetchedPositions);

      setPositions(enrichedPositions);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      console.error('[v0] Error searching wallet:', errorMessage);
      setError(errorMessage);
      setWalletAddress(null);
      setUserId(null);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when initialSearchAddress is provided
  useEffect(() => {
    if (initialSearchAddress && initialSearchAddress.trim()) {
      console.log('[v0] Initializing tracker with address:', initialSearchAddress);
      setSearchInput(initialSearchAddress);
      handleSearch(initialSearchAddress);
    }
  }, [initialSearchAddress]);

  const handleClear = () => {
    setSearchInput('');
    setWalletAddress(null);
    setSourceWalletAddress(null);
    setUserId(null);
    setPositions([]);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Render portfolio data when wallet is found
  if (isLoading || isTransitioning) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner message={isTransitioning ? "Retrieving demo account data..." : "Searching wallet..."} />
      </div>
    );
  }

  // Render search UI when no wallet is selected
  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-[600px] px-4">
        <div className="p-8 sm:p-10 bg-card/40 dark:bg-[#141414]/90 backdrop-blur-2xl border border-border/20 dark:border-white/5 rounded-[2rem] shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-2xl font-bold text-foreground dark:text-white mb-3 tracking-tight">Wallet Tracker</h2>
          <p className="text-muted-foreground/80 dark:text-muted-foreground/80 mb-8 text-sm leading-relaxed">Enter a wallet address to track trading positions and performance</p>

          <div className="space-y-4">
            <div className="relative group">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address"
                className="w-full px-5 py-4 bg-secondary/50 dark:bg-[#1f1f1f] border border-border/20 dark:border-none rounded-2xl text-sm font-medium text-foreground dark:text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-border/50 dark:focus:ring-zinc-700 transition-all duration-300"
              />
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={() => handleSearch(searchInput)}
              disabled={isLoading || !searchInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-400 hover:bg-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 rounded-2xl font-semibold transition-all duration-300 active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search Wallet'}
            </button>

            <div className="relative flex items-center gap-4 my-6 py-2">
              <div className="flex-grow border-t border-border/20 dark:border-white/5"></div>
              <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-border/20 dark:border-white/5"></div>
            </div>

            <button
              disabled={isLoading}
              onClick={async () => {
                setSearchInput(DEMO_DISPLAY_ADDRESS);
                handleSearch(DEMO_DISPLAY_ADDRESS);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-transparent text-foreground dark:text-white hover:text-orange-500 hover:bg-orange-500/5 rounded-2xl font-bold transition-all duration-300"
            >
              {isLoading && searchInput === DEMO_DISPLAY_ADDRESS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                'Try Demo Account'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortfolioProvider initialUserId={userId} initialPositions={positions}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Wallet Tracker</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Tracking: <span className={`${isDemoMode ? 'blur-[6px] select-none' : ''} inline-block align-middle ml-1`}>{walletAddress}</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleClear}
            className="gap-2 text-muted-foreground hover:text-foreground bg-transparent"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Overview Stats */}
        <PortfolioOverview />

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          {/* PnL Chart */}
          <div>
            <PnLChart />
          </div>
        </div>

        {/* Fund Flow Table and Asset Flow Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FundFlowTable walletAddress={sourceWalletAddress || walletAddress || ''} />
          <AssetFlowCard walletAddress={sourceWalletAddress || walletAddress || ''} />
        </div>



        {/* Calendar and Open Positions Side by Side */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <MonthlyCalendar />
          </div>
          <div className="xl:col-span-2">
            <OpenPositions />
          </div>
        </div>
      </div>

    </PortfolioProvider>
  );
}

export function TrackerSection({ initialSearchAddress }: { initialSearchAddress?: string }) {
  return (
    <TrackerContent initialSearchAddress={initialSearchAddress} />
  );
}

