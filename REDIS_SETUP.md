# Redis Caching Setup Guide

## Overview

This application uses Redis (via Upstash) to cache:
- **DEX Status Data** (2-hour TTL):
  - Total users
  - Average PnL by volume range
  - Top traders (Perps)
  - Top traders (Spot)
  - Top 5 losers
  - Top 5 gainers

- **Leaderboard Data** (2-hour TTL):
  - Perps leaderboard (sorted by volume)
  - Spot leaderboard (sorted by volume)

## Environment Variables

Add these to your `.env.local` or Vercel project settings:

```
UPSTASH_REDIS_REST_URL=https://clever-dory-20002.upstash.io
UPSTASH_REDIS_REST_TOKEN=AU4iAAIncDIwMzg5YzVlYjViNWY0OGFlYWFjNmYxODhiMjVkZDY0Y3AyMjAwMDI
CACHE_REFRESH_SECRET=your_secret_token_here (optional, for cache refresh security)
```

## API Endpoints

### DEX Status (Cached)
- **URL**: `/api/dex-status/cached`
- **Method**: GET
- **Response**:
  ```json
  {
    "totalUsers": 1000,
    "usersInProfit": 600,
    "usersInLoss": 400,
    "topTradersPerps": [...],
    "topLoserPerps": [...],
    "topGainers": [...],
    "topTradersSpot": [...],
    "avgPnlByVolumeRange": { "0-10k": -150, "10k-50k": 200, ... },
    "fromCache": true
  }
  ```

### Leaderboard (Cached)
- **URL**: `/api/leaderboard/cached`
- **Method**: GET
- **Response**:
  ```json
  {
    "perpsLeaderboard": [...],
    "spotLeaderboard": [...],
    "fromCache": true
  }
  ```

### Cache Refresh (Manual)
- **URL**: `/api/cache/refresh`
- **Method**: POST
- **Headers**: `Authorization: Bearer your_secret_token_here` (if CACHE_REFRESH_SECRET is set)
- **Purpose**: Manually trigger cache refresh

## Setting Up Automatic 2-Hour Cache Refresh

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cache/refresh",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:
- **EasyCron**: https://www.easycron.com/
- **Cron-Job.org**: https://cron-job.org/
- **AWS EventBridge**: Set up a scheduled event

Configure them to POST to:
```
https://your-domain.com/api/cache/refresh
Authorization: Bearer your_secret_token_here
```

### Option 3: GitHub Actions

Create `.github/workflows/cache-refresh.yml`:

```yaml
name: Cache Refresh

on:
  schedule:
    - cron: '0 */2 * * *'

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cache refresh
        run: |
          curl -X POST https://your-domain.com/api/cache/refresh \
            -H "Authorization: Bearer ${{ secrets.CACHE_REFRESH_SECRET }}"
```

## How It Works

1. **First Request**: Data is fetched from GitHub, cached in Redis with 2-hour TTL, and returned
2. **Subsequent Requests (within 2 hours)**: Data is served from Redis cache (instant response)
3. **After 2 Hours**: Cache expires automatically
4. **Next Request After Expiry**: Fresh data fetched from GitHub and cached again
5. **Scheduled Refresh**: Every 2 hours, cache is cleared and refreshed with new data

## Cache Keys Used

```
dex:totalUsers              # Total number of traders
dex:avgPnlByVolume          # Average PnL by volume range
dex:topTradersPerps         # Top 10 traders by PnL (Perps)
dex:topTradersSpot          # Top traders (Spot)
dex:topLosers               # Top 5 losers
dex:topGainers              # Top 5 gainers
leaderboard:perps           # Full perps leaderboard (sorted by volume)
leaderboard:spot            # Full spot leaderboard (sorted by volume)
cache:lastRefresh           # Last refresh timestamp
```

## Troubleshooting

### Cache Not Working
1. Check that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Look at server logs for `[v0]` messages
3. Visit `/api/dex-status/cached` - should return `"fromCache": true` on second request

### Cache Not Refreshing
1. Verify cron job is configured correctly
2. Test manually: `curl -X POST http://localhost:3000/api/cache/refresh`
3. Check Vercel cron logs in project settings

### Data Not Updating
1. Ensure GitHub URLs are correct in the API routes
2. Check that GitHub repositories are accessible
3. Verify the 2-hour TTL hasn't expired (check response metadata)

## Deployment Considerations

The setup is deployment-agnostic - it works anywhere with:
- **Node.js runtime** (Vercel, AWS Lambda, Netlify Functions, etc.)
- **The two Redis environment variables set**
- **Cron/scheduler configured** (native to the platform or external service)

For multi-region deployments, each region will have its own independent Redis connection using the same Upstash endpoint, so data stays consistent.

## Performance Impact

- **Cached responses**: <50ms (from Redis)
- **Fresh fetch**: 2-5 seconds (from GitHub)
- **User experience**: Near-instant after first 2-hour cycle
- **Bandwidth savings**: ~90% reduction after initial fetch
