'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useSessionCache } from '@/context/session-cache-context'

interface PerpsEntry {
  rank: number
  userId: string
  address: string
  vol: number
  pnl: number
}

type SortBy = 'volume' | 'pnl'

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toFixed(2)
}

const parseCSV = (csvText: string): PerpsEntry[] => {
  const lines = csvText.trim().split('\n')
  const entries: PerpsEntry[] = []

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.split(',')
    if (parts.length >= 5) {
      try {
        entries.push({
          rank: parseInt(parts[0]),
          userId: parts[1],
          address: parts[2].trim(),
          vol: parseFloat(parts[3]),
          pnl: parseFloat(parts[4]),
        })
      } catch (e) {
        console.error('Error parsing CSV line:', line)
      }
    }
  }

  return entries
}

export function PerpsLeaderboard() {
  const { leaderboardCache } = useSessionCache()
  const [volumeData, setVolumeData] = useState<PerpsEntry[]>([])
  const [pnlData, setPnlData] = useState<PerpsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('volume')
  const [searchAddress, setSearchAddress] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // Fetch CSV data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Use cached data if available
        if (leaderboardCache?.volumeData && leaderboardCache?.pnlData &&
          leaderboardCache.volumeData.length > 0 && leaderboardCache.pnlData.length > 0) {
          console.log('[v0] Using cached perps leaderboard data')
          setVolumeData(leaderboardCache.volumeData)
          setPnlData(leaderboardCache.pnlData)
          setLoading(false)
          return
        }

        // Fetch both CSV files
        const [volResponse, pnlResponse] = await Promise.all([
          fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/vol_leaderboard.csv'),
          fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/pnl_leaderboard.csv'),
        ])

        const volText = await volResponse.text()
        const pnlText = await pnlResponse.text()

        // Parse CSV data
        const volEntries = parseCSV(volText)
        const pnlEntries = parseCSV(pnlText)

        setVolumeData(volEntries)
        setPnlData(pnlEntries)
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get current data based on sort selection
  const currentData = sortBy === 'volume' ? volumeData : pnlData

  // Filter and paginate
  const filteredData = currentData.filter((entry) =>
    entry.address.toLowerCase().includes(searchAddress.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const displayData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  // Find search result
  const searchResult = searchAddress.trim()
    ? currentData.find((entry) =>
      entry.address.toLowerCase() === searchAddress.toLowerCase()
    )
    : null

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Controls Section */}
      <div className="border-b border-border bg-card/50 p-3 md:p-6">
        <div className="max-w-6xl mx-auto space-y-3 md:space-y-4">
          {/* Sort By Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                setSortBy('pnl')
                setCurrentPage(1)
                setSearchAddress('')
              }}
              variant={sortBy === 'pnl' ? 'default' : 'outline'}
              className={sortBy === 'pnl' ? 'bg-accent text-background hover:bg-accent/90' : ''}
              size="sm"
            >
              Sort by PnL
            </Button>
            <Button
              onClick={() => {
                setSortBy('volume')
                setCurrentPage(1)
                setSearchAddress('')
              }}
              variant={sortBy === 'volume' ? 'default' : 'outline'}
              className={sortBy === 'volume' ? 'bg-accent text-background hover:bg-accent/90' : ''}
              size="sm"
            >
              Sort by Volume
            </Button>
          </div>

          {/* Search Address */}
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
          {searchResult && (
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
                        {searchResult.address}
                      </p>
                      <button
                        onClick={() => copyToClipboard(searchResult.address)}
                        className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-lg hover:bg-secondary transition-colors"
                        title="Copy address"
                      >
                        {copiedAddress === searchResult.address ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        {sortBy === 'pnl' ? 'PnL Rank' : 'Volume Rank'}
                      </p>
                      <p className="text-xl md:text-2xl font-bold text-accent">
                        {searchResult ? `#${searchResult.rank}` : 'N/A'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Volume</p>
                      <p className="text-xl md:text-2xl font-bold text-foreground">
                        ${formatNumber(searchResult.vol)}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border border-border hover:border-accent/50 transition-colors">
                      <p className="text-xs text-muted-foreground font-medium mb-1">PnL</p>
                      <p className={`text-xl md:text-2xl font-bold ${searchResult.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {searchResult.pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(searchResult.pnl))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="overflow-x-auto bg-card border border-border rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Rank</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 text-left font-semibold text-foreground">Address</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground text-xs">Volume</th>
                  <th className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-foreground text-xs">PnL</th>
                </tr>
              </thead>
              <tbody>
                {displayData.length > 0 ? (
                  displayData.map((entry) => (
                    <tr
                      key={`${entry.userId}-${entry.address}`}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-2 md:px-6 py-3 md:py-4 font-bold text-orange-500">#{entry.rank}</td>
                      <td className="px-2 md:px-6 py-3 md:py-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span title={entry.address} className="text-muted-foreground cursor-help">
                            {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(entry.address)}
                            className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded hover:bg-secondary transition-colors"
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
                      <td className="px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-orange-500 text-xs">
                        ${formatNumber(entry.vol)}
                      </td>
                      <td className={`px-2 md:px-6 py-3 md:py-4 text-right font-semibold text-xs ${entry.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.pnl >= 0 ? '+' : '-'}${formatNumber(Math.abs(entry.pnl))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {searchAddress ? 'No address found in leaderboard' : 'No leaderboard data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-3 py-1 bg-secondary border border-border rounded text-sm focus:border-accent outline-none transition-colors"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1} ({filteredData.length} total)
              </span>
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="w-9 h-9 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="w-9 h-9 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
