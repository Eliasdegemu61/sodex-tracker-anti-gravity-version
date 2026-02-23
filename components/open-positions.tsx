'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo, useState, useEffect } from 'react';
import { fetchOpenPositions, fetchAccountDetails, type OpenPositionData, type BalanceData } from '@/lib/sodex-api';
import { cacheManager } from '@/lib/cache';

export function OpenPositions() {
  const { userId } = usePortfolio();
  const [openPositions, setOpenPositions] = useState<OpenPositionData[]>([]);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const loadOpenPositions = async (skipCache = false) => {
    if (!userId) return;

    try {
      // Clear cache for this user if we want fresh data (for auto-refresh)
      if (skipCache) {
        cacheManager.delete(`accountDetails_${userId}`);
        console.log('[v0] Cleared cache for open positions refresh');
      }

      console.log('[v0] Fetching account details for userId:', userId);
      const accountData = await fetchAccountDetails(userId);
      setOpenPositions(accountData.positions);
      setBalanceData(accountData.balances[0] || null);
      setLastUpdateTime(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch open positions';
      console.error('[v0] Error fetching open positions:', errorMessage);
      setError(errorMessage);
    }
  };

  // Initial fetch when component mounts or userId changes - ALWAYS FRESH DATA
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    // Clear cache before initial fetch to get fresh data on page load
    cacheManager.delete(`accountDetails_${userId}`);
    console.log('[v0] Cleared cache for fresh data on page load');
    loadOpenPositions().then(() => setIsLoading(false));
  }, [userId]);

  // Auto-refresh every 1 second with cache bypass
  useEffect(() => {
    if (!userId) return;

    const refreshInterval = setInterval(() => {
      setIsRefreshing(true);
      loadOpenPositions(true).then(() => setIsRefreshing(false)); // true = skip cache
    }, 1000); // 1 second

    return () => clearInterval(refreshInterval);
  }, [userId]);

  const displayPositions = useMemo(() => {
    return openPositions.map((position, idx) => ({
      id: String(idx),
      symbol: position.symbol,
      side: position.positionSide,
      size: parseFloat(position.positionSize),
      entry: parseFloat(position.entryPrice),
      liquidation: parseFloat(position.liquidationPrice),
      margin: parseFloat(position.isolatedMargin),
      leverage: position.leverage,
      unrealized: parseFloat(position.unrealizedProfit),
      realized: parseFloat(position.realizedProfit),
      fee: parseFloat(position.cumTradingFee),
      createdAt: new Date(position.createdTime).toLocaleString(),
    }));
  }, [openPositions]);

  // Pagination logic
  const totalPages = Math.ceil(displayPositions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPositions = displayPositions.slice(startIndex, endIndex);

  const handleRowsPerPageChange = (newRows: number) => {
    setRowsPerPage(newRows);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!userId) {
    return (
      <Card className="p-12 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-2">No Account Bound</h3>
        <p className="text-[10px] text-muted-foreground/30 font-bold uppercase italic">Bind your account to view open positions</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-12 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl text-center">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
          <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">scanning perimeter...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-card/20 backdrop-blur-xl border border-red-500/20 rounded-3xl">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400/40 mb-3" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/60 italic mb-1">Signal Interrupted</h3>
          <p className="text-[10px] text-muted-foreground/30 font-bold uppercase italic">{error}</p>
        </div>
      </Card>
    );
  }

  if (openPositions.length === 0) {
    return (
      <Card className="p-12 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl text-center">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-2">No Open Positions</h3>
        <p className="text-[10px] text-muted-foreground/20 font-bold uppercase tracking-widest italic">All systems clear</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">Open Positions</h3>
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/10 border border-accent/20">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          </div>
        </div>
        {lastUpdateTime && (
          <span className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">
            Sync: {lastUpdateTime}
          </span>
        )}
      </div>

      {/* Balance Info */}
      {balanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-secondary/5 border border-border/5 space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Wallet Balance</p>
            <p className="text-xl font-bold tracking-tight text-foreground/80">${parseFloat(balanceData.walletBalance).toFixed(2)}</p>
            <p className="text-[7px] text-muted-foreground/20 font-bold uppercase tracking-widest">perpetuals (usdc)</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/5 border border-border/5 space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Liquidity</p>
            <p className="text-xl font-bold tracking-tight text-green-400">${parseFloat(balanceData.availableBalance).toFixed(2)}</p>
            <p className="text-[7px] text-muted-foreground/20 font-bold uppercase tracking-widest">Available to trade</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary/5 border border-border/5 space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Exposure</p>
            <p className="text-xl font-bold tracking-tight text-orange-400">${parseFloat(balanceData.openOrderMarginFrozen).toFixed(2)}</p>
            <p className="text-[7px] text-muted-foreground/20 font-bold uppercase tracking-widest">Margin in use</p>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[11px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-muted-foreground/40 font-bold uppercase tracking-widest italic">
              <th className="text-left py-2 px-3">Symbol</th>
              <th className="text-left py-2 px-3">Side</th>
              <th className="text-right py-2 px-3">Size</th>
              <th className="text-right py-2 px-3">Entry</th>
              <th className="text-right py-2 px-3">Liq.</th>
              <th className="text-right py-2 px-3">Lev.</th>
              <th className="text-right py-2 px-3">Margin</th>
              <th className="text-right py-2 px-3">uPnL</th>
              <th className="text-right py-2 px-3">Fee</th>
              <th className="text-left py-2 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPositions.map((position) => (
              <tr key={position.id} className="group relative bg-secondary/10 hover:bg-secondary/20 transition-all rounded-xl">
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl font-bold text-foreground/80">{position.symbol}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tighter ${position.side === 'LONG' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {position.side}
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-bold text-foreground/80">
                  {position.size.toFixed(4)}
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground/60">${position.entry.toFixed(4)}</td>
                <td className="py-3 px-2 text-right text-red-400/40">${position.liquidation.toFixed(4)}</td>
                <td className="py-3 px-2 text-right font-bold text-accent/60">{position.leverage}x</td>
                <td className="py-3 px-2 text-right text-muted-foreground/60">${position.margin.toFixed(4)}</td>
                <td
                  className={`py-3 px-2 text-right font-bold ${position.unrealized >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                >
                  <div className="flex items-center justify-end gap-1">
                    {position.unrealized >= 0 ? '+' : ''}${Math.abs(position.unrealized).toFixed(2)}
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground/40 text-[9px]">${position.fee.toFixed(4)}</td>
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl text-left text-muted-foreground/30 text-[9px]">{position.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Expandable List */}
      <div className="md:hidden space-y-3">
        {paginatedPositions.map((position) => (
          <div key={position.id} className="bg-secondary/10 border border-border/10 rounded-2xl overflow-hidden transition-all hover:border-accent/10">
            {/* Expandable Row Summary */}
            <button
              onClick={() => toggleExpand(position.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-foreground/80">{position.symbol}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${position.side === 'LONG' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {position.side}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-0.5 italic">Size</span>
                    <span className="text-muted-foreground/60">{position.size.toFixed(4)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-0.5 italic">uPnL</span>
                    <span className={position.unrealized >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {position.unrealized >= 0 ? '+' : ''}${Math.abs(position.unrealized).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${expandedRows.has(position.id) ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Expandable Details */}
            {expandedRows.has(position.id) && (
              <div className="p-4 border-t border-border/5 bg-secondary/[0.02] grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Entry</span>
                  <p className="font-bold text-[11px] text-foreground/80">${position.entry.toFixed(4)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Liq. Price</span>
                  <p className="font-bold text-[11px] text-red-400/60">${position.liquidation.toFixed(4)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Leverage</span>
                  <p className="font-bold text-[11px] text-accent/60">{position.leverage}x</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Margin</span>
                  <p className="font-bold text-[11px] text-foreground/60">${position.margin.toFixed(4)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Fee</span>
                  <p className="font-bold text-[11px] text-muted-foreground/40">${position.fee.toFixed(6)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 italic">Opened</span>
                  <p className="font-bold text-[9px] text-muted-foreground/30">{position.createdAt}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-8 pt-8 border-t border-border/5 gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 italic">Rows</span>
          <div className="flex gap-1.5 p-1 bg-secondary/10 rounded-xl border border-border/5">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                onClick={() => handleRowsPerPageChange(value)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${rowsPerPage === value
                    ? 'bg-accent text-accent-foreground shadow-lg'
                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary/20'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">
          {startIndex + 1}-{Math.min(endIndex, displayPositions.length)} of {displayPositions.length}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="outline"
            className="h-8 md:h-9 bg-secondary/10 border-border/10 rounded-xl hover:bg-accent/10 hover:text-accent transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev
          </Button>

          <div className="px-3 py-1.5 bg-secondary/5 rounded-xl border border-border/5">
            <span className="text-[10px] font-bold text-muted-foreground/60">
              {currentPage} / {totalPages}
            </span>
          </div>

          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            className="h-8 md:h-9 bg-secondary/10 border-border/10 rounded-xl hover:bg-accent/10 hover:text-accent transition-all text-[10px] font-bold uppercase tracking-widest"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
