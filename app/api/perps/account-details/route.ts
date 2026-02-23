import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
        return NextResponse.json({ error: 'AccountId is required' }, { status: 400 });
    }

    try {
        const url = `https://mainnet-gw.sodex.dev/futures/fapi/user/v1/public/account/details?accountId=${accountId}`;
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch from Sodex: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] Error fetching account details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
