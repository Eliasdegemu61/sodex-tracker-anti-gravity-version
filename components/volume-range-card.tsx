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
      <Card className="p-8 bg-card/95 shadow-sm border border-border/20 rounded-[2.5rem] animate-pulse">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-8">Aggregating Flow</h3>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-secondary/10 rounded-2xl" />
          ))}
        </div>
      </Card>
    )
  }

  if (volumeRangeData.length === 0) {
    return (
      <Card className="p-8 bg-card/95 shadow-sm border border-border/20 rounded-[2.5rem]">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-2">Volume Analysis</h3>
        <p className="text-[11px] text-muted-foreground/30 font-bold uppercase ">No cohort data synchronized</p>
      </Card>
    )
  }

  // Find max absolute value for scaling the bars
  const maxAbsPnl = Math.max(...volumeRangeData.map(d => Math.abs(d.avg_pnl)), 1)

  return (
    <TooltipProvider>
      <Card className="p-8 bg-card/95 shadow-sm border border-border/20 rounded-[2.5rem] shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground/60">Avg PNL by Volume range</h3>
        </div>

        <div className="space-y-2">
          {volumeRangeData.map((entry, index) => {
            const isPositive = entry.avg_pnl >= 0
            const barWidth = (Math.abs(entry.avg_pnl) / maxAbsPnl) * 50 // 50% max because it's double sided

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="group flex items-center gap-6 p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-orange-500/5 transition-all duration-300">
                    {/* Range Label */}
                    <div className="w-16 md:w-24 shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground/70 dark:text-muted-foreground/40   group-hover:text-foreground/60 transition-colors">
                        {entry.range}
                      </span>
                    </div>

                    {/* Bar Area */}
                    <div className="relative flex-1 h-3 min-w-[100px]">
                      {/* Center Line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/20 z-10" />

                      {/* The Bar */}
                      <div
                        className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out rounded-full
                          ${isPositive
                            ? 'left-1/2 bg-green-500/40 border border-green-500/20'
                            : 'right-1/2 bg-red-500/40 border border-red-500/20'
                          }`}
                        style={{
                          width: `${barWidth}%`,
                        }}
                      />
                    </div>

                    {/* PnL Value */}
                    <div className="w-16 md:w-24 text-right shrink-0">
                      <span className={`text-[12px] font-bold tracking-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}${formatNumber(Math.abs(entry.avg_pnl))}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-card/90 border border-border/20 text-foreground shadow-2xl rounded-2xl p-4">
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground/40 font-bold  ">{entry.range} Cohort</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                      <p className={`text-xl font-bold tracking-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}${formatNumber(Math.abs(entry.avg_pnl))}
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
              <span className="text-[8px] text-muted-foreground/20 font-bold   leading-none">Net Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
              <span className="text-[8px] text-muted-foreground/20 font-bold   leading-none">Net Profit</span>
            </div>
          </div>
          <span className="text-[8px] text-muted-foreground/10 ">UNIT: USD_FLOW</span>
        </div>
      </Card>
    </TooltipProvider>
  )
}

