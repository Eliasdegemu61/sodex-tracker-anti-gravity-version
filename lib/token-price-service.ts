// Token price cache with expiration
interface PriceCache {
  price: number;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 60000; // 1 minute
const priceCache = new Map<string, PriceCache>();

// Helper function to normalize token symbol (remove prefixes like v, w)
function normalizeSymbol(symbol: string): string {
  const normalized = symbol.toUpperCase();
  if (normalized.startsWith('V') || normalized.startsWith('W')) {
    return normalized.substring(1);
  }
  return normalized;
}

// Get price from perps market API as fallback
async function getPriceFromPerpsMarket(tokenSymbol: string): Promise<number> {
  try {
    console.log('[v0] Fetching from perps market for:', tokenSymbol);
    const response = await fetch(
      'https://mainnet-gw.sodex.dev/api/v1/perps/markets/mark-prices'
    );
    const data = await response.json();

    if (data.code === 0 && data.data) {
      const normalizedSymbol = normalizeSymbol(tokenSymbol);
      
      // Find matching market entry
      const market = data.data.find((m: any) => {
        const marketSymbol = m.symbol.split('-')[0]; // Get token part before -USD
        return normalizeSymbol(marketSymbol) === normalizedSymbol;
      });

      if (market && market.markPrice) {
        const price = parseFloat(market.markPrice);
        console.log(
          '[v0] Found price in perps market:',
          tokenSymbol,
          'price:',
          price
        );
        return price;
      }
    }
  } catch (err) {
    console.error('[v0] Error fetching from perps market:', err);
  }
  return 0;
}

// Get price from SSI API
async function getPriceFromSSI(tokenSymbol: string): Promise<number> {
  try {
    console.log('[v0] Fetching SSI price for:', tokenSymbol);
    const response = await fetch(
      `https://ssi-gw.sosovalue.com/indices/indexOfficial/indexTokenDetail/${tokenSymbol}`
    );
    const data = await response.json();

    if (data.data?.price) {
      const price = data.data.price;
      console.log('[v0] Found SSI price for:', tokenSymbol, 'price:', price);
      return price;
    }
  } catch (err) {
    console.error('[v0] Error fetching SSI price:', err);
  }
  return 0;
}

// Main function to get token price with caching and fallback
export async function getTokenPrice(tokenSymbol: string): Promise<number> {
  const cacheKey = tokenSymbol.toUpperCase();

  // Check cache
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    console.log('[v0] Using cached price for:', tokenSymbol, 'price:', cached.price);
    return cached.price;
  }

  let price = 0;

  // Try SSI API first
  price = await getPriceFromSSI(tokenSymbol);

  // If SSI fails, try perps market API
  if (price === 0) {
    console.log('[v0] SSI API failed, trying perps market fallback');
    price = await getPriceFromPerpsMarket(tokenSymbol);
  }

  // Cache the result
  priceCache.set(cacheKey, {
    price,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION,
  });

  return price;
}

// Get multiple token prices at once
export async function getTokenPrices(
  tokenSymbols: string[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // Fetch all prices in parallel
  const pricePromises = tokenSymbols.map(async (symbol) => {
    const price = await getTokenPrice(symbol);
    prices[symbol] = price;
  });

  await Promise.all(pricePromises);
  return prices;
}

// Clear cache for a specific token
export function clearPriceCache(tokenSymbol: string): void {
  priceCache.delete(tokenSymbol.toUpperCase());
}

// Clear all prices
export function clearAllPriceCache(): void {
  priceCache.clear();
}
