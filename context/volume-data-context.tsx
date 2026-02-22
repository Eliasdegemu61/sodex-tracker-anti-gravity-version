'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface Pair {
  pair: string
  volume: number
}

interface VolumeData {
  updated_at: string
  all_time_stats: {
    total_combined_volume: number
    total_spot_volume: number
    total_futures_volume: number
    top_5_spot: Pair[]
    top_5_futures: Pair[]
  }
  today_stats: {
    date: string
    top_5_spot: Pair[]
    top_5_futures: Pair[]
  }
}

interface VolumeDataContextType {
  volumeData: VolumeData | null
  isLoading: boolean
  error: string | null
}

const VolumeDataContext = createContext<VolumeDataContextType | undefined>(undefined)

export function VolumeDataProvider({ children }: { children: ReactNode }) {
  const [volumeData, setVolumeData] = useState<VolumeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/sodex-tracker-new-v1-data-2/main/volume_summary.json'
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const fetchedData: VolumeData = await response.json()
        console.log('[v0] Fetched volume data from context:', fetchedData)
        setVolumeData(fetchedData)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        console.error('[v0] Error fetching volume data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <VolumeDataContext.Provider value={{ volumeData, isLoading, error }}>
      {children}
    </VolumeDataContext.Provider>
  )
}

export function useVolumeData() {
  const context = useContext(VolumeDataContext)
  if (context === undefined) {
    throw new Error('useVolumeData must be used within a VolumeDataProvider')
  }
  return context
}
