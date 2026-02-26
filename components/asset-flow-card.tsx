'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { fetchDetailedBalance } from '@/lib/sodex-api';
import { getTokenLogo } from '@/lib/token-logos';

interface AssetData {
  coin: string;
  balance: string;
  isFuture?: boolean;
  color?: string;
}

interface AssetFlowCardProps {
  walletAddress: string;
}

const ASSET_COLORS = [
  '#FF9500', // Orange - BTC
  '#3B82F6', // Blue - ETH
  '#EC4899', // Pink - SOL
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
];

// Token decimal mapping
const TOKEN_DECIMALS: Record<string, number> = {
  BTC: 8,
  ETH: 18,
  SOL: 9,
  USDC: 6,
  USDT: 6,
  WBTC: 8,
  WETH: 18,
  WSOL: 9,
  ARB: 18,
  OP: 18,
  LINK: 18,
  UNI: 18,
  AAVE: 18,
  DAI: 18,
  WMATIC: 18,
  MATIC: 18,
  AVAX: 18,
  FTM: 18,
  CRV: 18,
  CVX: 18,
  SOSO: 18,
  WSOSO: 18,
  MAG7: 18,
  'MAG7.ssi': 18,
};

export function AssetFlowCard({ walletAddress }: AssetFlowCardProps) {
  const { userId } = usePortfolio();
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  // Display name formatter - removes initial 'v' or 'w' from token symbol
  const getDisplayName = (coin: string): string => {
    if (coin.startsWith('v') || coin.startsWith('w')) {
      return coin.slice(1);
    }
    return coin;
  };

  // Get decimals for a token
  const getTokenDecimals = (coin: string): number => {
    const displayName = getDisplayName(coin);
    return TOKEN_DECIMALS[displayName] || 18; // Default to 18 if not found
  };

  // Format token balance with proper decimals
  const formatTokenBalance = (balance: string, coin: string): string => {
    try {
      const num = parseFloat(balance);
      return num.toFixed(4);
    } catch {
      return '0';
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchAssets();
  }, [userId]);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the new detailed balance function which returns tokens with USD values
      const balanceData = await fetchDetailedBalance(userId!);

      // Convert detailed balance tokens to AssetData format - just holdings
      const assetList: AssetData[] = balanceData.tokens.map((token, idx) => ({
        coin: token.token,
        balance: token.balance.toString(),
        isFuture: false,
        color: ASSET_COLORS[idx % ASSET_COLORS.length],
      }));

      // Add futures USDC if balance > 0
      if (balanceData.futuresBalance > 0) {
        const existingUsdcIndex = assetList.findIndex(
          (asset) => asset.coin.toUpperCase() === 'USDC'
        );

        if (existingUsdcIndex >= 0) {
          // Combine with existing USDC
          const existingTokenAmount = parseFloat(assetList[existingUsdcIndex].balance);
          assetList[existingUsdcIndex].balance = (existingTokenAmount + balanceData.futuresBalance).toString();
        } else {
          // Add new USDC entry from futures
          assetList.push({
            coin: 'USDC',
            balance: balanceData.futuresBalance.toString(),
            isFuture: true,
            color: ASSET_COLORS[assetList.length % ASSET_COLORS.length],
          });
        }
      }

      // Sort by balance amount
      assetList.sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

      setAssets(assetList);
      setTotalBalance(balanceData.totalUsdValue);
    } catch (err) {
      console.error('[v0] Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assets');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
        <p className="text-[10px] text-muted-foreground/40 font-bold  ">checking holdings...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl flex flex-col items-center justify-center min-h-[200px]">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-2">Asset Allocation</h3>
        <p className="text-[10px] text-muted-foreground/30 font-bold uppercase ">{error}</p>
      </Card>
    );
  }

  if (assets.length === 0) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl flex flex-col items-center justify-center min-h-[200px]">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-2">Asset Allocation</h3>
        <p className="text-[10px] text-muted-foreground/20 font-bold uppercase ">no holdings detected</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
      <div className="space-y-6">
        {/* Holdings List */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground/60">Asset Allocation</h3>

          <div className="grid grid-cols-1 gap-2">
            {assets.map((asset, idx) => {
              const tokenLogo = getTokenLogo(asset.coin);
              return (
                <div
                  key={idx}
                  className="group relative flex items-center justify-between p-3 rounded-2xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-border/10"
                >
                  {/* Color Glow */}
                  <div
                    className="absolute inset-y-2 left-0 w-1.5 rounded-r-full opacity-60 transition-opacity group-hover:opacity-80"
                    style={{ backgroundColor: asset.color }}
                  />

                  <div className="flex items-center gap-3 flex-1 min-w-0 pl-3">
                    <div className="relative">
                      {tokenLogo ? (
                        <img
                          src={tokenLogo}
                          alt={asset.coin}
                          className="w-6 h-6 rounded-full flex-shrink-0 bg-secondary/50 p-0.5"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {asset.coin[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[11px] text-foreground/80 tracking-tight">
                        {getDisplayName(asset.coin)}
                      </span>
                      {asset.isFuture && (
                        <span className="text-[7px] text-accent/40 font-bold   leading-none mt-0.5">futures</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] font-bold text-muted-foreground/60">
                      {formatTokenBalance(asset.balance, asset.coin)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

