'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Loader2, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';

interface FundFlowData {
  account: string;
  amount: string;
  chain: string;
  coin: string;
  decimals: number;
  status: string;
  statusTime: number;
  type: 'CustodyDeposit' | 'CustodyWithdraw' | string;
  token: string;
  txHash: string;
  receiver?: string;
  sender?: string;
}

interface FundFlowTableProps {
  walletAddress: string;
}

export function FundFlowTable({ walletAddress }: FundFlowTableProps) {
  const [flows, setFlows] = useState<FundFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showingTxHash, setShowingTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    fetchFundFlow();
  }, [walletAddress]);

  const fetchFundFlow = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallet/fund-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fund flow data');
      }

      const data = await response.json();

      if (data.code === '0' && data.data?.accountFlows) {
        setFlows(data.data.accountFlows);
      } else {
        throw new Error(data.message || 'No fund flow data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fund flow';
      setError(errorMessage);
      setFlows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isDeposit = (type: string) => type.includes('Deposit');
  const isWithdraw = (type: string) => type.includes('Withdraw');

  const displayFlows = useMemo(() => {
    return flows.filter(flow => {
      if (filterType === 'deposit') return isDeposit(flow.type);
      if (filterType === 'withdraw') return isWithdraw(flow.type);
      return true;
    });
  }, [flows, filterType]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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

  // Pagination logic
  const totalPages = Math.ceil(displayFlows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedFlows = displayFlows.slice(startIndex, endIndex);

  const formatAmount = (amount: string, decimals: number) => {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  };

  // Calculate netflow stats
  const netflowStats = useMemo(() => {
    const deposits = flows
      .filter(f => isDeposit(f.type))
      .reduce((sum, f) => sum + parseFloat(f.amount) / Math.pow(10, f.decimals), 0);

    const withdrawals = flows
      .filter(f => isWithdraw(f.type))
      .reduce((sum, f) => sum + parseFloat(f.amount) / Math.pow(10, f.decimals), 0);

    const netflow = deposits - withdrawals;

    return { deposits, withdrawals, netflow };
  }, [flows]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Success') {
      return 'bg-emerald-900/50 text-emerald-300';
    }
    return 'bg-amber-900/50 text-amber-300';
  };

  const getExplorerUrl = (txHash: string, chain: string) => {
    const chainMap: { [key: string]: string } = {
      // EVM Chains
      'ARB': 'https://arbiscan.io/tx/',
      'ARBITRUM': 'https://arbiscan.io/tx/',
      'ETH': 'https://etherscan.io/tx/',
      'ETHEREUM': 'https://etherscan.io/tx/',
      'POLYGON': 'https://polygonscan.com/tx/',
      'POLY': 'https://polygonscan.com/tx/',
      'OPTIMISM': 'https://optimistic.etherscan.io/tx/',
      'OPT': 'https://optimistic.etherscan.io/tx/',
      'BASE': 'https://basescan.org/tx/',
      'AVAX': 'https://snowtrace.io/tx/',
      'AVAXC': 'https://snowtrace.io/tx/',
      'AVALANCHE': 'https://snowtrace.io/tx/',
      'BSC': 'https://bscscan.com/tx/',
      'BSCSCAN': 'https://bscscan.com/tx/',
      'BINANCE': 'https://bscscan.com/tx/',
      'HYPERLIQUID': 'https://explorer.hyperliquid.xyz/tx/',
      'HYPE': 'https://explorer.hyperliquid.xyz/tx/',
      // Non-EVM Chains
      'SOLANA': 'https://solscan.io/tx/',
      'SOL': 'https://solscan.io/tx/',
      'SUI': 'https://suiscan.xyz/tx/',
      'TON': 'https://tonscan.org/tx/',
      'XLM': 'https://stellar.expert/explorer/public/tx/',
      'STELLAR': 'https://stellar.expert/explorer/public/tx/',
      'LTC': 'https://blockchair.com/litecoin/transaction/',
      'LITECOIN': 'https://blockchair.com/litecoin/transaction/',
      'BTC': 'https://www.blockchain.com/btc/tx/',
      'BITCOIN': 'https://www.blockchain.com/btc/tx/',
      'XRP': 'https://xrpscan.com/tx/',
      'RIPPLE': 'https://xrpscan.com/tx/',
      'DOGE': 'https://blockchair.com/dogecoin/transaction/',
      'DOGECOIN': 'https://blockchair.com/dogecoin/transaction/',
    };

    // Extract the chain name, handling formats like "BASE_ETH", "ARB_ETH", etc.
    const chainParts = chain.split('_');
    const chainName = chainParts[0].toUpperCase();

    const baseUrl = chainMap[chainName] || chainMap['ARB'];
    return `${baseUrl}${txHash}`;
  };

  if (isLoading) {
    return (
      <Card className="p-12 bg-card/95 shadow-sm border border-border/20 rounded-3xl text-center">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin mb-4" />
          <p className="text-[10px] text-muted-foreground/40 font-bold  ">Interrogating ledgers...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-card/95 shadow-sm border border-red-500/20 rounded-3xl">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400/40 mb-3" />
          <h3 className="text-[10px] font-bold  text-red-400/60  mb-1">Stream Blocked</h3>
          <p className="text-[10px] text-muted-foreground/30 font-bold uppercase ">{error}</p>
          <Button onClick={fetchFundFlow} variant="outline" size="sm" className="mt-4 bg-secondary/10 border-border/10 rounded-xl text-[10px] font-bold ">
            Retry Sync
          </Button>
        </div>
      </Card>
    );
  }

  if (flows.length === 0) {
    return (
      <Card className="p-12 bg-card/95 shadow-sm border border-border/20 rounded-3xl text-center">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-2">Fund Flow</h3>
        <p className="text-[10px] text-muted-foreground/20 font-bold  ">No transfers detected</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/95 shadow-sm border border-border/20 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <h3 className="text-xs font-semibold text-muted-foreground/60">Fund Flow</h3>

        {/* Netflow Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold   text-center">Inflow</p>
            <p className="text-sm font-bold text-green-400 text-center">
              ${netflowStats.deposits.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold   text-center">Outflow</p>
            <p className="text-sm font-bold text-red-400 text-center">
              ${netflowStats.withdrawals.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`rounded-2xl p-4 border space-y-1 ${netflowStats.netflow >= 0 ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
            <p className="text-[7px] text-muted-foreground/30 font-bold   text-center">Net</p>
            <p className={`text-sm font-bold text-center ${netflowStats.netflow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${(netflowStats.netflow >= 0 ? '+' : '')}{netflowStats.netflow.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'all', label: 'All Transfers', color: 'accent' },
          { id: 'deposit', label: 'Deposits', color: 'green-500' },
          { id: 'withdraw', label: 'Withdrawals', color: 'red-500' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setFilterType(type.id as any);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-[10px] font-bold  rounded-xl transition-all border ${filterType === type.id
              ? `bg-${type.color}/10 border-${type.color}/20 text-${type.color === 'accent' ? 'foreground' : type.color}`
              : 'bg-secondary/5 border-border/5 text-muted-foreground/40 hover:text-foreground hover:bg-secondary/10'
              }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[11px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-muted-foreground/40 font-bold  ">
              <th className="text-left py-2 px-3">Type</th>
              <th className="text-left py-2 px-3">Asset</th>
              <th className="text-right py-2 px-3">Amount</th>
              <th className="text-left py-2 px-3">Network</th>
              <th className="text-left py-2 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFlows.map((flow, idx) => (
              <tr key={`${startIndex}-${idx}`} className="group relative bg-secondary/10 hover:bg-secondary/20 transition-all rounded-xl">
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl">
                  <div className="flex items-center gap-2">
                    {isDeposit(flow.type) ? (
                      <ArrowDown className="w-3.5 h-3.5 text-green-400/60" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-red-400/60" />
                    )}
                    <span className={`font-bold uppercase tracking-tighter ${isDeposit(flow.type) ? 'text-green-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? 'Deposit' : 'Withdraw'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 font-bold text-foreground/80">{flow.coin}</td>
                <td className={`py-3 px-2 text-right font-bold ${isDeposit(flow.type) ? 'text-green-400' : 'text-red-400'}`}>
                  {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)}
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded-lg bg-secondary/20 text-muted-foreground/50 text-[9px] font-bold ">
                    {flow.chain.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl text-left text-muted-foreground/30 text-[9px]">{formatDate(flow.statusTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Expandable List */}
      <div className="md:hidden space-y-3">
        {paginatedFlows.map((flow, idx) => {
          const rowId = `${startIndex}-${idx}`;
          return (
            <div key={rowId} className="bg-secondary/10 border border-border/10 rounded-2xl overflow-hidden transition-all hover:border-accent/10">
              {/* Expandable Row Summary */}
              <button
                onClick={() => toggleExpand(rowId)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/10 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isDeposit(flow.type) ? (
                      <ArrowDown className="w-4 h-4 text-green-400/60" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-red-400/60" />
                    )}
                    <span className={`font-bold uppercase tracking-tighter ${isDeposit(flow.type) ? 'text-green-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? 'Deposit' : 'Withdraw'}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/40">
                    {flow.coin} • {flow.chain.replace('_', ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-bold ${isDeposit(flow.type) ? 'text-green-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)}
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${expandedRows.has(rowId) ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Expandable Details */}
              {expandedRows.has(rowId) && (
                <div className="p-4 border-t border-border/5 bg-secondary/[0.02] grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Network</span>
                    <p className="font-bold text-[11px] text-foreground/80">{flow.chain.replace('_', ' ')}</p>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Timestamp</span>
                    <p className="font-bold text-[9px] text-muted-foreground/30">{formatDate(flow.statusTime)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Total Value</span>
                    <p className={`font-bold text-sm ${isDeposit(flow.type) ? 'text-green-400' : 'text-red-400'}`}>
                      {isDeposit(flow.type) ? '+' : '-'} {formatAmount(flow.amount, flow.decimals)} {flow.coin}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between mt-8 pt-8 border-t border-border/5 gap-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold  text-muted-foreground/30 ">Rows</span>
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

        <div className="text-[10px] font-bold text-muted-foreground/20 ">
          {startIndex + 1}-{Math.min(endIndex, displayFlows.length)} of {displayFlows.length}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            variant="outline"
            className="h-8 md:h-9 bg-secondary/10 border-border/10 rounded-xl hover:bg-accent/10 hover:text-accent transition-all text-[10px] font-bold "
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
            className="h-8 md:h-9 bg-secondary/10 border-border/10 rounded-xl hover:bg-accent/10 hover:text-accent transition-all text-[10px] font-bold "
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

