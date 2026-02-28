'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';
import { useMemo, useState } from 'react';

export function PositionsTable() {
  const { positions } = usePortfolio();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  const displayPositions = useMemo(() => {
    if (!positions || positions.length === 0) {
      return [];
    }

    return positions.map((position, idx) => {
      // Debug logging to check the actual values
      if (position.pairName === 'SILVER-USD') {
        console.log('[v0] SILVER-USD position:', {
          position_side: (position as any).position_side,
          positionSideLabel: position.positionSideLabel,
          pnl: position.realizedPnlValue,
        });
      }

      return {
        id: String(idx),
        pair: position.pairName,
        type: position.positionSideLabel === 'LONG' ? 'long' : 'short',
        entry: parseFloat(position.avg_entry_price),
        close: parseFloat(position.avg_close_price),
        size: position.closedSize,
        pnl: position.realizedPnlValue,
        pnlPercent: position.closedSize > 0 ? (position.realizedPnlValue / (parseFloat(position.avg_entry_price) * position.closedSize)) * 100 : 0,
        leverage: `${position.leverage}x`,
        marginMode: position.marginModeLabel,
        fee: position.tradingFee,
        createdAt: position.createdAtFormatted,
      };
    });
  }, [positions]);

  // Pagination logic
  const totalPages = Math.ceil(displayPositions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPositions = displayPositions.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
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

  if (!positions || positions.length === 0) {
    return (
      <Card className="p-3 md:p-6 bg-card border border-border">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-4">Position History</h3>
        <p className="text-muted-foreground text-xs md:text-sm">No position history available</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/95 shadow-sm border border-border/20 rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground/60">
          position history
        </h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[11px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-muted-foreground/40 font-bold  ">
              <th className="text-left py-2 px-3">Pair</th>
              <th className="text-left py-2 px-3">Side</th>
              <th className="text-left py-2 px-3">Mode</th>
              <th className="text-right py-2 px-3">Entry</th>
              <th className="text-right py-2 px-3">Close</th>
              <th className="text-right py-2 px-3">Size</th>
              <th className="text-right py-2 px-3">Leverage</th>
              <th className="text-right py-2 px-3">Fee</th>
              <th className="text-right py-2 px-3">PnL</th>
              <th className="text-right py-2 px-3">%</th>
              <th className="text-left py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPositions.map((position) => (
              <tr key={position.id} className="group relative bg-secondary/10 hover:bg-secondary/20 transition-all rounded-xl">
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl font-bold text-foreground/80">{position.pair}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tighter ${position.type === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {position.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight bg-muted/20 px-1.5 py-0.5 rounded">
                    {position.marginMode}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-muted-foreground/60">${position.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                <td className="py-3 px-3 text-right font-bold text-foreground/80">${position.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                <td className="py-3 px-3 text-right text-muted-foreground/60">{position.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="py-3 px-3 text-right font-bold text-foreground/80">{position.leverage}</td>
                <td className="py-3 px-3 text-right text-muted-foreground/60">${position.fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                <td className={`py-3 px-3 text-right font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className={`flex items-center justify-end gap-1 font-bold ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                  </div>
                </td>
                <td className="py-3 px-3 first:rounded-l-xl last:rounded-r-xl text-left text-muted-foreground/40 text-[9px]">{position.createdAt}</td>
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
                  <span className="font-bold text-foreground/80">{position.pair}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${position.type === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {position.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-0.5 ">Entry</span>
                    <span className="text-muted-foreground/60">${position.entry.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-0.5 ">Realized</span>
                    <span className={position.pnl >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {position.pnl >= 0 ? '+' : ''}${Math.abs(position.pnl).toFixed(2)}
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
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Close Price</span>
                  <p className="font-bold text-[11px] text-foreground/80">${position.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Size</span>
                  <p className="font-bold text-[11px] text-foreground/80">{position.size.toFixed(4)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Leverage</span>
                  <p className="font-bold text-[11px] text-foreground/80">{position.leverage}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Mode</span>
                  <p className="font-bold text-[11px] text-foreground/80 uppercase tracking-tighter">{position.marginMode}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Fee</span>
                  <p className="font-bold text-[11px] text-muted-foreground/60">${position.fee.toFixed(4)}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Return %</span>
                  <p className={`font-bold text-[11px] ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="col-span-2 flex flex-col pt-2 border-t border-border/5">
                  <span className="text-muted-foreground/30 uppercase text-[8px] font-bold mb-1 ">Date Closed</span>
                  <p className=" text-[11px] text-muted-foreground/60">{position.createdAt}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-border/5 gap-4">
        {/* Show Rows */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground/30">Show Rows</span>
          <div className="flex gap-1 p-1 bg-secondary/10 rounded-xl border border-border/5">
            {[5, 10, 20, 50].map((value) => (
              <button
                key={value}
                onClick={() => handleRowsPerPageChange(value)}
                className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all ${rowsPerPage === value
                  ? 'bg-accent text-accent-foreground shadow-lg'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-secondary/20'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Prev / Page / Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/20 border border-border/10 text-[11px] font-bold text-foreground/60 hover:bg-secondary/40 hover:text-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <span className="text-[11px] font-bold text-muted-foreground/40 min-w-[40px] text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/20 border border-border/10 text-[11px] font-bold text-foreground/60 hover:bg-secondary/40 hover:text-foreground transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
