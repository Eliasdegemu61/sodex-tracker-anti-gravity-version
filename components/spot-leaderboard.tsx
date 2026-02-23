'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useSessionCache } from '@/context/session-cache-context'

interface SpotLeaderboardEntry {
  rank: number
  userId: string
  address: string
  vol: number
}

// Animated loading table component
function AnimatedLoadingTable() {
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-center gap-2 py-6 px-3 md:px-6 bg-secondary/20 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-accent rounded-full transition-all duration-500"
              style={{
                opacity: animate ? 1 : 0.3,
                transform: animate ? 'scale(1.2)' : 'scale(1)',
              }}
            />
            <div
              className="w-2 h-2 bg-accent rounded-full transition-all duration-500"
              style={{
                opacity: animate ? 0.6 : 1,
                transform: animate ? 'scale(1)' : 'scale(1.2)',
              }}
            />
            <div
              className="w-2 h-2 bg-accent rounded-full transition-all duration-500"
              style={{
                opacity: animate ? 0.3 : 0.6,
                transform: animate ? 'scale(1)' : 'scale(0.8)',
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">Loading leaderboard data...</p>
        </div>
      </div>
      <table className="w-full text-xs md:text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Rank</th>
            <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Address</th>
            <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">Volume</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
            <tr
              key={idx}
              className="border-b border-border transition-all duration-500"
              style={{
                opacity: animate ? 1 : 0.5,
              }}
            >
              <td className="px-2 md:px-6 py-3 md:py-4">
                <div
                  className="font-bold text-accent transition-all duration-500"
                  style={{
                    transform: animate ? `scale(1.1)` : `scale(1)`,
                  }}
                >
                  #{idx}
                </div>
              </td>
              <td className="px-2 md:px-6 py-3 md:py-4">
                <div className="h-4 bg-secondary/30 rounded w-32 animate-pulse" />
              </td>
              <td className="px-2 md:px-6 py-3 md:py-4 text-right">
                <div className="h-4 bg-secondary/30 rounded w-20 ml-auto animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SpotLeaderboard() {
  const { leaderboardCache, isPreloadingLeaderboard } = useSessionCache()
  const [data, setData] = useState<SpotLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchAddress, setSearchAddress] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<SpotLeaderboardEntry | null>(null)

  useEffect(() => {
    if (leaderboardCache?.spotData) {
      setData(leaderboardCache.spotData)
      setLoading(false)
    } else if (!isPreloadingLeaderboard) {
      const fetchLeaderboard = async () => {
        try {
          setLoading(true)
          const response = await fetch(
            'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/spot_leaderboard.csv'
          )

          if (!response.ok) {
            throw new Error(`Failed to fetch leaderboard: ${response.status}`)
          }

          const csv = await response.text()
          const lines = csv.split('\n').filter((line) => line.trim())

          const parsed: SpotLeaderboardEntry[] = lines
            .slice(1)
            .map((line) => {
              const parts = line.split(',')
              return {
                rank: parseInt(parts[0]),
                userId: parts[1],
                address: parts[2].trim(),
                vol: parseFloat(parts[3]),
              }
            })
            .filter((entry) => entry.address && !isNaN(entry.vol))
            .sort((a, b) => a.rank - b.rank)

          setData(parsed)
        } catch (error) {
          console.error('[v0] Error fetching leaderboard:', error)
          setData([])
        } finally {
          setLoading(false)
        }
      }
      fetchLeaderboard()
    }
  }, [leaderboardCache, isPreloadingLeaderboard])

  const formatNumber = (num: number) => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
    return num.toFixed(2)
  }

  const getAllLeaderboard = () => {
    let filtered = data
    if (searchAddress.trim()) {
      filtered = data.filter((entry) =>
        entry.address.toLowerCase().includes(searchAddress.toLowerCase())
      )
    }
    return filtered
  }

  const allLeaderboard = getAllLeaderboard()
  const totalPages = Math.ceil(allLeaderboard.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const leaderboard = allLeaderboard.slice(startIndex, startIndex + rowsPerPage)

  // Find search result
  const foundResult = searchAddress.trim()
    ? data.find((entry) => entry.address.toLowerCase() === searchAddress.toLowerCase())
    : null

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin mb-4" />
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">Scanning market participants...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col space-y-6 p-4 md:p-8">
      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-12 p-6 bg-card/20 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/40 text-muted-foreground/70 italic">Leaderboard Logic</h3>
              <div className="flex gap-2">
                <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  Spot Volume
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Identify address..."
                  value={searchAddress}
                  onChange={(e) => { setSearchAddress(e.target.value); setCurrentPage(1); }}
                  className="h-11 pl-10 bg-background/20 border-border/10 rounded-xl text-sm placeholder:text-muted-foreground/30 focus:border-orange-500/20 focus:ring-0"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Result Card */}
      {foundResult && (
        <Card className="p-8 bg-orange-500/[0.03] backdrop-blur-xl border border-orange-500/20 rounded-[2.5rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[8px] font-mono font-bold uppercase tracking-widest">Matched Identity</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">Spot Profile</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg md:text-2xl font-mono font-bold text-foreground tracking-tight break-all">
                  {foundResult.address}
                </p>
                <button
                  onClick={() => handleCopy(foundResult.address)}
                  className="p-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-all border border-border/10"
                >
                  {copiedAddress === foundResult.address ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 min-w-[200px]">
              <div className="space-y-1 text-center">
                <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Rank</p>
                <p className="text-2xl font-bold font-mono text-orange-400">#{foundResult.rank}</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Volume</p>
                <p className="text-2xl font-bold font-mono text-foreground/80">${formatNumber(foundResult.vol)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Table Section */}
      <Card className="flex-1 overflow-hidden bg-card/10 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/40 text-muted-foreground/70 italic">
            Spot Volume Dominance
          </h3>
          <div className="text-[9px] text-muted-foreground/20 font-mono italic">DATA_SOURCE: SODEX_SPOT</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 italic">
                <th className="px-6 py-3 text-left">Rank</th>
                <th className="px-6 py-3 text-left">Network Entity</th>
                <th className="px-6 py-3 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={`${entry.userId}-${entry.rank}`} className="group relative bg-secondary/5 hover:bg-secondary/10 transition-all rounded-2xl">
                  <td className="px-6 py-4 first:rounded-l-2xl last:rounded-r-2xl font-bold font-mono text-orange-500/80">#{entry.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-foreground/60 dark:text-foreground/60 text-foreground/80">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </span>
                      <button
                        onClick={() => handleCopy(entry.address)}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-secondary/10 hover:bg-secondary/20 rounded-lg transition-all border border-border/10"
                      >
                        {copiedAddress === entry.address ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground/30" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right first:rounded-l-2xl last:rounded-r-2xl font-bold font-mono text-foreground/70 tracking-tight">${formatNumber(entry.vol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-auto pt-10 gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Stride</span>
            <div className="flex gap-1.5 p-1 bg-secondary/5 rounded-xl border border-border/10">
              {[10, 20, 50, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => { setRowsPerPage(v); setCurrentPage(1); }}
                  className={`px-3 py-1 text-[10px] font-bold font-mono rounded-lg transition-all ${rowsPerPage === v ? 'bg-orange-500 text-white shadow-lg' : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary/10'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[9px] text-muted-foreground/20 font-mono font-bold uppercase">
              Sector {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="h-9 w-9 p-0 bg-secondary/5 border-border/10 rounded-xl hover:bg-orange-500/10 hover:text-orange-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="h-9 w-9 p-0 bg-secondary/5 border-border/10 rounded-xl hover:bg-orange-500/10 hover:text-orange-400 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
