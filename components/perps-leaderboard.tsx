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
  const { leaderboardCache, isPreloadingLeaderboard } = useSessionCache()
  const [volumeData, setVolumeData] = useState<PerpsEntry[]>([])
  const [pnlData, setPnlData] = useState<PerpsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortBy>('volume')
  const [searchAddress, setSearchAddress] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // Sync with cache and handle preloading
  useEffect(() => {
    if (leaderboardCache?.volumeData && leaderboardCache?.pnlData) {
      setVolumeData(leaderboardCache.volumeData)
      setPnlData(leaderboardCache.pnlData)
      setLoading(false)
    } else if (!isPreloadingLeaderboard) {
      // Only fetch if not already preloading and no cache
      const fetchData = async () => {
        try {
          setLoading(true)
          const [volResponse, pnlResponse] = await Promise.all([
            fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/vol_leaderboard.csv'),
            fetch('https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/refs/heads/main/pnl_leaderboard.csv'),
          ])

          const volText = await volResponse.text()
          const pnlText = await pnlResponse.text()

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
    }
  }, [leaderboardCache, isPreloadingLeaderboard])

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
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin mb-4" />
        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">Indexing global rankings...</p>
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
                <button
                  onClick={() => { setSortBy('pnl'); setCurrentPage(1); setSearchAddress(''); }}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${sortBy === 'pnl' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-secondary/5 border-border/5 text-muted-foreground/40 hover:text-foreground'
                    }`}
                >
                  PnL Performance
                </button>
                <button
                  onClick={() => { setSortBy('volume'); setCurrentPage(1); setSearchAddress(''); }}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border ${sortBy === 'volume' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-secondary/5 border-border/5 text-muted-foreground/40 hover:text-foreground'
                    }`}
                >
                  Volume Intensity
                </button>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Scrutinize address..."
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
      {searchResult && (
        <Card className="p-8 bg-orange-500/[0.03] backdrop-blur-xl border border-orange-500/20 rounded-[2.5rem] shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 text-[8px] font-bold uppercase tracking-widest">Matched Identity</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">Global Profile</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg md:text-2xl font-bold text-foreground tracking-tight break-all">
                  {searchResult.address}
                </p>
                <button
                  onClick={() => copyToClipboard(searchResult.address)}
                  className="p-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-all border border-border/10"
                >
                  {copiedAddress === searchResult.address ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 min-w-[300px]">
              <div className="space-y-1 text-center">
                <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Rank</p>
                <p className="text-2xl font-bold text-orange-400">#{searchResult.rank}</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Volume</p>
                <p className="text-2xl font-bold text-foreground/80">${formatNumber(searchResult.vol)}</p>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">PnL</p>
                <p className={`text-2xl font-bold ${searchResult.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {searchResult.pnl >= 0 ? '+' : ''}${formatNumber(Math.abs(searchResult.pnl))}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Table Section */}
      <Card className="flex-1 overflow-hidden bg-card/10 backdrop-blur-xl border border-border/20 rounded-[2.5rem] shadow-sm flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/40 text-muted-foreground/70 italic">
            {sortBy === 'volume' ? 'Volume Dominance' : 'Profit Efficiency'} Rankings
          </h3>
          <div className="text-[9px] text-muted-foreground/20 italic">DATA_SOURCE: SODEX_MAINNET</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 italic">
                <th className="px-6 py-3 text-left">Descriptor</th>
                <th className="px-6 py-3 text-left">Network Entity</th>
                <th className="px-6 py-3 text-right">Volume</th>
                <th className="px-6 py-3 text-right">PnL Flow</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((entry) => (
                <tr key={`${entry.userId}-${entry.address}`} className="group relative bg-secondary/5 hover:bg-secondary/10 transition-all rounded-2xl">
                  <td className="px-6 py-4 first:rounded-l-2xl last:rounded-r-2xl font-bold text-orange-500/80">#{entry.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className=" text-xs text-foreground/60 dark:text-foreground/60 text-foreground/80">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(entry.address)}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-secondary/10 hover:bg-secondary/20 rounded-lg transition-all border border-border/10"
                      >
                        {copiedAddress === entry.address ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-muted-foreground/30" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-foreground/70 tracking-tight">${formatNumber(entry.vol)}</td>
                  <td className={`px-6 py-4 text-right first:rounded-l-2xl last:rounded-r-2xl font-bold ${entry.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {entry.pnl >= 0 ? '+' : ''}${formatNumber(Math.abs(entry.pnl))}
                  </td>
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
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${rowsPerPage === v ? 'bg-orange-500 text-white shadow-lg' : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary/10'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[9px] text-muted-foreground/20 font-bold uppercase">
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
