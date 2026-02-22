# Price Fetching System - Complete Explanation

## How Total Balance and Asset Allocation Cards Work

### 1. TOTAL BALANCE CARD

**Purpose:** Display the combined USD value of all user assets

**Data Sources:**
```
Total Balance = Futures Balance + Spot Balance + Vault Balance
```

#### Flow Diagram:
```
Portfolio Overview Component
         ↓
fetchDetailedBalance(userId)
         ↓
    ┌────────────────────────────────────┐
    │   Get 3 Balance Components:         │
    ├────────────────────────────────────┤
    │ 1. Futures Balance (USDC wallet)    │  ← Already USD (working ✓)
    │ 2. Spot Balance (complex calc)      │  ← FIXED with multi-API
    │ 3. Vault Balance                    │  ← Already USD (working ✓)
    └────────────────────────────────────┘
         ↓
    Sum All 3 Components
         ↓
    Display Total
```

### 2. ASSET ALLOCATION CARD

**Purpose:** Show individual spot token holdings

**Data Sources:**
```
Spot Balance = SUM(each token balance × token price)
```

#### Flow Diagram:
```
Asset Breakdown Component
         ↓
fetchDetailedSpotBalance(userId)
         ↓
Get user spot balances from API
         ↓
For each token with balance:
    ├─ Clean name (remove V prefix)
    ├─ Find price from 3 APIs
    └─ Calculate: balance × price = USD value
         ↓
Sum all USD values = Total Spot USD
         ↓
Display table with each token
```

---

## The 3-API Price Resolution System

### Problem Tokens
- **vxaut** (V prefix means "vault")
- **vmag7.ssi** (vault index)
- **vpepe** (vault meme token)
- **mag7.ssi** (index token with .ssi suffix)

These don't exist in the standard futures market!

### Solution: Multi-Source Price Fetching

#### API 1: Mark Prices (Perps Markets)
```
URL: https://mainnet-gw.sodex.dev/api/v1/perps/markets/mark-prices

Response:
{
  "data": [
    { "symbol": "LTC-USD", "markPrice": "54.44" },
    { "symbol": "HYPE-USD", "markPrice": "29.611" },
    { "symbol": "ETH-USD", "markPrice": "2500.00" }
  ]
}

Processing:
- Extract token name before "-USD"
- Store: { "LTC": 54.44, "HYPE": 29.611, "ETH": 2500.00 }
```

**Good For:** Standard tokens (BTC, ETH, LTC), index tokens (HYPE, etc.)

---

#### API 2: Agg Tickers (Futures Market)
```
URL: https://mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/agg-tickers

Response:
{
  "data": [
    { "s": "TSLA-USD", "c": "410.68" },
    { "s": "1000BONK-USD", "c": "0.006167" },
    { "s": "XAUT-USD", "c": "2250.50" }
  ]
}

Processing:
- Extract token name before "-USD"
- Extract current price from 'c' field
- Store: { "TSLA": 410.68, "1000BONK": 0.006167, "XAUT": 2250.50 }
- Only add if NOT already in API 1 results (priority order)
```

**Good For:** Rare tokens, commodity tokens (XAUT), highly liquid pairs

---

#### Priority Order
```
API 1 (Mark Prices) → Higher Priority
           ↓
        STORE
           ↓
API 2 (Agg Tickers) → Lower Priority (only if not already found)
           ↓
        STORE IF NEW
```

---

## Token Name Cleaning

### The V Prefix
When user holds spot tokens, they come prefixed with "v":
- **vxaut** (vault XAUT)
- **vmag7** (vault MAG7)
- **vpepe** (vault PEPE)

### Cleaning Process
```typescript
function cleanTokenName(coin: string): string {
  return coin.replace(/^[vw]/i, '');
}

Examples:
"vxaut" → "xaut"
"vmag7.ssi" → "mag7.ssi"
"vpepe" → "pepe"
"VUSDC" → "USDC"
```

### Why This Matters
```
Raw balance: { coin: "vxaut", balance: "100" }
                    ↓
            Clean name: "xaut"
                    ↓
    Look for "xaut" in price APIs
                    ↓
API 2 has: "XAUT-USD" with price 2250.50
                    ↓
Found! Use 2250.50 as price per token
                    ↓
USD Value = 100 × 2250.50 = $225,050
```

---

## Complete Price Resolution Example

### Scenario: User has vxaut, vmag7.ssi, VUSDC

#### Token 1: vxaut
```
1. Raw balance: { coin: "vxaut", balance: "100" }
2. Clean: "xaut"
3. Search API 1 (Mark Prices): "xaut" in data? NO
4. Search API 2 (Agg Tickers): "xaut" in data? YES → 2250.50
5. Price found: $2250.50
6. USD Value: 100 × 2250.50 = $225,050 ✓
```

#### Token 2: vmag7.ssi
```
1. Raw balance: { coin: "vmag7.ssi", balance: "50" }
2. Clean: "mag7.ssi"
3. Search API 1 (Mark Prices): "mag7.ssi" in data? NO
4. Search API 2 (Agg Tickers): "mag7.ssi" in data? NO
5. Price NOT found: null
6. USD Value: 50 × null = $0
7. Display as: "OTHER ASSETS" (with 60% opacity)
```

#### Token 3: VUSDC
```
1. Raw balance: { coin: "VUSDC", balance: "1000" }
2. Clean: "USDC"
3. Check if USDC: YES → Hardcoded as $1.00
4. Price found: $1.00
5. USD Value: 1000 × 1.00 = $1,000 ✓
```

#### Total Spot Balance
```
$225,050 (vxaut) + $0 (vmag7.ssi) + $1,000 (VUSDC) = $226,050
Note: vmag7.ssi without price doesn't contribute to total
```

---

## Display Behavior

### Asset Breakdown Table

| Token | Balance | USD Value |
|-------|---------|-----------|
| xaut | 100 | $225,050 |
| mag7.ssi | 50 | **OTHER ASSETS** |
| USDC | 1,000 | $1,000 |

- Rows without prices appear at 60% opacity
- "OTHER ASSETS" label indicates price couldn't be determined
- Total = $226,050 (excluding unmapped tokens)

### Total Balance Card

```
Total Balance: $226,050
├─ Futures: $50,000
├─ Spot: $226,050 (vxaut + vmag7.ssi + USDC)
└─ Vault: $75,000
   ─────────────
   TOTAL: $351,050
```

---

## Debugging Console Output

When spot balance is calculated, you'll see:

```javascript
[v0] Fetched spot balances - count: 3
[v0] Loaded mark prices - count: 87
[v0] Loaded agg ticker prices - total count: 156

[v0] Token calculation: {
  token: "xaut",
  originalCoin: "vxaut",
  balance: 100,
  price: 2250.50,
  usdValue: 225050
}

[v0] Token calculation: {
  token: "mag7.ssi",
  originalCoin: "vmag7.ssi",
  balance: 50,
  price: "N/A",
  usdValue: 0
}

[v0] No price found for token: mag7.ssi - will show without USD conversion

[v0] Detailed spot balance calculated: {
  tokenCount: 3,
  totalUsdValue: 226050
}
```

---

## What If APIs Fail?

### Error Handling
```
Try API 1 (Mark Prices)
         ↓
    If fails: Log warning, continue
         ↓
Try API 2 (Agg Tickers)
         ↓
    If fails: Log warning, continue
         ↓
Calculate with whatever data we have
```

### Result
- Tokens found in successful APIs = get prices
- Tokens not in any API = show as "OTHER ASSETS"
- Total still displays, may be incomplete but not broken
- User sees all balances, USD values where available

---

## Summary

| Component | Status | Why |
|-----------|--------|-----|
| Futures Balance | ✓ Working | Already in USD (USDC wallet) |
| Vault Balance | ✓ Working | Already in USD |
| Spot Balance | ✓ FIXED | Multi-API price fetching now active |
| vxaut prices | ✓ FIXED | Cleaned to "xaut", found in API 2 |
| vmag7.ssi prices | ⚠️ Limited | No price data available anywhere |
| VUSDC prices | ✓ Working | Hardcoded $1.00 |
| Other tokens | ✓ Working | Fetched from API 1 or API 2 |
