'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'

export function TVLCard() {
  const [tvl, setTvl] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTVL() {
      try {
        const response = await fetch('/api/sodex/tvl', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data.tvl !== undefined) {
          setTvl(data.tvl)
        } else {
          throw new Error('Invalid TVL data')
        }
      } catch (err) {
        console.error('[v0] Error fetching TVL data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch TVL')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTVL()
  }, [])

  if (isLoading) {
    return (
      <Card className="p-3 bg-card/50 border-border">
        <div className="h-12 bg-muted/30 rounded animate-pulse" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-3 md:p-4 bg-card/50 border-border">
        <p className="text-xs text-muted-foreground mb-2">Total Value Locked</p>
        <p className="text-xs text-red-500">Error loading TVL</p>
      </Card>
    )
  }

  return (
    <Card className="p-3 md:p-4 bg-card/50 border-border">
      <p className="text-xs text-muted-foreground mb-2">Total Value Locked</p>
      <div className="flex items-baseline gap-2">
        <div className="text-lg md:text-xl font-bold text-foreground">
          {formatNumber(tvl)}
        </div>
        <div className="text-xs text-muted-foreground font-semibold">
          MAG7.SSI
        </div>
      </div>
    </Card>
  )
}
