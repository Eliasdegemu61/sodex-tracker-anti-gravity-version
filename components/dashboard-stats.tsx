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
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Users</div>
          <div className="text-base md:text-lg font-bold text-foreground">{totalUsers.toLocaleString()}</div>
        </Card>
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Volume</div>
          <div className="text-base md:text-lg font-bold text-foreground">${formatNumber(totalVolume)}</div>
        </Card>
      </div>
    )
  }

  // Default variant - show all cards
  return (
    <div className="space-y-2 mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Users</div>
          <div className="text-base md:text-lg font-bold text-foreground">{totalUsers.toLocaleString()}</div>
        </Card>
        <Card className="p-2 md:p-3 bg-card/50 border-border">
          <div className="text-xs md:text-sm text-muted-foreground mb-0.5">Total Volume</div>
          <div className="text-base md:text-lg font-bold text-foreground">${formatNumber(totalVolume)}</div>
        </Card>
      </div>

      {/* Spot vs Futures Volume */}
      <Card className="p-2 md:p-3 bg-card/50 border-border">
        <div className="text-xs md:text-sm text-muted-foreground mb-2">Spot vs Futures Volume</div>
        <style>{`
          @keyframes rotate-donut {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .rotating-donut {
            animation: rotate-donut 20s linear infinite;
            transform-origin: center;
          }
        `}</style>
        <div className="w-full h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart className="rotating-donut">
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
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
                filter="url(#glow)"
                onClick={() => { }}
                // @ts-ignore
                activeIndex={0}
                activeShape={(props: any) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                  return (
                    <Sector
                      cx={cx}
                      cy={cy}
                      innerRadius={innerRadius}
                      outerRadius={outerRadius + 15}
                      startAngle={startAngle}
                      endAngle={endAngle}
                      fill={fill}
                      filter="url(#glow)"
                    />
                  );
                }}
              >
                <Cell fill="#fb923c" />
                <Cell fill="#ea580c" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-xs mt-2 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#fb923c' }} />
            <span className="text-muted-foreground">Spot: ${formatNumber(spotVolume)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ea580c' }} />
            <span className="text-muted-foreground">Futures: ${formatNumber(futuresVolume)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
