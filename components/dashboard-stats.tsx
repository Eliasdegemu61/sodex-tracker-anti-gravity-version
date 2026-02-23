'use client'

import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts'
import { formatNumber } from '@/lib/format-number'
import { useDexData } from '@/context/dex-data-context'
import { useVolumeData } from '@/context/volume-data-context'

interface DashboardStatsProps {
  variant?: 'default' | 'compact'
}

export function DashboardStats({ variant = 'default' }: DashboardStatsProps) {
  const { overallStats, isLoading: dexLoading } = useDexData()
  const { volumeData, isLoading: volumeLoading } = useVolumeData()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const isLoading = dexLoading || volumeLoading

  if (isLoading || !overallStats || !volumeData) {
    return (
      <div className="space-y-2 mb-4">
        {variant === 'compact' ? (
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <Card className="p-2 md:p-3 bg-card/50 border-border h-20" />
            <Card className="p-2 md:p-3 bg-card/50 border-border h-20" />
          </div>
        ) : (
          <>
            <Card className="p-3 bg-card/50 border-border h-16" />
            <Card className="p-3 bg-card/50 border-border h-16" />
            <Card className="p-3 bg-card/50 border-border h-16" />
          </>
        )}
      </div>
    )
  }

  const totalUsers = overallStats?.summary?.total_users || 0
  const spotVolume = volumeData?.all_time_stats?.total_spot_volume || 0
  const futuresVolume = volumeData?.all_time_stats?.total_futures_volume || 0
  const totalVolume = spotVolume + futuresVolume

  const pieData = [
    { name: 'Spot', value: spotVolume },
    { name: 'Futures', value: futuresVolume },
  ]

  // Compact variant - only show top 2 cards
  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic mb-2">Total Users</h3>
          <div className="text-xl font-bold font-mono tracking-tight text-foreground">{totalUsers.toLocaleString()}</div>
        </Card>
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic mb-2">Total Volume</h3>
          <div className="text-xl font-bold font-mono tracking-tight text-foreground">${formatNumber(totalVolume)}</div>
        </Card>
      </div>
    )
  }

  // Default variant - show all cards
  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic mb-2">Total Users</h3>
          <div className="text-xl font-bold font-mono tracking-tight text-foreground">{totalUsers.toLocaleString()}</div>
        </Card>
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic mb-2">Total Volume</h3>
          <div className="text-xl font-bold font-mono tracking-tight text-foreground">${formatNumber(totalVolume)}</div>
        </Card>
      </div>

      {/* Spot vs Futures Volume */}
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 dark:text-muted-foreground/40 italic">Market Split</h3>
          <div className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[8px] font-mono font-bold uppercase tracking-widest">Live Flow</div>
        </div>

        <div className="relative w-full h-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full scale-50 opacity-50" />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className="transition-transform duration-700 group-hover:scale-105">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={true}
                stroke="none"
              >
                <Cell fill="#fb923c" className="drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" />
                <Cell fill="#ea580c" className="drop-shadow-[0_0_8px_rgba(234,88,12,0.4)]" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Futures</span>
            <span className="text-xs font-bold font-mono text-foreground/80">
              {((futuresVolume / totalVolume) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="p-3 bg-secondary/10 rounded-2xl border border-border/5 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-[8px] text-muted-foreground/70 dark:text-muted-foreground/40 font-bold uppercase tracking-widest italic">Spot</span>
            </div>
            <p className="text-xs font-bold font-mono text-foreground/80">${formatNumber(spotVolume)}</p>
          </div>
          <div className="p-3 bg-secondary/10 rounded-2xl border border-border/5 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
              <span className="text-[8px] text-muted-foreground/70 dark:text-muted-foreground/40 font-bold uppercase tracking-widest italic">Futures</span>
            </div>
            <p className="text-xs font-bold font-mono text-foreground/80">${formatNumber(futuresVolume)}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
