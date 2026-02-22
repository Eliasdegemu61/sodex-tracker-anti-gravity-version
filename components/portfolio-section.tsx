'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PortfolioOverview } from './portfolio-overview';
import { PortfolioHeatmap } from './portfolio-heatmap';
import { PnLChart } from './pnl-chart';
import { PositionsTable } from './positions-table';
import { WalletBindForm } from './wallet-bind-form';
import { PortfolioMetrics } from './portfolio-metrics';
import { FundFlowTable } from './fund-flow-table';
import { AssetFlowCard } from './asset-flow-card';
import { MonthlyCalendar } from './monthly-calendar';
import { usePortfolio } from '@/context/portfolio-context';
import { RankingCard } from './ranking-card';
import { VaultCard } from './vault-card';
import { DemoTransition } from './demo-transition';

// Loading Animation Component with Dots
function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex gap-1.5">
        <div
          className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: '0.4s' }}
        />
      </div>
      <span className="text-sm text-muted-foreground ml-2">Calculating portfolio data</span>
    </div>
  );
}

export function PortfolioSection() {
  const {
    walletAddress,
    sourceWalletAddress,
    isLoading,
    isTransitioning,
    setIsTransitioning,
    error,
    clearWalletAddress,
    isDemoMode,
    exitDemoMode,
    enterDemoMode
  } = usePortfolio();
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  const handleUnbind = () => {
    clearWalletAddress();
    setShowUnbindConfirm(false);
  };

  if (!walletAddress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center pt-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Portfolio</h1>
        </div>
        <WalletBindForm />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center bg-card border border-red-500/30 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-3">Error Loading Portfolio</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              if (isDemoMode) {
                enterDemoMode();
              } else {
                setShowUnbindConfirm(true);
              }
            }}
            className="text-primary hover:underline text-sm"
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingDots />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Portfolio</h1>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground break-all">Account: {walletAddress}</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            {isDemoMode ? (
              <Button
                onClick={exitDemoMode}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 flex-grow md:flex-grow-0"
              >
                Exit Demo Account
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowUnbindConfirm(true)}
                className="text-red-500 hover:bg-red-500/10 border-red-500/30 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 whitespace-nowrap flex-grow md:flex-grow-0"
              >
                Unbind Account
              </Button>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <PortfolioOverview />

        {/* Vault Card */}
        <VaultCard walletAddress={sourceWalletAddress || walletAddress} />

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
          {walletAddress && <FundFlowTable walletAddress={sourceWalletAddress || walletAddress} />}
          {walletAddress && <AssetFlowCard walletAddress={sourceWalletAddress || walletAddress} />}
        </div>

        {/* Advanced Metrics */}
        <PortfolioMetrics />

        {/* Calendar and Ranking Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MonthlyCalendar />
          </div>
          <RankingCard walletAddress={walletAddress} />
        </div>

        {/* Trading Activity Heatmap */}
        <PortfolioHeatmap />
      </div>

      <AlertDialog open={showUnbindConfirm} onOpenChange={setShowUnbindConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unbind Your Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your wallet address and all associated data from this device. You can bind a different account later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Keep Bound</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbind}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Unbind Account
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {isTransitioning && (
        <DemoTransition onComplete={() => setIsTransitioning(false)} />
      )}
    </>
  );
}
