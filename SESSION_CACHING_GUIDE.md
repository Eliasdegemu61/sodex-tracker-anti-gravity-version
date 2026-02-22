# Session-Based Caching Implementation

## Overview
Implemented intelligent session-based caching to optimize data loading across the application. Leaderboard and DEX status data are now cached for the entire session, while Portfolio and Tracker sections continue to fetch fresh data regularly.

## Key Changes

### 1. SessionCacheContext (`context/session-cache-context.tsx`)
- New context for managing session-wide data caching
- **Preloads leaderboard data** (both perps and spot) on dashboard mount
- Caches volumeData, pnlData, and spotData in a single session
- Data persists until page refresh (browser session ends)

### 2. DexStatusContext Updates
- Changed from 10-minute cache duration to session-based caching
- Dex status data is cached for the entire session
- Only refetches on page refresh or explicit cache clear
- Prevents unnecessary API calls when users navigate between sections

### 3. Dashboard Page Updates (`app/dashboard/page.tsx`)
- Preloads leaderboard data on component mount
- Happens silently in the background without blocking UI
- Users see instant data when navigating to leaderboard section

### 4. Leaderboard Components Updates
- **SpotLeaderboard** and **PerpsLeaderboard** now check cache first
- If cached data exists, uses it immediately
- Falls back to API fetch only if cache is empty
- Significantly faster second access to leaderboard

## Behavior by Section

### Portfolio & Tracker
- **Behavior**: Continues to fetch fresh data regularly (no changes)
- **Why**: These sections show real-time user-specific data that changes frequently
- **Refresh Rate**: Portfolio every 20 seconds, Tracker on demand

### DEX Status & Leaderboard  
- **Behavior**: Cached for entire session, no refetch unless page refreshes
- **Why**: These are global statistics that don't change frequently within a user session
- **Performance Benefit**: Eliminates redundant API calls, faster navigation

## Benefits

1. **Faster Navigation** - Users immediately see leaderboard/DEX data when switching tabs
2. **Reduced API Load** - No redundant API calls for static data within a session
3. **Better UX** - No loading states when navigating between cached sections
4. **Maintained Freshness** - Portfolio/Tracker still get real-time updates
5. **Simple Implementation** - Clean separation of concerns with SessionCacheContext

## How It Works

```
User visits dashboard
    ↓
Dashboard mounts → Preload leaderboard data (background)
    ↓
User clicks Leaderboard tab → Data already cached → Instant display
    ↓
User refreshes page → Cache cleared → Fresh data loaded
```

## Cache Lifecycle

- **Creation**: Triggered by `preloadLeaderboardData()` on dashboard mount
- **Persistence**: Stays in React state for duration of page session
- **Invalidation**: Cleared on page refresh (automatic browser behavior)
- **Size**: Minimal (just arrays of leaderboard entries)

## Code Examples

### Preloading Data (Dashboard)
```typescript
const { preloadLeaderboardData } = useSessionCache()

useEffect(() => {
  preloadLeaderboardData() // Happens silently on mount
}, [preloadLeaderboardData])
```

### Using Cached Data (Leaderboard)
```typescript
const { leaderboardCache } = useSessionCache()

if (leaderboardCache?.spotData?.length > 0) {
  setData(leaderboardCache.spotData) // Use cache instantly
} else {
  // Fetch from API as fallback
}
```

## Testing the Implementation

1. Load dashboard - leaderboard data preloads in background
2. Navigate to Leaderboard tab - should display instantly
3. Switch between Perps/Spot leaderboards - no loading delay
4. Refresh page - cache clears, fresh data loads
5. Portfolio tab - continues to refresh every 20 seconds

## Future Optimizations

- Add manual "Refresh" button to clear cache if needed
- Implement TTL (time-to-live) with optional cache bust
- Add cache size monitoring for production
- Consider IndexedDB for larger datasets across sessions
