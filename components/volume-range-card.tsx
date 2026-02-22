'use client'

import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'
import { useDexData } from '@/context/dex-data-context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function VolumeRangeCard() {
  const { overallStats, isLoading } = useDexData()
  const volumeRangeData = overallStats?.chart_data || []

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <div className="space-y-4">
          <div className="h-4 w-48 bg-muted/20 rounded animate-pulse mb-6" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-muted/10 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    )
  }

  if (volumeRangeData.length === 0) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <p className="text-sm text-muted-foreground text-center py-8">No volume range data available.</p>
      </Card>
    )
  }

  // Find max absolute value for scaling the bars
  const maxAbsPnl = Math.max(...volumeRangeData.map(d => Math.abs(d.avg_pnl)), 1)

  return (
    <TooltipProvider>
      <Card className="p-4 md:p-6 bg-card border-border shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              Average PnL by Volume Range
            </p>
          </div>

          <div className="space-y-1">
            {volumeRangeData.map((entry, index) => {
              const isPositive = entry.avg_pnl >= 0
              const barWidth = (Math.abs(entry.avg_pnl) / maxAbsPnl) * 50 // 50% max because it's double sided

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="group flex items-center gap-4 py-1.5 border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors rounded-sm px-1 cursor-default">
                      {/* Range Label */}
                      <div className="w-16 md:w-24 shrink-0">
                        <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider text-nowrap">
                          {entry.range}
                        </span>
                      </div>

                      {/* Bar Area */}
                      <div className="relative flex-1 h-2.5 md:h-3 min-w-[100px]">
                        {/* Center Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/80 z-10" />

                        {/* The Bar */}
                        <div
                          className={`absolute top-0 bottom-0 transition-all duration-700 ease-out shadow-sm rounded-full
                            ${isPositive
                              ? 'left-1/2 bg-green-500/70 border-l border-green-400/30'
                              : 'right-1/2 bg-red-500/70 border-r border-red-400/30'
                            }`}
                          style={{
                            width: `${barWidth}%`,
                          }}
                        />
                      </div>

                      {/* PnL Value */}
                      <div className="w-16 md:w-24 text-right shrink-0">
                        <span className={`text-[10px] md:text-xs font-bold tabular-nums tracking-tight ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? '+' : '-'}${formatNumber(Math.abs(entry.avg_pnl))}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border border-border text-foreground shadow-xl">
                    <div className="space-y-1 p-0.5">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{entry.range}</p>
                      <p className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? 'Profit:' : 'Loss:'} {isPositive ? '+' : '-'}${formatNumber(Math.abs(entry.avg_pnl))}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>

          {/* Simplified Legend */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/80" />
              <span>Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500/80" />
              <span>Profit</span>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  )
}
