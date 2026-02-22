import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCache, setCacheWithTTL, CACHE_KEYS, setCacheRefreshTime } from '@/lib/redis-service'

const GITHUB_PERPS_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/pnl_leaderboard.csv'
const GITHUB_SPOT_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/spot_leaderboard.csv'
const GITHUB_VOL_URL = 'https://raw.githubusercontent.com/Eliasdegemu61/sodex-finalised-raw-data/main/vol_leaderboard.csv'

interface TraderData {
  userId: string
  address: string
  pnl: string
  vol: string
}

interface TradeDataEntry {
  userId: string
  address: string
  pnl: string
  vol: string
}

interface LeaderboardResponse {
  perpsLeaderboard: TradeDataEntry[]
  spotLeaderboard: Array<{ userId: string; address: string; vol: string }>
  fromCache: boolean
}

/**
 * Parse CSV data into an array of objects
 */
function parseCSV(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const data: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    data.push(obj)
  }

  return data
}

/**
 * Fetch and calculate leaderboard data from CSV files
 */
async function fetchAndCalculateLeaderboard(): Promise<LeaderboardResponse> {
  console.log('[v0] Fetching fresh leaderboard data from GitHub CSVs')

  try {
    // Fetch all leaderboard CSVs in parallel
    const [perpsResponse, spotResponse, volResponse] = await Promise.all([
      fetch(GITHUB_PERPS_URL, { cache: 'no-store' }),
      fetch(GITHUB_SPOT_URL, { cache: 'no-store' }),
      fetch(GITHUB_VOL_URL, { cache: 'no-store' }),
    ])

    if (!perpsResponse.ok) throw new Error(`Failed to fetch perps leaderboard: ${perpsResponse.status}`)
    if (!spotResponse.ok) throw new Error(`Failed to fetch spot leaderboard: ${spotResponse.status}`)
    if (!volResponse.ok) throw new Error(`Failed to fetch volume leaderboard: ${volResponse.status}`)

    const [perpsCsv, spotCsv, volCsv] = await Promise.all([
      perpsResponse.text(),
      spotResponse.text(),
      volResponse.text(),
    ])

    // Parse CSV data
    const perpsData = parseCSV(perpsCsv)
    const spotData = parseCSV(spotCsv)
    const volData = parseCSV(volCsv)

    // Format perps leaderboard
    const perpsLeaderboard: TradeDataEntry[] = perpsData.map((row) => ({
      userId: row.userId || row.user_id || '',
      address: row.address || '',
      pnl: row.pnl || '0',
      vol: row.vol || row.volume || '0',
    }))

    // Format spot leaderboard
    const spotLeaderboard: Array<{ userId: string; address: string; vol: string }> = spotData.map((row) => ({
      userId: row.userId || row.user_id || '',
      address: row.address || '',
      vol: row.vol || row.volume || '0',
    }))

    // Format volume leaderboard (optional, can be used later)
    const volLeaderboard: Array<{ userId: string; address: string; vol: string }> = volData.map((row) => ({
      userId: row.userId || row.user_id || '',
      address: row.address || '',
      vol: row.vol || row.volume || '0',
    }))

    console.log('[v0] Parsed leaderboards:', {
      perps: perpsLeaderboard.length,
      spot: spotLeaderboard.length,
      vol: volLeaderboard.length,
    })

    const result: LeaderboardResponse = {
      perpsLeaderboard,
      spotLeaderboard,
      fromCache: false,
    }

    // Cache all leaderboards
    await Promise.all([
      setCacheWithTTL(CACHE_KEYS.LEADERBOARD_PERPS, perpsLeaderboard),
      setCacheWithTTL(CACHE_KEYS.LEADERBOARD_SPOT, spotLeaderboard),
      setCacheRefreshTime(),
    ])

    console.log('[v0] Leaderboard data cached successfully')
    return result
  } catch (error) {
    console.error('[v0] Error fetching leaderboard data:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get from cache first
    console.log('[v0] Checking leaderboard cache')
    const [perpsLeaderboard, spotLeaderboard] = await Promise.all([
      getCache<any>(CACHE_KEYS.LEADERBOARD_PERPS),
      getCache<any>(CACHE_KEYS.LEADERBOARD_SPOT),
    ])

    if (perpsLeaderboard !== null && spotLeaderboard !== null) {
      console.log('[v0] Returning leaderboard from cache')
      return NextResponse.json({
        perpsLeaderboard,
        spotLeaderboard,
        fromCache: true,
      } as LeaderboardResponse)
    }

    // Cache miss, fetch fresh data
    console.log('[v0] Leaderboard cache miss, fetching fresh data')
    const freshData = await fetchAndCalculateLeaderboard()

    return NextResponse.json(freshData)
  } catch (error) {
    console.error('[v0] Error in leaderboard API:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
  }
}
