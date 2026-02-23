'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
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
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-red-500/20 rounded-3xl">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400/60 italic mb-2">Sync Error</h3>
        <p className="text-[10px] text-muted-foreground/30 font-bold uppercase italic">{error}</p>
      </Card>
    )
  }

  if (isLoading || !volumeData) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse">
        <div className="space-y-3">
          <div className="h-2 bg-secondary/10 rounded-full w-1/3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-10 bg-secondary/10 rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  const todayData = volumeData.today_stats
  const allTodayPairs = [...todayData.top_5_spot, ...todayData.top_5_futures]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4)

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic">Top Performers</h3>
          <span className="text-[8px] text-muted-foreground/20 italic">{todayData.date}</span>
        </div>
        <TrendingUp className="w-4 h-4 text-orange-400/40" />
      </div>

      <div className="space-y-2">
        {allTodayPairs.length > 0 ? (
          allTodayPairs.map((pair, idx) => {
            const isSpot = todayData.top_5_spot.some(p => p.pair === pair.pair)
            return (
              <div key={pair.pair} className="group flex items-center justify-between p-3 bg-secondary/10 rounded-2xl border border-border/5 hover:bg-orange-500/5 hover:border-orange-500/10 transition-all duration-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    {getTokenLogo(pair.pair) ? (
                      <img
                        src={getTokenLogo(pair.pair)}
                        alt={pair.pair}
                        className="w-6 h-6 rounded-full flex-shrink-0 bg-background/50 p-0.5 border border-border/10 group-hover:border-orange-500/20"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-[8px] font-bold text-orange-400">
                        {pair.pair.slice(0, 1)}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-background flex items-center justify-center text-[6px] font-bold ${isSpot ? 'bg-orange-400 text-white' : 'bg-orange-600 text-white'
                      }`}>
                      {isSpot ? 'S' : 'F'}
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-foreground/80 tracking-tight">{pair.pair}</span>
                </div>
                <span className="text-[11px] font-bold text-orange-400/90">${formatVolume(pair.volume)}</span>
              </div>
            )
          })
        ) : (
          <div className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest italic text-center py-6">Identity Shielded</div>
        )}
      </div>
    </Card>
  )
}
