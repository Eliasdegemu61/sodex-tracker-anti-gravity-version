'use client';

import React, { useMemo, useState, useEffect } from "react"


import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertCircle, BarChart3, Zap } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { fetchPnLOverview, getVolumeFromPnLOverview, fetchDetailedBalance } from '@/lib/sodex-api';
import { fetchSpotTradesData } from '@/lib/spot-api';

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
  const { positions, userId, vaultBalance } = usePortfolio();
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [spotBalance, setSpotBalance] = useState<number>(0);
  const [futuresBalance, setFuturesBalance] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [futuresVolume, setFuturesVolume] = useState<number>(0);
  const [spotVolume, setSpotVolume] = useState<number>(0);
  const [futuresFees, setFuturesFees] = useState<number>(0);
  const [spotFees, setSpotFees] = useState<number>(0);
  const [hasUnpriced, setHasUnpriced] = useState(false);

  // Individual card loading states for independent loading
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingPnL, setIsLoadingPnL] = useState(false);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);
  const [isLoadingFees, setIsLoadingFees] = useState(false);

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

  // Determine loading state for each card independently
  const getCardLoadingState = (idx: number) => {
    switch (idx) {
      case 0: return isLoadingBalance; // Total Balance
      case 1: return isLoadingPnL;      // Realized PnL
      case 2: return isLoadingVolume;   // Volume
      case 3: return isLoadingFees;     // Total Fees
      default: return false;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const isLoading = getCardLoadingState(idx);

        return (
          <Card key={idx} className="group relative overflow-hidden p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl transition-all hover:border-accent/30 shadow-sm">
            <div className="flex items-start justify-between relative z-10">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-2">
                  {stat.label}
                </p>

                {isLoading ? (
                  <div className="min-h-[40px] flex items-center">
                    <LoadingAnimation />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold font-mono tracking-tight text-foreground truncate">
                        {stat.value}
                      </p>
                    </div>

                    {stat.subtitle && (
                      <p className="text-[9px] text-accent/50 font-bold uppercase tracking-widest italic">
                        {stat.subtitle}
                      </p>
                    )}

                    {stat.breakdown && (
                      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground/40 font-bold uppercase tracking-tight">{stat.breakdown.futures_label}</span>
                          <span className="font-mono text-foreground/70">${stat.breakdown.futures?.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) || '0.0'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground/40 font-bold uppercase tracking-tight">{stat.breakdown.spot_label}</span>
                          <span className="font-mono text-foreground/70">${stat.breakdown.spot?.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) || '0.0'}</span>
                        </div>
                        {stat.breakdown.vault !== undefined && stat.breakdown.vault_label && (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground/40 font-bold uppercase tracking-tight">{stat.breakdown.vault_label}</span>
                            <span className="font-mono text-foreground/70">${stat.breakdown.vault?.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) || '0.0'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {stat.change !== undefined && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {stat.change >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-[10px] font-bold font-mono ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-2 rounded-xl bg-secondary/10 text-accent/40 group-hover:text-accent/60 transition-colors">
                <div className="w-4 h-4 flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
