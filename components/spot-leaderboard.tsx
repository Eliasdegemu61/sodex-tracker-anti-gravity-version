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
  const { leaderboardCache } = useSessionCache()
  const [data, setData] = useState<SpotLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchAddress, setSearchAddress] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<SpotLeaderboardEntry | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)

        // Use cached data if available, otherwise fetch
        if (leaderboardCache?.spotData && leaderboardCache.spotData.length > 0) {
          console.log('[v0] Using cached spot leaderboard data')
          setData(leaderboardCache.spotData)
          setLoading(false)
          return
        }

        const response = await fetch(
          'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/spot_leaderboard.csv'
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.status}`)
        }

        const csv = await response.text()
        const lines = csv.split('\n').filter((line) => line.trim())

        // Parse CSV data
        const parsed: SpotLeaderboardEntry[] = lines
          .slice(1) // Skip header
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
  }, [])

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



  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Search Controls */}
      <div className="border-b border-border bg-card/50 p-3 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address..."
              value={searchAddress}
              onChange={(e) => {
                setSearchAddress(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 bg-secondary border-border focus:border-accent text-sm"
            />
          </div>

          {/* Search Result Card */}
          {foundResult && (
            <Card className="p-0 bg-gradient-to-r from-accent/10 to-secondary border border-accent/30 overflow-hidden">
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Address Section */}
                  <div className="flex-1 min-w-0">
                    <div className="inline-block px-3 py-1 rounded-full bg-accent/20 border border-accent/40 mb-2">
                      <p className="text-xs font-semibold text-accent">SEARCH RESULT</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Your Address</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm md:text-base font-mono font-bold text-foreground break-all">
                        {foundResult.address}
                      </p>
                      <button
                        onClick={() => handleCopy(foundResult.address)}
                        className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-lg hover:bg-secondary transition-colors"
                        title="Copy address"
                      >
                        {copiedAddress === foundResult.address ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Rank</p>
                      <p className="text-xl md:text-2xl font-bold text-accent">#{foundResult.rank}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Volume</p>
                      <p className="text-xl md:text-2xl font-bold text-foreground">${formatNumber(foundResult.vol)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <AnimatedLoadingTable />
              ) : (
                <>
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Rank</th>
                        <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Address</th>
                        <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length > 0 ? (
                        leaderboard.map((entry) => (
                          <tr
                            key={`${entry.userId}-${entry.rank}`}
                            className="border-b border-border hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-2 md:px-6 py-3 md:py-4 font-bold text-orange-500">#{entry.rank}</td>
                            <td className="px-2 md:px-6 py-3 md:py-4 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <span title={entry.address} className="text-muted-foreground cursor-help">
                                  {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                                </span>
                                <button
                                  onClick={() => handleCopy(entry.address)}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-secondary transition-colors"
                                  title="Copy address"
                                >
                                  {copiedAddress === entry.address ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground">
                              ${formatNumber(entry.vol)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                            No results found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {leaderboard.length > 0 && (
                    <div className="border-t border-border bg-secondary/20 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, allLeaderboard.length)} of{' '}
                        {allLeaderboard.length} entries
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="text-xs text-foreground font-medium px-2">
                          Page {currentPage} of {totalPages}
                        </div>

                        <Button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>

                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="h-8 px-2 text-xs bg-secondary border border-border rounded focus:border-accent focus:outline-none"
                      >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
