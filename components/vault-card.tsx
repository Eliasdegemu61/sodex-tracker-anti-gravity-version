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
      <Card className="p-6 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse flex flex-col items-center justify-center min-h-[160px]">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">checking vault...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl flex flex-col items-center justify-center min-h-[160px]">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-2">Vault</h3>
        <p className="text-[10px] text-muted-foreground/30 font-bold uppercase italic">{error}</p>
      </Card>
    );
  }

  if (!vaultData) {
    return null;
  }

  const isPnlPositive = vaultData.pnl >= 0;

  return (
    <Card className="group relative overflow-hidden p-6 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl transition-all hover:border-accent/10 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">Vault</h3>
        <div className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[8px] font-bold uppercase tracking-widest"> MAG7.ssi </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* PnL */}
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">management</p>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold tracking-tight ${isPnlPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPnlPositive ? '+' : ''}{vaultData.pnl.toFixed(4)}
            </span>
          </div>
          <p className="text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest">Realized PnL</p>
        </div>

        {/* Shares */}
        <div className="space-y-2 text-right">
          <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">valuation</p>
          <div className="flex flex-col items-end">
            <p className="text-xl font-bold tracking-tight text-foreground/80">
              ${(vaultData.sharesUsd || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest mt-1">
              {vaultData.shares.toFixed(4)} units
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
