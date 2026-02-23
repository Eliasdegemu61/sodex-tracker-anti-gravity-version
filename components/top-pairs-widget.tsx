'use client'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp } from 'lucide-react'
import { useVolumeData } from '@/context/volume-data-context'
import { getTokenLogo } from '@/lib/token-logos'

export function TopPairsWidget() {
  const { volumeData, isLoading } = useVolumeData()

  if (isLoading || !volumeData) {
    return (
      <Card className="p-8 bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2.5rem] animate-pulse">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-8">Auditing Volume</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-secondary/10 rounded-2xl" />
            <div className="h-16 bg-secondary/10 rounded-2xl" />
          </div>
          <div className="h-48 bg-secondary/10 rounded-2xl" />
        </div>
      </Card>
    )
  }

  const formatVolume = (volume: number | undefined) => {
    if (!volume) return '0'
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B'
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M'
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K'
    return volume.toFixed(2)
  }

  const stats = volumeData.all_time_stats
  const allTopPairs = [...stats.top_5_spot, ...stats.top_5_futures]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)

  return (
    <Card className="p-8 bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic">Historical Dominance</h3>
        <TrendingUp className="w-4 h-4 text-orange-400/40" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-secondary/5 border border-border/5 rounded-2xl flex flex-col items-center">
          <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic mb-1">Total Spot</span>
          <span className="text-xl font-bold font-mono text-orange-400">${formatVolume(stats.total_spot_volume)}</span>
        </div>
        <div className="p-4 bg-secondary/5 border border-border/5 rounded-2xl flex flex-col items-center">
          <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic mb-1">Total Futures</span>
          <span className="text-xl font-bold font-mono text-orange-600">${formatVolume(stats.total_futures_volume)}</span>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 bg-secondary/5 p-1 rounded-2xl border border-border/5">
          <TabsTrigger value="all" className="text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">All</TabsTrigger>
          <TabsTrigger value="spot" className="text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl data-[state=active]:bg-orange-400 data-[state=active]:text-white transition-all">Spot</TabsTrigger>
          <TabsTrigger value="futures" className="text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all">Futures</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-2 outline-none">
          {allTopPairs.map((pair) => (
            <div key={pair.pair} className="group flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-orange-500/5 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {getTokenLogo(pair.pair) ? (
                    <img
                      src={getTokenLogo(pair.pair)}
                      alt={pair.pair}
                      className="w-6 h-6 rounded-full flex-shrink-0 bg-background/50 p-0.5 border border-border/10 group-hover:border-orange-500/20"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center text-[8px] font-bold text-orange-400">{pair.pair.slice(0, 1)}</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold font-mono text-foreground/80">{pair.pair}</span>
                  <span className="text-[7px] text-muted-foreground/20 font-bold uppercase tracking-widest italic">{pair.pair.includes('-') ? 'Futures' : 'Spot'}</span>
                </div>
              </div>
              <span className="text-[12px] font-bold font-mono text-orange-400/90">${formatVolume(pair.volume)}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="spot" className="mt-6 space-y-2 outline-none">
          {stats.top_5_spot.map((pair) => (
            <div key={pair.pair} className="group flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-orange-400/5 transition-all duration-300">
              <div className="flex items-center gap-3">
                {getTokenLogo(pair.pair) && <img src={getTokenLogo(pair.pair)} alt={pair.pair} className="w-6 h-6 rounded-full bg-background/50 p-0.5 border border-border/10" />}
                <span className="text-[12px] font-bold font-mono text-foreground/80">{pair.pair}</span>
              </div>
              <span className="text-[12px] font-bold font-mono text-orange-400/90">${formatVolume(pair.volume)}</span>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="futures" className="mt-6 space-y-2 outline-none">
          {stats.top_5_futures.map((pair) => (
            <div key={pair.pair} className="group flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-orange-600/5 transition-all duration-300">
              <div className="flex items-center gap-3">
                {getTokenLogo(pair.pair) && <img src={getTokenLogo(pair.pair)} alt={pair.pair} className="w-6 h-6 rounded-full bg-background/50 p-0.5 border border-border/10" />}
                <span className="text-[12px] font-bold font-mono text-foreground/80">{pair.pair}</span>
              </div>
              <span className="text-[12px] font-bold font-mono text-orange-600/90">${formatVolume(pair.volume)}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
