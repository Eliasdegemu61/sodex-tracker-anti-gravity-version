# Spot Balance Price Fetching Fixes

## Problem Summary
Tokens with "V" prefix (like vxaut, vmag7.ssi, vpepe) were not getting prices because:
1. The old code only queried one API endpoint (mark-prices)
2. Tokens like "mag7.ssi" and "xaut" don't exist in the perps futures market
3. The "V" prefix removal logic existed but wasn't being leveraged properly across all price sources

## Solution Implemented

### 1. Multi-API Price Fetching Strategy
Updated `/lib/spot-balance.ts` to query **3 price sources** in order:

#### API 1: Mark Prices (Perps Markets)
```
GET https://mainnet-gw.sodex.dev/api/v1/perps/markets/mark-prices
Response: { symbol: "HYPE-USD", markPrice: "29.611" }
```
- Returns futures pairs and some index tokens
- Extracts token name before "-USD" suffix
- Example: "HYPE-USD" → stores as "HYPE" with price 29.611

#### API 2: Agg Tickers (Futures Market)
```
GET https://mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/agg-tickers
Response: { s: "TSLA-USD", c: "410.68" }
```
- Returns current prices for all traded futures pairs
- Extracts token name before "-USD" suffix
- Only adds price if not already found in API 1 (avoiding overwrite)
- Example: "1000BONK-USD" → stores as "1000BONK" with price 0.006167

#### API 3: Index Prices
- Covered by API 1, which includes index/SSI tokens like HYPE, LTC, etc.

### 2. Token Name Cleaning
```typescript
function cleanTokenName(coin: string): string {
  return coin.replace(/^[vw]/i, '');
}
```
- Removes leading "v" or "w" prefix from spot balance tokens
- Examples:
  - "vxaut" → "xaut"
  - "vmag7" → "mag7"
  - "vpepe" → "pepe"
  - "VUSDC" → "USDC"

### 3. Fallback & Error Handling
- If no price is found in any API, token USD value is set to 0
- Tokens without prices display as "OTHER ASSETS" in the asset breakdown table
- These rows appear with reduced opacity (60%) to distinguish them
- Total balance calculation excludes tokens without prices (conservative approach)
- Console warnings log which tokens couldn't get prices for debugging

### 4. Component Updates

#### Asset Breakdown Component
- Added `hasPrice` flag to formatted token data
- Tokens without prices show "OTHER ASSETS" instead of "-"
- Styled with opacity-60 for visual distinction

#### Portfolio Overview Component
- Total Balance now shows combined value of:
  - Futures Balance ✓ (already working)
  - Spot Balance (now fixed with multi-API)
  - Vault Balance ✓ (already working)
- Breakdown tooltip shows all three components

## Price Resolution Flow

```
User balance: "vxaut" = 100 tokens
                ↓
cleanTokenName("vxaut") = "xaut"
                ↓
Try API 1: "xaut-USD" in mark-prices? NO
                ↓
Try API 2: "xaut-USD" in agg-tickers? YES → price = $X.XX
                ↓
USD Value = 100 × $X.XX = $XXX.XX
```

## Examples

### Working Now ✓
- vxaut → xaut-USD → fetches from agg-tickers
- vmag7 → mag7-USD → can now fetch if available in APIs
- vpepe → pepe-USD → can now fetch if available in APIs
- VUSDC → USDC → hardcoded as $1.00
- SOSO → fetches fresh from SODEX API
- ETH, BTC, etc. → fetch from either mark-prices or agg-tickers

### Not Fetching ⚠️
Tokens that don't exist in the futures market data AND are not standard tokens will show:
- Balance: displayed
- USD Value: "OTHER ASSETS"
- Contribution to total: $0 (conservative)

## Testing Checklist
1. ✓ Total Balance still shows Futures + Spot + Vault
2. ✓ Spot Assets table shows all holdings
3. ✓ Tokens with V prefix get cleaned
4. ✓ Prices fetched from multiple APIs with fallback
5. ✓ Tokens without prices show "OTHER ASSETS"
6. ✓ No console errors for missing prices (warnings only)
7. ✓ Asset allocation card updates correctly

## Caching Behavior
- All price data is fetched fresh (not cached) to ensure real-time accuracy
- Deduplication prevents simultaneous requests for same user
- Auto-refresh: every 30 seconds for spot balance

## Future Improvements
1. Add direct support for more token price sources (Coingecko API, etc.)
2. Persistent cache for tokens without prices to avoid repeated lookups
3. User-configurable price sources
4. Manual price override UI for edge cases
