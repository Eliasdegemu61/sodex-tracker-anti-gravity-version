'use client'

import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'
import { useState } from 'react'
import { useDexData } from '@/context/dex-data-context'

interface SpotTrader {
  address: string
  userId: string
  vol: number
  rank: number
}

function formatAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'
}

export function TopSpotTradersCard() {
  const { overallStats, isLoading } = useDexData()
  const traders = overallStats?.top_5_spot_vol || []

  if (isLoading) {
    return (
      <Card className="p-3 bg-card/50 border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Traders (Spot)</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-secondary/30 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3 bg-card/50 border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Top Traders (Spot)</h3>
      <div className="space-y-2">
        {traders.length > 0 ? (
          traders.map((trader, idx) => (
            <div key={trader.address} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground font-bold">#{idx + 1}</span>
                <span className="text-muted-foreground truncate">{formatAddress(trader.address)}</span>
              </div>
              <span className="text-accent font-semibold flex-shrink-0">${formatNumber(trader.vol)}</span>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">No data available</div>
        )}
      </div>
    </Card>
  )
}
