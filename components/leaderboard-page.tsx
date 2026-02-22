'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SpotLeaderboard } from '@/components/spot-leaderboard'
import { PerpsLeaderboard } from '@/components/perps-leaderboard'

type LeaderboardType = 'perps' | 'spot'

export function LeaderboardPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('perps')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Leaderboard Type Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-3 md:px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('perps')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'perps'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Perps Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'spot'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Spot Leaderboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'perps' ? <PerpsLeaderboard /> : <SpotLeaderboard />}
      </div>
    </div>
  )
}
