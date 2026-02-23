'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { fetchDetailedSpotBalance, formatSpotToken } from '@/lib/spot-balance';
import { getTokenLogo } from '@/lib/token-logos';
import type { DetailedSpotBalance } from '@/lib/spot-balance';

interface AssetBreakdownProps {
  userId: string | number;
}

export function AssetBreakdown({ userId }: AssetBreakdownProps) {
  const [balances, setBalances] = useState<DetailedSpotBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDetailedSpotBalance(userId);
        setBalances(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch spot balances';
        console.error('[v0] Error fetching spot balances:', err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (isLoading) {
    return (
      <Card className="p-6 bg-card border border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-card border border-red-500/30">
        <p className="text-red-400 text-sm">{error}</p>
      </Card>
    );
  }

  if (!balances || balances.tokens.length === 0) {
    return (
      <Card className="p-6 bg-card border border-border text-center">
        <p className="text-muted-foreground text-sm">No spot token holdings</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-card border border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Spot Assets</h3>
          <span className="text-sm text-muted-foreground">
            Total: ${balances.totalUsdValue.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Token</TableHead>
                <TableHead className="text-xs md:text-sm text-right">Balance</TableHead>
                <TableHead className="text-xs md:text-sm text-right">USD Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.tokens.map((token) => {
                const formatted = formatSpotToken(token);
                const tokenLogo = getTokenLogo(token.token);
                return (
                  <TableRow key={token.token} className={!formatted.hasPrice ? 'opacity-60' : ''}>
                    <TableCell className="text-xs md:text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {tokenLogo && (
                          <img
                            src={tokenLogo}
                            alt={token.token}
                            className="w-5 h-5 rounded-full flex-shrink-0 bg-secondary"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span>{formatted.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm text-right text-muted-foreground">
                      {formatted.balance}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm text-right font-medium">
                      {formatted.usdValue}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Total Spot Value</span>
            <span className="text-base font-bold text-accent">
              ${balances.totalUsdValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

