'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/format-number'
import { useDexData } from '@/context/dex-data-context'

interface Gainer {
  userId: string
  address: string
  pnl: number
  vol: number
  rank: number
}

export function TopGainersCard() {
  const { overallStats, isLoading } = useDexData()
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  const gainers = overallStats?.top_5_gainers || []

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
        <TrendingUp className="w-4 h-4 text-green-500" />
        Top 5 Gainers
      </h3>
      <div className="space-y-2">
        {gainers.length > 0 ? (
          gainers.map((item, idx) => (
            <div key={item.address} className="flex items-center justify-between p-2 bg-secondary/30 rounded hover:bg-secondary/50 transition">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                <span className="text-xs font-mono text-foreground truncate">{formatAddress(item.address)}</span>
              </div>
              <span className="text-xs font-bold text-green-500 flex-shrink-0">+${formatNumber(item.pnl)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">No gainers available</div>
        )}
      </div>
    </Card>
  )
}
