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
      <Card className="p-3 bg-card/50 border-border">
        <div className="h-48 animate-pulse" />
      </Card>
    )
  }

  const formatAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'
  }

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <h3 className="text-xs md:text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <TrendingDown className="w-4 h-4 text-red-500" />
        Top 5 Losers
      </h3>
      <div className="space-y-2">
        {losers.length > 0 ? (
          losers.map((item, idx) => (
            <div key={item.address} className="flex items-center justify-between p-2 bg-secondary/30 rounded hover:bg-secondary/50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <span className="text-xs font-mono text-foreground truncate">{formatAddress(item.address)}</span>
              </div>
              <span className="text-xs font-bold text-destructive flex-shrink-0">-${formatNumber(Math.abs(item.pnl))}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">No losers available</div>
        )}
      </div>
    </Card>
  )
}
