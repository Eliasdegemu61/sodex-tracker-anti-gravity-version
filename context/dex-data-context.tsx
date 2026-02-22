'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OverallStatsData {
  summary: {
    total_users: number
    active_users: number
    profitable_percent: number
    loss_percent: number
  }
  chart_data: Array<{
    range: string
    avg_pnl: number
  }>
  top_5_gainers: Array<{
    userId: string
    address: string
    pnl: number
    vol: number
    rank: number
  }>
  top_5_losers: Array<{
    userId: string
    address: string
    pnl: number
    vol: number
    rank: number
  }>
}

interface DexDataContextType {
  overallStats: OverallStatsData | null
  isLoading: boolean
  error: string | null
}

const DexDataContext = createContext<DexDataContextType | undefined>(undefined)

export function DexDataProvider({ children }: { children: ReactNode }) {
  const [overallStats, setOverallStats] = useState<OverallStatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/overall_stats.json'
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('[v0] Fetched overall_stats.json once for all DEX data')
        setOverallStats(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('[v0] Error fetching overall stats:', errorMessage)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <DexDataContext.Provider value={{ overallStats, isLoading, error }}>
      {children}
    </DexDataContext.Provider>
  )
}

export function useDexData() {
  const context = useContext(DexDataContext)
  if (context === undefined) {
    throw new Error('useDexData must be used within DexDataProvider')
  }
  return context
}
