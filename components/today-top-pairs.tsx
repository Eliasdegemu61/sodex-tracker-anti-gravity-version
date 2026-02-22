'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { TodayData } from '@/types/today-data'
import { useVolumeData } from '@/context/volume-data-context'
import { getTokenLogo } from '@/lib/token-logos'

export function TodayTopPairs() {
  const { volumeData, isLoading, error } = useVolumeData()

  const formatVolume = (volume: number) => {
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M'
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K'
    return volume.toFixed(2)
  }

  if (error) {
    return (
      <Card className="p-4 bg-card/50 border-border">
        <div className="text-center text-sm text-destructive">
          <p className="font-semibold mb-1">Connection Lost</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </Card>
    )
  }

  if (isLoading || !volumeData) {
    return (
      <Card className="p-4 bg-card/50 border-border">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-secondary rounded w-1/3" />
          <div className="h-32 bg-secondary rounded" />
        </div>
      </Card>
    )
  }

  const todayData = volumeData.today_stats
  const allTodayPairs = [...todayData.top_5_spot, ...todayData.top_5_futures]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4)

  const todaySpotVolume = todayData.top_5_spot.reduce((sum, p) => sum + p.volume, 0)
  const todayFuturesVolume = todayData.top_5_futures.reduce((sum, p) => sum + p.volume, 0)

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <h3 className="text-xs md:text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        Today's Top Pairs
      </h3>
      <p className="text-xs text-muted-foreground mb-3">{todayData.date}</p>

      {/* Top Pairs List */}
      <div className="space-y-2">
        {allTodayPairs.length > 0 ? (
          allTodayPairs.map((pair, idx) => {
            const isSpot = todayData.top_5_spot.some(p => p.pair === pair.pair)
            return (
              <div key={pair.pair} className="flex items-center justify-between p-2 bg-secondary/30 rounded hover:bg-secondary/50 transition">
                <div className="flex items-center gap-2 min-w-0 px-1 pl-0">
                  {getTokenLogo(pair.pair) && (
                    <img
                      src={getTokenLogo(pair.pair)}
                      alt={pair.pair}
                      className="w-5 h-5 rounded-full flex-shrink-0 bg-secondary"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span className="text-xs font-mono text-foreground truncate">{pair.pair}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded text-xs font-semibold ${isSpot ? 'bg-orange-400/20 text-orange-400' : 'bg-orange-600/20 text-orange-600'
                    }`}>
                    {isSpot ? 'S' : 'F'}
                  </span>
                </div>
                <span className="text-xs font-bold text-accent flex-shrink-0">${formatVolume(pair.volume)}</span>
              </div>
            )
          })
        ) : (
          <div className="text-xs text-muted-foreground text-center py-4">No pairs available</div>
        )}
      </div>
    </Card>
  )
}
