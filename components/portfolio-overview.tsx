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
  const { positions, userId, vaultBalance, setVaultBalance } = usePortfolio();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [spotBalance, setSpotBalance] = useState<number>(0);
  const [futuresBalance, setFuturesBalance] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [futuresVolume, setFuturesVolume] = useState<number>(0);
  const [spotVolume, setSpotVolume] = useState<number>(0);
  const [futuresFees, setFuturesFees] = useState<number>(0);
  const [spotFees, setSpotFees] = useState<number>(0);
  const [hasUnpriced, setHasUnpriced] = useState(false);

  // Vault data state
  const [vaultData, setVaultData] = useState<{ pnl: number; shares: number; sharesUsd: number } | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // Rankings state
  const [rankData, setRankData] = useState<{ perpsVolumeRank: number | null; spotVolumeRank: number | null; pnlRank: number | null }>({
    perpsVolumeRank: null,
    spotVolumeRank: null,
    pnlRank: null,
  });
  const [isLoadingRanks, setIsLoadingRanks] = useState(false);

  // Individual card loading states for independent loading
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingPnL, setIsLoadingPnL] = useState(false);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Fetch combined balance using new detailed balance function
  useEffect(() => {
    if (!userId) return;

    const fetchBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balanceData = await fetchDetailedBalance(userId);
        setSpotBalance(balanceData.spotBalance);
        setFuturesBalance(balanceData.futuresBalance);
        setWalletBalance(balanceData.futuresBalance);
        setTotalBalance(balanceData.totalUsdValue);

        // Use the hasUnpricedAssets flag from balance data
        setHasUnpriced(balanceData.hasUnpricedAssets || false);

        console.log('[v0] Portfolio balance updated:', {
          totalBalance: balanceData.totalUsdValue,
          spotBalance: balanceData.spotBalance,
          futuresBalance: balanceData.futuresBalance,
          hasUnpriced: balanceData.hasUnpricedAssets,
          unpricedTokens: balanceData.unpricedTokens,
        });
      } catch (err) {
        console.error('[v0] Error fetching balance:', err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();

    // Refresh balance every 20 seconds
    const interval = setInterval(fetchBalance, 20000);
    return () => clearInterval(interval);
  }, [userId, vaultBalance]);

  // Fetch PnL data independently
  useEffect(() => {
    if (!userId || !positions || positions.length === 0) return;

    const fetchPnL = async () => {
      setIsLoadingPnL(true);
      try {
        const pnlData = await fetchPnLOverview(userId);
        const futuresVol = getVolumeFromPnLOverview(pnlData);
        setFuturesVolume(futuresVol);
      } catch (err) {
        console.error('[v0] Error fetching PnL:', err);
      } finally {
        setIsLoadingPnL(false);
      }
    };

    fetchPnL();

    // Refresh PnL every 30 seconds
    const pnlInterval = setInterval(fetchPnL, 30000);
    return () => clearInterval(pnlInterval);
  }, [userId, positions]);

  // Fetch Volume and Fees data independently
  useEffect(() => {
    if (!userId || !positions || positions.length === 0) return;

    const fetchVolumeAndFees = async () => {
      setIsLoadingVolume(true);
      setIsLoadingFees(true);
      try {
        // Fetch spot data
        const spotData = await fetchSpotTradesData(userId);
        setSpotVolume(spotData.totalVolume);
        setIsLoadingVolume(false);

        // Calculate futures fees from positions
        const calcFuturesFees = positions.reduce((sum: number, p: any) => sum + (parseFloat(p.cum_trading_fee || '0') || 0), 0);
        setFuturesFees(calcFuturesFees);
        setSpotFees(spotData.totalFees);
        setIsLoadingFees(false);

        console.log('[v0] Volume and fees updated:', {
          futuresVolume,
          spotVolume: spotData.totalVolume,
          futuresFees: calcFuturesFees,
          spotFees: spotData.totalFees,
        });
      } catch (err) {
        console.error('[v0] Error fetching volume and fees:', err);
        setIsLoadingVolume(false);
        setIsLoadingFees(false);
      }
    };

    fetchVolumeAndFees();

    // Refresh every 30 seconds
    const interval = setInterval(fetchVolumeAndFees, 30000);
    return () => clearInterval(interval);
  }, [userId, positions]);

  // Fetch Vault data
  useEffect(() => {
    if (!userId) return;

    const fetchVault = async () => {
      setIsLoadingVault(true);
      try {
        const walletAddr = localStorage.getItem('portfolio_wallet_address');
        if (!walletAddr) return;

        const response = await fetch('/api/sodex/vault-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddr }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.code === '0' && data.data) {
            const shares = data.data.shares || 0;
            const mag7Price = await getTokenPrice('MAG7.ssi');
            const sharesUsd = shares * mag7Price;

            setVaultData({
              pnl: data.data.pnl,
              shares: shares,
              sharesUsd: sharesUsd
            });

            setVaultBalance(sharesUsd);
          }
        }
      } catch (err) {
        console.error('[v0] Error fetching vault in overview:', err);
      } finally {
        setIsLoadingVault(false);
      }
    };

    fetchVault();
    const interval = setInterval(fetchVault, 60000); // 1 minute refresh for vault
    return () => clearInterval(interval);
  }, [userId, setVaultBalance]);

  // Fetch Rankings Data
  useEffect(() => {
    if (!userId) return;

    const fetchRanks = async () => {
      setIsLoadingRanks(true);
      try {
        const walletAddr = localStorage.getItem('portfolio_wallet_address');
        if (!walletAddr) return;

        const [perpsData, spotData] = await Promise.all([
          fetchLeaderboardData(),
          fetchSpotLeaderboardData(),
        ]);

        const walletLower = walletAddr.toLowerCase();

        // Get Perps Volume Rank
        const perpsVolumeRanked = [...perpsData]
          .sort((a, b) => Number(b.vol) - Number(a.vol))
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
        const perpsVolumeEntry = perpsVolumeRanked.find(e => e.address.toLowerCase() === walletLower);

        // Get Perps PnL Rank
        const perpsPnlRanked = [...perpsData]
          .sort((a, b) => Number(b.pnl) - Number(a.pnl))
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
        const perpsPnlEntry = perpsPnlRanked.find(e => e.address.toLowerCase() === walletLower);

        // Get Spot Volume Rank
        const spotVolumeRanked = [...spotData]
          .sort((a, b) => b.vol - a.vol)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
        const spotVolumeEntry = spotVolumeRanked.find(e => e.address.toLowerCase() === walletLower);

        setRankData({
          perpsVolumeRank: perpsVolumeEntry?.rank || null,
          spotVolumeRank: spotVolumeEntry?.rank || null,
          pnlRank: perpsPnlEntry?.rank || null,
        });
      } catch (err) {
        console.error('[v0] Error fetching ranks in overview:', err);
      } finally {
        setIsLoadingRanks(false);
      }
    };

    fetchRanks();
    const interval = setInterval(fetchRanks, 300000); // 5 minute refresh for ranks
    return () => clearInterval(interval);
  }, [userId]);

  const stats = useMemo(() => {
    // Calculate total volume and fees
    const totalVolume = futuresVolume + spotVolume;
    const totalFees = futuresFees + spotFees;

    // Declare combinedBalance variable with vault included
    const combinedBalance = totalBalance + vaultBalance;

    if (!positions || positions.length === 0) {
      return [
        {
          label: 'Total Balance',
          value: combinedBalance < 1 ? '<$1' : `$${combinedBalance.toFixed(2)}`,
          subtitle: hasUnpriced ? '+ other assets' : undefined,
          change: 0,
          icon: <DollarSign className="w-5 h-5" />,
          breakdown: {
            futures: walletBalance,
            spot: spotBalance,
            vault: vaultBalance,
            futures_label: 'Futures',
            spot_label: 'Spot',
            vault_label: 'Vault',
          },
        },
        {
          label: 'Realized PnL',
          value: '$0',
          change: 0,
          icon: <TrendingUp className="w-5 h-5" />,
          breakdown: null,
        },
        {
          label: 'Volume',
          value: `$${totalVolume.toFixed(2)}`,
          change: 0,
          icon: <BarChart3 className="w-5 h-5" />,
          breakdown: {
            futures: futuresVolume,
            spot: spotVolume,
            futures_label: 'Futures',
            spot_label: 'Spot',
          },
        },
        {
          label: 'Total Fees Paid',
          value: `$${totalFees.toFixed(2)}`,
          change: 0,
          icon: <Zap className="w-5 h-5" />,
          breakdown: {
            futures: futuresFees,
            spot: spotFees,
            futures_label: 'Futures',
            spot_label: 'Spot',
          },
        },
      ];
    }

    // Calculate Win Rate
    const winningTrades = positions.filter((p: any) => p.realizedPnlValue > 0).length;
    const totalTrades = positions.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Calculate Total PnL from positions
    const totalPnL = positions.reduce((sum: number, p: any) => sum + p.realizedPnlValue, 0);

    return [
      {
        label: 'Total Balance',
        value: combinedBalance < 1 ? '<$1' : `$${combinedBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        subtitle: hasUnpriced ? '+ other assets' : undefined,
        change: undefined,
        icon: <DollarSign className="w-5 h-5" />,
        breakdown: {
          futures: walletBalance,
          spot: spotBalance,
          vault: vaultBalance,
          futures_label: 'Futures',
          spot_label: 'Spot',
          vault_label: 'Vault',
        },
      },
      {
        label: 'Realized PnL',
        value: `$${totalPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <TrendingUp className="w-5 h-5" />,
        breakdown: null,
      },
      {
        label: 'Volume',
        value: `$${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <BarChart3 className="w-5 h-5" />,
        breakdown: {
          futures: futuresVolume,
          spot: spotVolume,
          futures_label: 'Futures',
          spot_label: 'Spot',
        },
      },
      {
        label: 'Total Fees Paid',
        value: `$${totalFees.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        change: undefined,
        icon: <Zap className="w-5 h-5" />,
        breakdown: {
          futures: futuresFees,
          spot: spotFees,
          futures_label: 'Futures',
          spot_label: 'Spot',
        },
      },
    ];
  }, [positions, totalBalance, futuresVolume, spotVolume, futuresFees, spotFees, walletBalance, spotBalance, vaultBalance]);

  const isAnyLoading = isLoadingBalance || isLoadingPnL || isLoadingVolume || isLoadingFees || isLoadingVault || isLoadingRanks;

  // Calculate final aggregated values
  const totalVolume = futuresVolume + spotVolume;
  const totalFees = futuresFees + spotFees;
  const combinedBalance = totalBalance + (vaultData?.sharesUsd || 0);
  const totalPnL = positions.reduce((sum: number, p: any) => sum + (p.realizedPnlValue || 0), 0);
  const vaultValue = vaultData?.sharesUsd || 0;
  const vaultPnL = vaultData?.pnl || 0;

  const getRankColor = (rank: number | null) => {
    if (rank === null) return 'text-muted-foreground/20';
    if (rank <= 10) return 'text-yellow-400';
    if (rank <= 50) return 'text-emerald-400';
    if (rank <= 100) return 'text-blue-400';
    return 'text-muted-foreground/40';
  };

  return (
    <Card className="group relative overflow-hidden bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm transition-all hover:border-accent/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] -mr-32 -mt-32" />

      <div className="p-8 md:p-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Balance Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Total Net Worth
                </p>
                <div className="flex items-baseline gap-3">
                  {isLoadingBalance ? (
                    <div className="h-10 w-48 rounded-xl bg-secondary/40 animate-pulse" />
                  ) : (
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                      ${combinedBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </h2>
                  )}
                  {!isLoadingBalance && hasUnpriced && (
                    <span className="text-[10px] font-bold text-accent/50 lowercase animate-pulse">+ other assets</span>
                  )}
                </div>
              </div>

              {/* Rankings Injected Here */}
              <div className="flex flex-col gap-3 items-end">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-tighter">perps</p>
                    <p className={`text-sm font-bold tracking-tighter ${getRankColor(rankData.perpsVolumeRank)}`}>
                      #{rankData.perpsVolumeRank || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-tighter">spot</p>
                    <p className={`text-sm font-bold tracking-tighter ${getRankColor(rankData.spotVolumeRank)}`}>
                      #{rankData.spotVolumeRank || '-'}
                    </p>
                  </div>
                </div>
                <p className="text-[8px] font-bold text-accent/20 uppercase tracking-widest">rank</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-border/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">futures</span>
                <span className="text-[11px] font-bold text-foreground/70">${futuresBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">spot</span>
                <span className="text-[11px] font-bold text-foreground/70">${spotBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/30 font-semibold lowercase">vault</span>
                <span className="text-[11px] font-bold text-orange-400/80">${vaultValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid Column */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full items-center">

              {/* PnL Stat */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-2.5 h-2.5" /> Realized PnL
                </p>
                <p className={`text-xl font-bold tracking-tight ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <div className="w-full h-1 bg-secondary/20 rounded-full overflow-hidden">
                  <div className={`h-full ${totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'} w-[60%] opacity-30`} />
                </div>
              </div>

              {/* Vault Stat */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-2.5 h-2.5" /> Vault PnL
                </p>
                <div className="space-y-0.5">
                  <p className={`text-xl font-bold tracking-tight ${vaultPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {vaultPnL >= 0 ? '+' : ''}{Math.abs(vaultPnL).toFixed(4)}
                  </p>
                  <p className="text-[10px] font-bold text-orange-400/60 lowercase flex items-center gap-1.5">
                    {vaultData?.shares.toFixed(4)} <span className="text-[8px] text-muted-foreground/30 uppercase font-medium">mag7.ssi</span>
                  </p>
                </div>
              </div>

              {/* Volume Stat */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-2.5 h-2.5" /> Volume
                </p>
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-foreground/80">
                    ${(totalVolume / 1000).toFixed(1)}k
                  </p>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground/20">futures</span>
                      <span className="text-foreground/40">${(futuresVolume / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground/20">spot</span>
                      <span className="text-foreground/40">${(spotVolume / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fees Stat */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-2.5 h-2.5" /> Fees Paid
                </p>
                <div className="space-y-0.5">
                  <p className="text-xl font-bold tracking-tight text-foreground/80">
                    ${totalFees.toFixed(2)}
                  </p>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground/20">futures</span>
                      <span className="text-foreground/40">${futuresFees.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter">
                      <span className="text-muted-foreground/20">spot</span>
                      <span className="text-foreground/40">${spotFees.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Sync Indicator */}
        <div className="absolute bottom-4 right-8 flex items-center gap-2">
          {isAnyLoading && (
            <div className="flex items-center gap-2 text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--color-accent),0.5)]" />
              Syncing
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

