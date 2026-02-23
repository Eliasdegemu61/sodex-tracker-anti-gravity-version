'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import { formatNumber } from '@/lib/format-number'
import { useDexData } from '@/context/dex-data-context'

interface Loser {
  userId: string
  address: string
  pnl: number
  vol: number
  rank: number
}

export function TopLosersCard() {
  const { overallStats, isLoading } = useDexData()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const losers = overallStats?.top_5_losers || []

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-4">Scanning Drawdowns</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(idx => (
            <div key={idx} className="h-10 bg-secondary/10 rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  const formatAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'
  }

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic">Top 5 Losers</h3>
        <TrendingDown className="w-4 h-4 text-red-400/40" />
      </div>

      <div className="space-y-2">
        {losers.length > 0 ? (
          losers.map((item, idx) => (
            <div key={item.address} className="group flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-red-500/5 transition-all duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-bold font-mono text-red-500/60 w-4">#{idx + 1}</span>
                <span className="text-[11px] font-mono text-foreground/60 dark:text-foreground/60 text-foreground/80 truncate">{formatAddress(item.address)}</span>
              </div>
              <span className="text-[11px] font-bold font-mono text-red-400 tracking-tight">-${formatNumber(Math.abs(item.pnl))}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest italic text-center py-6">Intelligence Blank</div>
        )}
      </div>
    </Card>
  )
}
