'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getTokenPrice } from '@/lib/token-price-service';
import { usePortfolio } from '@/context/portfolio-context';

interface VaultData {
  pnl: number;
  shares: number;
  sharesUsd?: number;
}

export function VaultCard({ walletAddress }: { walletAddress: string }) {
  const { setVaultBalance } = usePortfolio();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchVaultData = async () => {
      setLoading(true);
      setError(null);
      try {
        const vaultResponse = await fetch('/api/sodex/vault-position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddress }),
        });

        if (!vaultResponse.ok) throw new Error('Failed to fetch vault data');

        const data = await vaultResponse.json();
        if (data.code === '0' && data.data) {
          const shares = data.data.shares || 0;
          
          // Get MAG7.ssi price with caching and fallback
          const mag7Price = await getTokenPrice('MAG7.ssi');
          const sharesUsd = shares * mag7Price;
          
          setVaultData({
            pnl: data.data.pnl,
            shares: shares,
            sharesUsd: sharesUsd,
          });
          
          // Update context with vault balance
          setVaultBalance(sharesUsd);
        } else {
          setError('No vault data available');
        }
      } catch (err) {
        console.error('[v0] Vault fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [walletAddress]);

  if (loading) {
    return (
      <Card className="p-6 bg-card border border-border animate-pulse">
        <div className="h-4 bg-secondary/50 rounded w-16 mb-4"></div>
        <div className="h-8 bg-secondary/50 rounded w-24"></div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-card border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Vault</h3>
        <p className="text-xs text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (!vaultData) {
    return null;
  }

  const isPnlPositive = vaultData.pnl >= 0;

  return (
    <Card className="p-6 bg-card border border-border">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Vault</h3>
      
      <div className="space-y-4">
        {/* PnL */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">PnL</p>
          <div className="flex items-center gap-2">
            {isPnlPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-lg font-semibold ${isPnlPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPnlPositive ? '+' : ''}{vaultData.pnl.toFixed(6)}
            </span>
          </div>
        </div>

        {/* Shares */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Vault Balance</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground">
                ${(vaultData.sharesUsd || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {vaultData.shares.toFixed(6)} MAG7.ssi
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
