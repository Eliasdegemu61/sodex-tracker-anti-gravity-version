// Cache busted: v3
'use client';

import React from "react"

import { Suspense, useState, lazy, useEffect } from 'react'
import { Search, Bell, ChevronDown, Lock, Unlock, MessageCircle, MoreVertical, Moon, Sun } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/app/providers'
import { DashboardStats } from '@/components/dashboard-stats'
import { VolumeChart } from '@/components/volume-chart'
import { FundFlowChart } from '@/components/fund-flow-chart'
import { TopPairsWidget } from '@/components/top-pairs-widget'
import { TodayTopPairs } from '@/components/today-top-pairs'
import { TopTradersCard } from '@/components/top-traders-card'
import { TopSpotTradersCard } from '@/components/top-spot-traders-card'
import { OverallDepositsCard, NetRemainingCard } from '@/components/overall-token-flow'
import { TopGainersCard } from '@/components/top-gainers-card'
import { TopLosersCard } from '@/components/top-losers-card'
import { LeaderboardPage } from '@/components/leaderboard-page'
import { ProfitEfficiencyCard } from '@/components/profit-efficiency-card'
import { OverallProfitEfficiencyCard } from '@/components/overall-profit-efficiency-card'
import { TVLCard } from '@/components/tvl-card'
import { VolumeRangeCard } from '@/components/volume-range-card'
import { AnnouncementsPanel } from '@/components/announcements-panel'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { MobileNavMenu } from '@/components/mobile-nav-menu'
import { NewTradersTracker } from '@/components/new-traders-tracker'
import { AnnouncementSidePanel } from '@/components/announcement-side-panel'
import { PortfolioSection } from '@/components/portfolio-section'
import { OpenPositions } from '@/components/open-positions'
import { TrackerSection } from '@/components/tracker-section'
import { Footer } from '@/components/footer'
import { SopointsAnalyzer } from '@/components/sopoints-analyzer'
import { AboutSodex } from '@/components/about-sodex'
import { WhaleTracker } from '@/components/whale-tracker'
import { useSessionCache } from '@/context/session-cache-context'

function LoadingCard() {
  return <Card className="p-4 md:p-6 bg-card border border-border h-64 animate-pulse" />
}

function DistributionAnalyzerPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'distribution' | 'reverse' | 'sopoints' | 'new-traders'>('distribution')
  const [brackets, setBrackets] = useState([
    { id: '1', volMin: '', volMax: '', pnlMin: '', pnlMax: '' }
  ])
  const [reversePrefix, setReversePrefix] = useState('')
  const [reverseSuffix, setReverseSuffix] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [searchAddressResult, setSearchAddressResult] = useState<any>(null)
  const [distributionResults, setDistributionResults] = useState<any>(null)
  const [reverseResults, setReverseResults] = useState<any[]>([])
  const [isLoadingDistribution, setIsLoadingDistribution] = useState(false)
  const [isLoadingReverse, setIsLoadingReverse] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [allTraders, setAllTraders] = useState<any[]>([])

  const addBracket = () => {
    setBrackets([...brackets, { id: Date.now().toString(), volMin: '', volMax: '', pnlMin: '', pnlMax: '' }])
  }

  const updateBracket = (id: string, field: string, value: string) => {
    setBrackets(brackets.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const removeBracket = (id: string) => {
    if (brackets.length > 1) setBrackets(brackets.filter(b => b.id !== id))
  }

  const handleApply = async () => {
    setIsLoadingDistribution(true)
    try {
      // Fetch pnl_leaderboard.csv directly from GitHub
      const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/pnl_leaderboard.csv')
      if (!response.ok) throw new Error('Failed to fetch data')
      const csvText = await response.text()

      // Parse CSV
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) throw new Error('Empty CSV data')

      const headers = lines[0].split(',').map(h => h.trim())
      const traders: any[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        traders.push({
          userId: obj.userId || obj.user_id || '',
          address: obj.address || '',
          pnl: obj.pnl || '0',
          vol: obj.vol || '0',
        })
      }

      setAllTraders(traders)

      // Calculate stats FOR EACH BRACKET separately
      const bracketStats = brackets.map(bracket => {
        const filtered = traders.filter(trader => {
          const vol = typeof trader.vol === 'string' ? parseFloat(trader.vol) : trader.vol || 0
          const pnl = typeof trader.pnl === 'string' ? parseFloat(trader.pnl) : trader.pnl || 0

          const volMin = bracket.volMin ? parseFloat(bracket.volMin) : -Infinity
          const volMax = bracket.volMax ? parseFloat(bracket.volMax) : Infinity
          const pnlMin = bracket.pnlMin ? parseFloat(bracket.pnlMin) : -Infinity
          const pnlMax = bracket.pnlMax ? parseFloat(bracket.pnlMax) : Infinity

          return vol >= volMin && vol <= volMax && pnl >= pnlMin && pnl <= pnlMax
        })

        const totalVol = filtered.reduce((sum, t) => sum + (typeof t.vol === 'string' ? parseFloat(t.vol) : t.vol || 0), 0)
        const totalPnl = filtered.reduce((sum, t) => sum + (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0), 0)
        const profitCount = filtered.filter(t => (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0) > 0).length
        const lossCount = filtered.filter(t => (typeof t.pnl === 'string' ? parseFloat(t.pnl) : t.pnl || 0) < 0).length

        // Donut chart data
        const donutData = [
          { name: 'Profitable', value: profitCount, color: '#22c55e' },
          { name: 'Loss', value: lossCount, color: '#ef4444' }
        ]

        return {
          bracketId: bracket.id,
          count: filtered.length,
          totalVolume: totalVol,
          totalPnl: totalPnl,
          profitCount,
          lossCount,
          donutData,
          traders: filtered
        }
      })

      setDistributionResults(bracketStats)
    } catch (error) {
      console.error('[v0] Error filtering data:', error)
      setDistributionResults(null)
    } finally {
      setIsLoadingDistribution(false)
    }
  }

  const handleSearchAddress = async (bracketId?: string) => {
    if (!searchAddress.trim()) return
    setIsSearchingAddress(true)
    try {
      if (allTraders.length === 0) {
        // Fetch pnl_leaderboard.csv from GitHub
        const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/pnl_leaderboard.csv')
        if (!response.ok) throw new Error('Failed to fetch data')
        const csvText = await response.text()

        // Parse CSV
        const lines = csvText.trim().split('\n')
        if (lines.length < 2) throw new Error('Empty CSV data')

        const headers = lines[0].split(',').map(h => h.trim())
        const traders: any[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          traders.push({
            userId: obj.userId || obj.user_id || '',
            address: obj.address || '',
            pnl: obj.pnl || '0',
            vol: obj.vol || '0',
          })
        }

        setAllTraders(traders)
      }

      const found = allTraders.find(t => (t.address || '').toLowerCase() === searchAddress.toLowerCase())
      if (found) {
        const vol = typeof found.vol === 'string' ? parseFloat(found.vol) : found.vol || 0
        const pnl = typeof found.pnl === 'string' ? parseFloat(found.pnl) : found.pnl || 0

        // Check if address fits in THIS bracket only
        let bracketMatch = null
        if (bracketId && distributionResults) {
          const bracket = brackets.find(b => b.id === bracketId)
          if (bracket) {
            const volMin = bracket.volMin ? parseFloat(bracket.volMin) : -Infinity
            const volMax = bracket.volMax ? parseFloat(bracket.volMax) : Infinity
            const pnlMin = bracket.pnlMin ? parseFloat(bracket.pnlMin) : -Infinity
            const pnlMax = bracket.pnlMax ? parseFloat(bracket.pnlMax) : Infinity
            bracketMatch = vol >= volMin && vol <= volMax && pnl >= pnlMin && pnl <= pnlMax
          }
        }

        setSearchAddressResult({ ...found, vol, pnl, matchesBracket: bracketMatch })
      } else {
        setSearchAddressResult({ notFound: true })
      }
    } catch (error) {
      console.error('[v0] Error searching address:', error)
      setSearchAddressResult(null)
    } finally {
      setIsSearchingAddress(false)
    }
  }

  const handleReverseSearch = async () => {
    if (!reversePrefix || !reverseSuffix) return
    setIsLoadingReverse(true)
    try {
      // Fetch registry.json from GitHub to get address -> userId mapping
      const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/refs/heads/main/registry.json')
      if (!response.ok) throw new Error('Failed to fetch registry')
      const registry: any[] = await response.json()

      const prefix = reversePrefix.toLowerCase()
      const suffix = reverseSuffix.toLowerCase()

      // Filter addresses matching the prefix and suffix pattern
      const matched = registry.filter(entry => {
        const addr = (entry.address || '').toLowerCase()
        return addr.length >= 8 && addr.startsWith(prefix) && addr.endsWith(suffix)
      })

      setReverseResults(matched)
    } catch (error) {
      console.error('[v0] Error searching addresses:', error)
      setReverseResults([])
    } finally {
      setIsLoadingReverse(false)
    }
  }

  return (
    <div>
      <div className="border-b border-border bg-card/30 sticky top-0 z-40">
        <div className="px-3 md:px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'distribution'
              ? 'text-accent border-accent'
              : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
          >
            Distribution Analyzer
          </button>
          <button
            onClick={() => setActiveTab('reverse')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'reverse'
              ? 'text-accent border-accent'
              : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
          >
            Reverse Search address
          </button>
          <button
            onClick={() => setActiveTab('sopoints')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'sopoints'
              ? 'text-accent border-accent'
              : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
          >
            Sopoints
          </button>
          <button
            onClick={() => setActiveTab('new-traders')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'new-traders'
              ? 'text-accent border-accent'
              : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
          >
            Active Traders
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {activeTab === 'distribution' && (
          <>
            <Card className="p-4 bg-card border border-border">
              <h2 className="text-sm md:text-lg font-bold mb-4">Distribution Analyzer</h2>
              <div className="space-y-3">
                {brackets.map((bracket, idx) => (
                  <div key={bracket.id} className="p-3 bg-secondary/30 rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold">Bracket {idx + 1}</span>
                      {brackets.length > 1 && (
                        <button
                          onClick={() => removeBracket(bracket.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vol Min</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={bracket.volMin}
                          onChange={(e) => updateBracket(bracket.id, 'volMin', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Vol Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={bracket.volMax}
                          onChange={(e) => updateBracket(bracket.id, 'volMax', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PnL Min</label>
                        <Input
                          type="number"
                          placeholder="-∞"
                          value={bracket.pnlMin}
                          onChange={(e) => updateBracket(bracket.id, 'pnlMin', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">PnL Max</label>
                        <Input
                          type="number"
                          placeholder="∞"
                          value={bracket.pnlMax}
                          onChange={(e) => updateBracket(bracket.id, 'pnlMax', e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <Button onClick={addBracket} variant="outline" className="text-xs h-8 bg-transparent flex-1 md:flex-none">
                    + Add Bracket
                  </Button>
                  <Button onClick={handleApply} disabled={isLoadingDistribution} className="text-xs h-8 flex-1 md:flex-none">
                    {isLoadingDistribution ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
              </div>
            </Card>

            {distributionResults && Array.isArray(distributionResults) && (
              <div className="space-y-4">
                {distributionResults.map((bracketResult, idx) => (
                  <Card key={bracketResult.bracketId} className="p-4 bg-card border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Stats */}
                      <div>
                        <h3 className="text-xs md:text-sm font-bold mb-3">Bracket {idx + 1}</h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Traders</span>
                            <span className="font-bold">{bracketResult.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Volume</span>
                            <span className="font-bold text-accent">${(bracketResult.totalVolume / 1e6).toFixed(1)}M</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total PnL</span>
                            <span className={`font-bold ${bracketResult.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${(bracketResult.totalPnl / 1e6).toFixed(1)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profitable</span>
                            <span className="font-bold text-green-400">{bracketResult.profitCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Loss</span>
                            <span className="font-bold text-red-400">{bracketResult.lossCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Donut Chart */}
                      <div className="flex justify-center items-center">
                        <style>{`
                          .donut-segment {
                            filter: drop-shadow(0 0 4px currentColor);
                          }
                          .recharts-tooltip-wrapper {
                            outline: none !important;
                          }
                          .recharts-default-tooltip {
                            background-color: #1a1a1a !important;
                            border: 1px solid #333 !important;
                            border-radius: 4px !important;
                          }
                          .recharts-tooltip-label {
                            color: #ffffff !important;
                          }
                          .recharts-tooltip-item {
                            color: #ffffff !important;
                          }
                        `}</style>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={bracketResult.donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {bracketResult.donutData.map((entry: any, index: number) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  className="donut-segment"
                                  style={{
                                    filter: `drop-shadow(0 0 4px ${entry.color})`,
                                  }}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                color: '#ffffff'
                              }}
                              labelStyle={{ color: '#ffffff' }}
                              formatter={(value: any, name: any) => [`${value} traders`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Right: Search Box */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Search Address</p>
                        <Input
                          placeholder="Enter wallet address"
                          value={searchAddress}
                          onChange={(e) => setSearchAddress(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress(bracketResult.bracketId)}
                        />
                        <Button
                          onClick={() => handleSearchAddress(bracketResult.bracketId)}
                          disabled={isSearchingAddress}
                          size="sm"
                          className="w-full h-8 text-xs"
                        >
                          {isSearchingAddress ? 'Checking...' : 'Check'}
                        </Button>
                        {searchAddressResult && (
                          <div className="text-xs p-2 bg-secondary/30 rounded border border-border">
                            {searchAddressResult.notFound ? (
                              <p className="text-red-400">Not found</p>
                            ) : (
                              <div className="space-y-1">
                                <p className=" text-xs truncate">{searchAddressResult.address}</p>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Vol:</span>
                                  <span className="font-bold">${searchAddressResult.vol.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">PnL:</span>
                                  <span className={`font-bold ${searchAddressResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${searchAddressResult.pnl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Fits:</span>
                                  <span className={`font-bold ${searchAddressResult.matchesBracket ? 'text-green-400' : 'text-red-400'}`}>
                                    {searchAddressResult.matchesBracket ? '✓' : '✗'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reverse' && (
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-sm md:text-xl font-bold mb-6">Reverse Search</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">First 4 Characters</label>
                  <Input
                    placeholder="e.g., 0x1a"
                    maxLength={4}
                    value={reversePrefix}
                    onChange={(e) => setReversePrefix(e.target.value.toUpperCase())}
                    className=""
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Last 4 Characters</label>
                  <Input
                    placeholder="e.g., a2f4"
                    maxLength={4}
                    value={reverseSuffix}
                    onChange={(e) => setReverseSuffix(e.target.value.toUpperCase())}
                    className=""
                  />
                </div>
              </div>
              <Button onClick={handleReverseSearch} disabled={isLoadingReverse} className="w-full md:w-auto">
                {isLoadingReverse ? 'Searching...' : 'Search'}
              </Button>

              {reverseResults.length > 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-sm text-muted-foreground">Found {reverseResults.length} matching addresses</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-3 py-2 font-semibold">Address</th>
                          <th className="px-3 py-2 font-semibold">Volume</th>
                          <th className="px-3 py-2 font-semibold">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reverseResults.map((trader, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                            <td className="px-3 py-2 text-xs">{trader.address || 'N/A'}</td>
                            <td className="px-3 py-2">${typeof trader.vol === 'string' ? parseFloat(trader.vol).toFixed(0) : trader.vol || 0}</td>
                            <td className={`px-3 py-2 ${(trader.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${typeof trader.pnl === 'string' ? parseFloat(trader.pnl).toFixed(0) : trader.pnl || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'new-traders' && (
          <NewTradersTracker />
        )}

        {activeTab === 'sopoints' && (
          <SopointsAnalyzer />
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { theme, toggleTheme, mounted } = useTheme()
  const { preloadLeaderboardData } = useSessionCache()
  const [currentPage, setCurrentPage] = useState<'dex-status' | 'tracker' | 'portfolio' | 'leaderboard' | 'analyzer' | 'about' | 'whale-tracker'>('dex-status')
  const [searchAddressInput, setSearchAddressInput] = useState('')
  const [trackerSearchAddress, setTrackerSearchAddress] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Preload leaderboard data on mount
  useEffect(() => {
    console.log('[v0] Dashboard mounted, preloading leaderboard data')
    preloadLeaderboardData()
  }, [preloadLeaderboardData])

  // Handle tab parameter from URL - lazy load only when user navigates
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab') as 'dex-status' | 'tracker' | 'portfolio' | 'leaderboard' | 'analyzer' | null;
    const addressParam = searchParams.get('address');

    // Set tracker search address if provided
    if (addressParam) {
      setTrackerSearchAddress(decodeURIComponent(addressParam));
    }

    if (tabParam && ['dex-status', 'tracker', 'portfolio', 'leaderboard', 'analyzer', 'about', 'whale-tracker'].includes(tabParam as any)) {
      setCurrentPage(tabParam as any);
    } else {
      // Default to leaderboard on first load (faster load than dex-status)
      setCurrentPage('leaderboard');
    }
  }, []);

  const handleSearchBarSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchAddressInput.trim()) {
      setTrackerSearchAddress(searchAddressInput)
      setCurrentPage('tracker')
      setSearchAddressInput('')
    }
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border/10 bg-background/20 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between h-20 px-6 gap-8">
          <div className="flex items-center gap-4 flex-shrink-0 cursor-pointer" onClick={() => setCurrentPage('leaderboard')}>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img
                src={theme === 'dark' ? 'https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75' : 'https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg'}
                alt="Sodex Logo"
                className="relative h-8 w-auto object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-orange-500 leading-none">Intelligence</span>
              <span className="text-xs font-bold text-foreground/80 tracking-tight">TERMINAL</span>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden lg:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-orange-400 transition-colors" />
              </div>
              <Input
                placeholder="Scan Network Address..."
                className="h-10 pl-11 pr-4 bg-secondary/5 border-border/10 focus:border-orange-500/30 focus:ring-0 rounded-2xl text-sm tracking-tight transition-all placeholder:text-muted-foreground/20"
                value={searchAddressInput}
                onChange={(e) => setSearchAddressInput(e.target.value)}
                onKeyDown={handleSearchBarSubmit}
              />
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-2">
            {[
              { id: 'dex-status', label: 'Network' },
              { id: 'tracker', label: 'Monitor' },
              { id: 'portfolio', label: 'Assets' },
              { id: 'leaderboard', label: 'Rankings' },
              { id: 'analyzer', label: 'Forensics' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${currentPage === item.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/10'
                  }`}
              >
                {item.label}
              </button>
            ))}

            <div
              className="relative"
              onMouseEnter={() => setShowMoreMenu(true)}
              onMouseLeave={() => setShowMoreMenu(false)}
            >
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${currentPage === 'about' || currentPage === 'whale-tracker'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/10'
                  }`}
              >
                Access
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMoreMenu && (
                <div className="absolute top-full right-0 pt-2 w-56 z-50">
                  <div className="bg-card/90 backdrop-blur-2xl border border-border/20 rounded-[2rem] shadow-2xl p-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <button
                      onClick={() => { setCurrentPage('whale-tracker'); setShowMoreMenu(false); }}
                      className={`w-full text-left px-5 py-3 rounded-2xl text-xs font-medium transition-all ${currentPage === 'whale-tracker' ? 'bg-orange-500 text-white' : 'text-muted-foreground/60 hover:bg-secondary/20 hover:text-foreground'}`}
                    >
                      Whale Signals
                    </button>
                    <button
                      onClick={() => { setCurrentPage('about'); setShowMoreMenu(false); }}
                      className={`w-full text-left px-5 py-3 rounded-2xl text-xs font-medium transition-all ${currentPage === 'about' ? 'bg-orange-500 text-white' : 'text-muted-foreground/60 hover:bg-secondary/20 hover:text-foreground'}`}
                    >
                      System Protocol
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-2xl bg-secondary/5 border border-border/5 text-muted-foreground/60 hover:text-orange-400 hover:bg-orange-400/5 transition-all"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
            )}

            <div className="h-6 w-[1px] bg-border/10 hidden md:block mx-1" />

            <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer" className="hidden md:block">
              <Button className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] italic shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                Execute Trade
              </Button>
            </a>

            <MobileNavMenu currentPage={currentPage} onNavigate={(page: any) => setCurrentPage(page)} />
          </div>
        </div>
      </header>

      {/* Main Content - Only render active tab */}
      {currentPage === 'dex-status' && (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><div className="text-muted-foreground animate-pulse text-[10px] tracking-widest uppercase">Initializing Neural Link...</div></div>}>
          <div className="flex flex-col lg:flex-row w-full max-w-[1800px] mx-auto min-h-[calc(100vh-5rem)]">
            {/* Left Sidebar */}
            <div className="w-full lg:w-[320px] xl:w-[380px] lg:border-r border-border/10 p-6 space-y-6 lg:flex-shrink-0 order-2 lg:order-1 bg-secondary/5 lg:bg-transparent">
              <div className="space-y-6">
                <DashboardStats />
                <TVLCard />
                <TodayTopPairs />
                <div className="pt-2">
                  <TopTradersCard />
                </div>
                <OverallDepositsCard />
              </div>
            </div>

            {/* Center Content */}
            <div className="flex-1 lg:border-r border-border/10 p-6 space-y-6 order-1 lg:order-2">
              <VolumeChart />
              <FundFlowChart />
              <VolumeRangeCard />
              <TopPairsWidget />
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[320px] xl:w-[380px] p-6 space-y-6 lg:flex-shrink-0 order-3 bg-secondary/5 lg:bg-transparent">
              <AnnouncementsPanel />
              <TopGainersCard />
              <TopLosersCard />

              <div className="relative group overflow-hidden rounded-[2.5rem] border border-border/20 shadow-2xl transition-all duration-500 hover:border-orange-500/30">
                <img
                  src="https://sodex.com/_next/image?url=%2Fimg%2Fhome%2Fcontent1-inner.webp&w=1920&q=75"
                  alt="Trade"
                  className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 italic mb-2">Network Access</h4>
                    <p className="text-xs font-bold text-white leading-relaxed">Execute high-frequency trades on the most liquid DEX protocol.</p>
                  </div>
                  <a href="https://sodex.com/join/TRADING" target="_blank" rel="noopener noreferrer">
                    <button className="w-full py-3 bg-white/10 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-md border border-white/10 hover:border-orange-400">
                      Open Terminal
                    </button>
                  </a>
                </div>
              </div>

              <TopSpotTradersCard />
              <NetRemainingCard />
            </div>
          </div>
        </Suspense>
      )}

      {currentPage === 'tracker' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full">
            <TrackerSection initialSearchAddress={trackerSearchAddress} />
          </div>
        </Suspense>
      )}

      {currentPage === 'portfolio' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full space-y-6">
            <PortfolioSection />
            <OpenPositions />
          </div>
        </Suspense>
      )}

      {currentPage === 'leaderboard' && (
        <Suspense fallback={<LoadingCard />}>
          <LeaderboardPage onBack={() => setCurrentPage('dex-status')} />
        </Suspense>
      )}

      {currentPage === 'analyzer' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6">
            <DistributionAnalyzerPage onBack={() => setCurrentPage('dex-status')} />
          </div>
        </Suspense>
      )}

      {currentPage === 'about' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full">
            <AboutSodex />
          </div>
        </Suspense>
      )}

      {currentPage === 'whale-tracker' && (
        <Suspense fallback={<LoadingCard />}>
          <div className="p-4 md:p-6 overflow-y-auto w-full">
            <WhaleTracker />
          </div>
        </Suspense>
      )}

      {/* Announcement Side Panel */}
      <AnnouncementSidePanel />

      {/* Footer */}
      <Footer />
    </div>
  )
}
