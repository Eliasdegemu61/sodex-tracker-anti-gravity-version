import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = 'https://alpha-biz.sodex.dev/biz/vaultdata/position_by_address'

    const headers = {
      'Content-Type': 'application/json',
      Origin: 'https://sodex.com',
      Referer: 'https://sodex.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    }

    const payload = {
      address: '',
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Sodex API error: ${response.status}`)
    }

    const result = await response.json()

    if (result.code === '0' && result.data) {
      return NextResponse.json({
        tvl: result.data.tvl,
        pnl: result.data.pnl,
        shares: result.data.shares,
      })
    }

    throw new Error(`API error: ${result.message || 'Unknown error'}`)
  } catch (error) {
    console.error('[v0] Error fetching TVL:', error)
    return NextResponse.json({ error: 'Failed to fetch TVL data' }, { status: 500 })
  }
}
