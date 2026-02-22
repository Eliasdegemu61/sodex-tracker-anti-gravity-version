import { NextRequest, NextResponse } from 'next/server'
import { clearCacheKeys, CACHE_KEYS } from '@/lib/redis-service'

/**
 * Cache refresh endpoint - can be called by cron job every 2 hours
 * Usage: POST /api/cache/refresh
 * 
 * Set up in vercel.json or use an external cron service (e.g., Vercel Cron, EasyCron)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CACHE_REFRESH_SECRET && authHeader !== `Bearer ${process.env.CACHE_REFRESH_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Starting scheduled cache refresh')

    // Clear all cache keys to force fresh data fetch
    const cacheKeysList = Object.values(CACHE_KEYS)
    await clearCacheKeys(cacheKeysList)

    console.log('[v0] Cache cleared, new data will be fetched on next request')

    // Trigger fresh fetch for DEX status
    try {
      const dexResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/dex-status/cached`, {
        method: 'GET',
        cache: 'no-store',
      })
      if (dexResponse.ok) {
        console.log('[v0] DEX status cache refreshed')
      }
    } catch (e) {
      console.error('[v0] Failed to refresh DEX status cache:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Cache refresh initiated',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Cache refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh cache' },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Cache refresh endpoint is ready. Send POST request to trigger refresh.',
    timestamp: new Date().toISOString(),
  })
}
