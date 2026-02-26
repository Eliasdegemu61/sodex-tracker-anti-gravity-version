'use client';

import React, { useMemo, useState, useEffect } from "react"


import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { fetchPnLOverview, getVolumeFromPnLOverview, fetchDetailedBalance } from '@/lib/sodex-api';
import { fetchSpotTradesData } from '@/lib/spot-api';
import { getTokenPrice } from '@/lib/token-price-service';
import { fetchLeaderboardData, fetchSpotLeaderboardData } from '@/lib/volume-service';

// Cool loading animation component with gradient shimmer effect
function LoadingAnimation() {
  return (
    <div className="flex items-center gap-2">
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            box-shadow: 0 0 6px rgba(var(--color-accent), 0.4);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 12px rgba(var(--color-accent), 0.8);
          }
        }
        .loading-bar {
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(139, 92, 246, 0.3),
            transparent
          );
          background-size: 1000px 100%;
        }
        .pulse-dot {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
      `}</style>
      <div className="pulse-dot w-2 h-2 bg-accent rounded-full" style={{ animationDelay: '0s' }} />
      <div className="pulse-dot w-2 h-2 bg-accent rounded-full" style={{ animationDelay: '0.3s' }} />
      <div className="pulse-dot w-2 h-2 bg-accent rounded-full" style={{ animationDelay: '0.6s' }} />
      <div className="loading-bar flex-1 h-2 rounded-full" />
    </div>
  );
}

interface PortfolioStat {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  breakdown?: {
    futures?: number;
    spot?: number;
    vault?: number;
    futures_label?: string;
    spot_label?: string;
    vault_label?: string;
  };
}

export function PortfolioOverview() {
  const { positions, userId, vaultBalance, setVaultBalance, walletAddress, sourceWalletAddress } = usePortfolio();

  const [balances, setBalances] = useState({
    total: 0,
    spot: 0,
    futures: 0,
    vault: 0,
    hasUnpriced: false
  });

  const [metrics, setMetrics] = useState({
    futuresVolume: 0,
    spotVolume: 0,
    futuresFees: 0,
    spotFees: 0,
    pnl30d: 0,
    vaultPnl: 0,
    vaultShares: 0
  });

  const [loading, setLoading] = useState({
    balances: false,
    metrics: false,
    vault: false
  });

  // 1. Fetch Balances
  useEffect(() => {
    if (!userId) return;

    const fetchBalances = async () => {
      setLoading(prev => ({ ...prev, balances: true }));
      try {
        const data = await fetchDetailedBalance(userId);
        setBalances(prev => ({
          ...prev,
          total: data.totalUsdValue,
          spot: data.spotBalance,
          futures: data.futuresBalance,
          hasUnpriced: data.hasUnpricedAssets || false
        }));
      } catch (err) {
        console.error('[v0] Error fetching balances:', err);
      } finally {
        setLoading(prev => ({ ...prev, balances: false }));
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // 2. Fetch Metrics (Volume, Fees, PnL)
  useEffect(() => {
    if (!userId || !positions) return;

    const fetchMetrics = async () => {
      setLoading(prev => ({ ...prev, metrics: true }));
      try {
        // Futures volume from PnL overview
        const pnlData = await fetchPnLOverview(userId);
        const fVol = getVolumeFromPnLOverview(pnlData);

        // Spot volume and fees
        const spotData = await fetchSpotTradesData(userId);

        // 30D PnL from positions
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const pnl30 = positions
          .filter(p => (p.updated_at || 0) >= thirtyDaysAgo)
          .reduce((sum, p) => sum + (p.realizedPnlValue || 0), 0);

        // Futures fees from current positions
        const fFees = positions.reduce((sum, p) => sum + (parseFloat(p.cum_trading_fee || '0') || 0), 0);

        setMetrics(prev => ({
          ...prev,
          futuresVolume: fVol,
          spotVolume: spotData.totalVolume,
          futuresFees: fFees,
          spotFees: spotData.totalFees,
          pnl30d: pnl30
        }));
      } catch (err) {
        console.error('[v0] Error fetching metrics:', err);
      } finally {
        setLoading(prev => ({ ...prev, metrics: false }));
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 45000);
    return () => clearInterval(interval);
  }, [userId, positions]);

  // 3. Fetch Vault Data
  useEffect(() => {
    const addr = sourceWalletAddress || walletAddress;
    if (!addr) return;

    const fetchVault = async () => {
      setLoading(prev => ({ ...prev, vault: true }));
      try {
        const response = await fetch('/api/sodex/vault-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.code === '0' && data.data) {
            const shares = data.data.shares || 0;
            const mag7Price = await getTokenPrice('MAG7.ssi');
            const sharesUsd = shares * mag7Price;

            setMetrics(prev => ({
              ...prev,
              vaultPnl: data.data.pnl,
              vaultShares: shares
            }));

            setBalances(prev => ({ ...prev, vault: sharesUsd }));
            setVaultBalance(sharesUsd);
          }
        }
      } catch (err) {
        console.error('[v0] Error fetching vault:', err);
      } finally {
        setLoading(prev => ({ ...prev, vault: false }));
      }
    };

    fetchVault();
    const interval = setInterval(fetchVault, 60000);
    return () => clearInterval(interval);
  }, [walletAddress, sourceWalletAddress, setVaultBalance]);

  const totalNetWorth = balances.total + balances.vault;
  const isSyncing = loading.balances || loading.metrics || loading.vault;

  // Helper for formatting numbers with K/M suffixes
  const formatCompactNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(2);
  };

  return (
    <Card className="group relative overflow-hidden bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm transition-all hover:border-accent/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] -mr-32 -mt-32" />

      <div className="p-8 md:p-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Balance Column */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Total Net Worth
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                  ${totalNetWorth.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </h2>
                {balances.hasUnpriced && (
                  <span className="text-[10px] font-bold text-accent/50 lowercase">+ others</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-border/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">futures</span>
                <span className="text-[11px] font-bold text-foreground/70">${balances.futures.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">spot</span>
                <span className="text-[11px] font-bold text-foreground/70">${balances.spot.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">vault</span>
                <span className="text-[11px] font-bold text-orange-400/80">${balances.vault.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full items-center">

              <MetricBox
                label="30D Realized PnL"
                value={`$${metrics.pnl30d.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                icon={<TrendingUp className="w-2.5 h-2.5" />}
                isPositive={metrics.pnl30d >= 0}
              />

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-2.5 h-2.5" /> Vault Shares
                </p>
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-orange-400/90">
                    {metrics.vaultShares.toFixed(2)} <span className="text-[8px] text-muted-foreground/30 uppercase font-medium">mag7</span>
                  </p>
                  <p className={`text-[9px] font-bold lowercase ${metrics.vaultPnl >= 0 ? 'text-green-400/70' : 'text-red-400/70'} flex items-center gap-1.5`}>
                    {metrics.vaultPnl >= 0 ? '+' : ''}{metrics.vaultPnl.toFixed(4)} PnL
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-2.5 h-2.5" /> Volume
                </p>
                <p className="text-xl font-bold tracking-tight text-foreground/80">
                  ${formatCompactNumber(metrics.futuresVolume + metrics.spotVolume)}
                </p>
                <div className="flex gap-2 text-[8px] font-bold uppercase text-muted-foreground/30">
                  <span>f: ${formatCompactNumber(metrics.futuresVolume)}</span>
                  <span>s: ${formatCompactNumber(metrics.spotVolume)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-2.5 h-2.5" /> Fees
                </p>
                <p className="text-xl font-bold tracking-tight text-foreground/80">
                  ${(metrics.futuresFees + metrics.spotFees).toFixed(2)}
                </p>
                <div className="flex gap-2 text-[8px] font-bold uppercase text-muted-foreground/30">
                  <span>f: ${metrics.futuresFees.toFixed(0)}</span>
                  <span>s: ${metrics.spotFees.toFixed(0)}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {isSyncing && (
          <div className="absolute bottom-4 right-8 flex items-center gap-2 text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest">
            <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
            Syncing
          </div>
        )}
      </div>
    </Card>
  );
}

function MetricBox({ label, value, icon, isPositive }: { label: string, value: string, icon: React.ReactNode, isPositive: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
        {icon} {label}
      </p>
      <p className={`text-xl font-bold tracking-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {value}
      </p>
      <div className="w-full h-1 bg-secondary/20 rounded-full overflow-hidden">
        <div className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} w-[40%] opacity-20`} />
      </div>
    </div>
  );
}

