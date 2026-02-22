// Redis Service for caching DEX status and leaderboard data
// Uses Upstash Redis REST API for serverless compatibility

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Cache TTL: 2 hours in seconds
const CACHE_TTL = 2 * 60 * 60

// Cache keys
export const CACHE_KEYS = {
  DEX_TOTAL_USERS: 'dex:totalUsers',
  DEX_AVG_PNL_BY_VOLUME: 'dex:avgPnlByVolume',
  DEX_TOP_TRADERS_PERPS: 'dex:topTradersPerps',
  DEX_TOP_TRADERS_SPOT: 'dex:topTradersSpot',
  DEX_TOP_LOSERS: 'dex:topLosers',
  DEX_TOP_GAINERS: 'dex:topGainers',
  LEADERBOARD_PERPS: 'leaderboard:perps',
  LEADERBOARD_SPOT: 'leaderboard:spot',
  CACHE_LAST_REFRESH: 'cache:lastRefresh',
}

interface RedisResponse {
  result: string | null
}

/**
 * Execute Redis command via REST API
 */
async function executeRedisCommand(command: string[]): Promise<string | null> {
  if (!REDIS_URL || !REDIS_TOKEN) {
    // Only warn in production - in development, this is expected when env vars aren't set
    if (process.env.NODE_ENV === 'production') {
      console.warn('[v0] Redis credentials not configured - caching disabled')
    }
    return null
  }

  try {
    const response = await fetch(REDIS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[v0] Redis command failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data: RedisResponse = await response.json()
    return data.result
  } catch (error) {
    console.error('[v0] Redis execution error:', error)
    return null
  }
}

/**
 * Set a value in Redis with TTL
 */
export async function setCacheWithTTL(key: string, value: any): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value)
    const result = await executeRedisCommand(['SETEX', key, CACHE_TTL.toString(), jsonValue])
    return result !== null
  } catch (error) {
    console.error(`[v0] Failed to set cache for key ${key}:`, error)
    return false
  }
}

/**
 * Get a value from Redis
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const result = await executeRedisCommand(['GET', key])
    if (!result) return null
    return JSON.parse(result) as T
  } catch (error) {
    console.error(`[v0] Failed to get cache for key ${key}:`, error)
    return null
  }
}

/**
 * Delete a key from Redis
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const result = await executeRedisCommand(['DEL', key])
    return result !== null
  } catch (error) {
    console.error(`[v0] Failed to delete cache for key ${key}:`, error)
    return false
  }
}

/**
 * Clear multiple cache keys
 */
export async function clearCacheKeys(keys: string[]): Promise<void> {
  for (const key of keys) {
    await deleteCache(key)
  }
}

/**
 * Get cache last refresh timestamp
 */
export async function getCacheRefreshTime(): Promise<number | null> {
  const result = await getCache<number>(CACHE_KEYS.CACHE_LAST_REFRESH)
  return result
}

/**
 * Set cache refresh timestamp
 */
export async function setCacheRefreshTime(): Promise<void> {
  await setCacheWithTTL(CACHE_KEYS.CACHE_LAST_REFRESH, Date.now())
}

/**
 * Check if cache needs refresh (2 hour cycle)
 */
export async function isCacheExpired(): Promise<boolean> {
  const lastRefresh = await getCacheRefreshTime()
  if (!lastRefresh) return true

  const now = Date.now()
  const ageMs = now - lastRefresh
  const twoHoursMs = 2 * 60 * 60 * 1000

  return ageMs > twoHoursMs
}
