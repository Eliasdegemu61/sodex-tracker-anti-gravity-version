'use client';

import React, { useEffect } from "react"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { PortfolioOverview } from './portfolio-overview';
import { PortfolioHeatmap } from './portfolio-heatmap';
import { PnLChart } from './pnl-chart';
import { PositionsTable } from './positions-table';
import { OpenPositions } from './open-positions';
import { FundFlowTable } from './fund-flow-table';
import { AssetFlowCard } from './asset-flow-card';
import { MonthlyCalendar } from './monthly-calendar';
import { PortfolioProvider } from '@/context/portfolio-context';
import type { EnrichedPosition } from '@/lib/sodex-api';
import { getUserIdByAddress, fetchAllPositions, enrichPositions } from '@/lib/sodex-api';
import { RankingCard } from './ranking-card';
import { VaultCard } from './vault-card';
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

      {/* Heatmap Skeleton */}
      <Card className="p-6 bg-card border border-border h-64">
        <div className="h-full bg-secondary/50 rounded animate-pulse"></div>
      </Card>
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
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 bg-card border border-border max-w-md w-full">
          <h2 className="text-2xl font-bold text-foreground mb-3">Wallet Tracker</h2>
          <p className="text-muted-foreground mb-6 text-sm">Enter a wallet address to track trading positions and performance</p>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter wallet address"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={() => handleSearch(searchInput)}
              disabled={isLoading || !searchInput.trim()}
              className="w-full gap-2"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Searching...' : 'Search Wallet'}
            </Button>

            <div className="relative flex items-center gap-2 my-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              variant="outline"
              disabled={isLoading}
              onClick={async () => {
                setSearchInput(DEMO_DISPLAY_ADDRESS);
                handleSearch(DEMO_DISPLAY_ADDRESS);
              }}
              className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2"
            >
              {isLoading && searchInput === DEMO_DISPLAY_ADDRESS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Demo...
                </>
              ) : (
                'Try Demo Account'
              )}
            </Button>
          </div>
        </Card>
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

        {/* Vault Card */}
        <VaultCard walletAddress={sourceWalletAddress || walletAddress || ''} />

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          {/* PnL Chart */}
          <div>
            <PnLChart />
          </div>
        </div>

        {/* Positions Table */}
        <PositionsTable />

        {/* Fund Flow Table and Asset Flow Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FundFlowTable walletAddress={sourceWalletAddress || walletAddress || ''} />
          <AssetFlowCard walletAddress={sourceWalletAddress || walletAddress || ''} />
        </div>



        {/* Calendar and Ranking Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyCalendar />
          </div>
          <RankingCard walletAddress={sourceWalletAddress || walletAddress || ''} />
        </div>

        {/* Open Positions */}
        <OpenPositions />

        {/* Trading Activity Heatmap */}
        <PortfolioHeatmap />
      </div>

    </PortfolioProvider>
  );
}

export function TrackerSection({ initialSearchAddress }: { initialSearchAddress?: string }) {
  return (
    <TrackerContent initialSearchAddress={initialSearchAddress} />
  );
}
