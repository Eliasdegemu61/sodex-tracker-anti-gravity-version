'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'

export function OverallProfitEfficiencyCard() {
  const [overallEfficiency, setOverallEfficiency] = useState<number>(0)
  const [overallPnL, setOverallPnL] = useState<number>(0)
  const [overallVolume, setOverallVolume] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/live_stats.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const traders: Array<{ userId: string; address: string; pnl: string; vol: string }> =
          await response.json()

        const totalPnl = traders.reduce((sum, t) => sum + parseFloat(t.pnl), 0)
        const totalVolume = traders.reduce((sum, t) => sum + parseFloat(t.vol), 0)
        const efficiency = totalVolume > 0 ? (totalPnl / totalVolume) * 1000 : 0

        setOverallEfficiency(efficiency)
        setOverallPnL(totalPnl)
        setOverallVolume(totalVolume)
      } catch (error) {
        console.error('[v0] Error fetching overall profit efficiency data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-4">Optimizing yield</h3>
        <div className="h-8 bg-secondary/10 rounded-xl" />
      </Card>
    )
  }

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm group hover:border-orange-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground/60">Global Efficiency</h3>
        <div className="w-1.5 h-1.5 rounded-full bg-orange-400/40" />
      </div>
      <div className="flex items-center gap-3">
        <div className={`text-xl font-bold tracking-tight ${overallEfficiency >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ${formatNumber(overallEfficiency)}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground/30 font-bold   leading-none">Yield/1K</span>
          <span className="text-[10px] font-bold text-foreground/40 mt-0.5">ESTIMATED</span>
        </div>
      </div>
    </Card>
  )
}

