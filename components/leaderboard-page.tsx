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
    <div className="min-h-screen bg-background flex flex-col space-y-2">
      {/* Leaderboard Type Tabs */}
      <div className="px-4 md:px-8 pt-6">
        <div className="flex gap-2 p-1 bg-card/20 backdrop-blur-xl border border-border/20 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('perps')}
            className={`px-6 py-2.5 text-[10px] font-bold   rounded-xl transition-all ${activeTab === 'perps'
                ? 'bg-orange-500/10 text-orange-400 shadow-sm'
                : 'text-muted-foreground/40 hover:text-foreground'
              }`}
          >
            Futures Rankings
          </button>
          <button
            onClick={() => setActiveTab('spot')}
            className={`px-6 py-2.5 text-[10px] font-bold   rounded-xl transition-all ${activeTab === 'spot'
                ? 'bg-orange-500/10 text-orange-400 shadow-sm'
                : 'text-muted-foreground/40 hover:text-foreground'
              }`}
          >
            Spot Rankings
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

