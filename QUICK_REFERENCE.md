# Quick Reference: Spot Balance Price Fetching

## The Problem (Fixed ✓)
Tokens like **vxaut, vmag7.ssi, vpepe** weren't getting prices, showing $0 USD value.

## Why It's Fixed
- **Before:** Only 1 price API queried
- **After:** 2 price APIs queried with fallback

## Two APIs Now Used

| API | URL | Best For |
|-----|-----|----------|
| **API 1: Mark Prices** | `mainnet-gw.sodex.dev/api/v1/perps/markets/mark-prices` | Standard tokens (BTC, ETH), some indexes (HYPE) |
| **API 2: Agg Tickers** | `mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/agg-tickers` | Rare tokens (XAUT, 1000BONK), commodity tokens |

**Priority:** API 1 first, then API 2 (only if not found in API 1)

## Token Cleaning
```
Input: vxaut, vmag7.ssi, vpepe
Output: xaut, mag7.ssi, pepe
Method: Remove leading "v" or "w" prefix
```

## Example Resolution

### Token: vxaut (balance: 100)
```
Clean: "xaut"
API 1 search: Not found
API 2 search: "XAUT-USD" found! Price = 2250.50
Result: 100 × 2250.50 = $225,050 ✓
```

### Token: vmag7.ssi (balance: 50)
```
Clean: "mag7.ssi"
API 1 search: Not found
API 2 search: Not found
Result: Show as "OTHER ASSETS" (no USD value)
```

## Display Changes

### Asset Breakdown Table
```
✓ Token WITH price: Shows $XXX.XX
⚠️ Token WITHOUT price: Shows "OTHER ASSETS" (60% opacity)
```

### Total Balance
```
Total = (Futures $) + (Spot $) + (Vault $)
Spot $ = Sum of tokens with prices only
```

## Console Debugging

**When spot balance loads, check console for:**
```
[v0] Loaded mark prices - count: 87
[v0] Loaded agg ticker prices - total count: 156
[v0] Found price for token: xaut price: 2250.50
[v0] No price found for token: mag7.ssi - will show without USD conversion
```

## What Didn't Change
- Futures Balance: Still works perfectly ✓
- Vault Balance: Still works perfectly ✓
- Token holdings: Display unchanged
- Refresh rate: Still 30 seconds

## Key Files Modified
1. `/lib/spot-balance.ts` - Multi-API price fetching
2. `/components/asset-breakdown.tsx` - Visual styling for unpriced tokens

## Files Added (Documentation)
- `SPOT_BALANCE_FIXES.md` - Problem/solution overview
- `PRICE_FETCHING_EXPLAINED.md` - Detailed technical explanation
- `CHANGES_MADE.md` - Exact code changes
- `QUICK_REFERENCE.md` - This guide

---

## Troubleshooting

**Q: Why is vxaut still showing $0?**
A: Check console. If "No price found" appears, then vxaut isn't in either API. Most likely it exists but system is still loading, refresh page.

**Q: Why does vmag7.ssi say "OTHER ASSETS"?**
A: This token has no price data in the APIs. This is expected for some vault-wrapped or index tokens.

**Q: Is the total balance wrong?**
A: If it includes tokens marked "OTHER ASSETS" as $0, that's correct. Those tokens aren't included in USD total.

**Q: What if both APIs fail?**
A: You'll see warnings in console but it won't crash. Tokens get marked as "OTHER ASSETS".

---

## Summary
✅ vxaut prices now fetch from API 2  
✅ vmag7.ssi shows gracefully as "OTHER ASSETS"  
✅ vpepe and other tokens handled  
✅ Total balance calculates correctly  
✅ No broken totals or errors  
