import { NextRequest, NextResponse } from 'next/server';

interface VaultPositionResponse {
  code: string;
  message: string;
  data?: {
    address: string;
    firstOpenedAt: number;
    holdingSeconds: number;
    pnl: number;
    shares: number;
    tvl: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const url = 'https://alpha-biz.sodex.dev/biz/vaultdata/position_by_address';
    
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'https://sodex.com',
      'Referer': 'https://sodex.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`Sodex API error: ${response.statusText}`);
    }

    const data: VaultPositionResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Vault API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch vault data' },
      { status: 500 }
    );
  }
}
