'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/format-number'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'

interface TokenFlow {
    token: string
    overall_deposit: number
    overall_withdrawal: number
    net_remaining: number
}

export function OverallDepositsCard() {
    const [data, setData] = useState<TokenFlow[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Fund-flow-sodex/main/overall_sodex_totals.csv')
                const csvText = await response.text()
                const lines = csvText.trim().split('\n')
                if (lines.length < 2) return

                const parsed: TokenFlow[] = []
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',')
                    if (values.length >= 3) {
                        const token = values[0].trim()
                        const overall_deposit = parseFloat(values[1].trim())
                        const overall_withdrawal = parseFloat(values[2].trim())
                        const net_remaining = overall_deposit - overall_withdrawal
                        parsed.push({ token, overall_deposit, overall_withdrawal, net_remaining })
                    }
                }
                setData(parsed)
            } catch (err) {
                console.error('Failed to fetch overall token flow data', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <Card className="p-3 bg-card/50 border-border">
                <div className="text-xs text-muted-foreground animate-pulse">Loading token flows...</div>
            </Card>
        )
    }

    return (
        <Card className="p-3 bg-card/50 border-border flex-1">
            <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-3.5 h-3.5 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Overall Deposits & Withdrawals</h3>
            </div>
            <div className="space-y-0.5">
                {data.map((item) => (
                    <div key={item.token} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors">
                        <span className="text-xs font-medium text-foreground w-16 truncate">{item.token}</span>
                        <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-0.5 text-green-500">
                                <ArrowDownRight className="w-3 h-3" />
                                {formatNumber(item.overall_deposit)}
                            </span>
                            <span className="flex items-center gap-0.5 text-red-500">
                                <ArrowUpRight className="w-3 h-3" />
                                {formatNumber(item.overall_withdrawal)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export function NetRemainingCard() {
    const [data, setData] = useState<TokenFlow[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Fund-flow-sodex/main/overall_sodex_totals.csv')
                const csvText = await response.text()
                const lines = csvText.trim().split('\n')
                if (lines.length < 2) return

                const parsed: TokenFlow[] = []
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',')
                    if (values.length >= 3) {
                        const token = values[0].trim()
                        const overall_deposit = parseFloat(values[1].trim())
                        const overall_withdrawal = parseFloat(values[2].trim())
                        const net_remaining = overall_deposit - overall_withdrawal
                        // Only include tokens with positive net remaining
                        if (net_remaining > 0) {
                            parsed.push({ token, overall_deposit, overall_withdrawal, net_remaining })
                        }
                    }
                }
                // Sort by net remaining descending
                parsed.sort((a, b) => b.net_remaining - a.net_remaining)
                setData(parsed)
            } catch (err) {
                console.error('Failed to fetch overall token flow data', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <Card className="p-3 bg-card/50 border-border">
                <div className="text-xs text-muted-foreground animate-pulse">Loading net remaining...</div>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card className="p-3 bg-card/50 border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">Net Tokens on SoDEX</h3>
                <p className="text-xs text-muted-foreground">No tokens with positive net remaining</p>
            </Card>
        )
    }

    return (
        <Card className="p-3 bg-card/50 border-border flex-1">
            <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-3.5 h-3.5 text-green-500" />
                <h3 className="text-sm font-semibold text-foreground">Net Tokens on SoDEX</h3>
            </div>
            <div className="space-y-0.5">
                {data.map((item) => (
                    <div key={item.token} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/30 transition-colors">
                        <span className="text-xs font-medium text-foreground">{item.token}</span>
                        <span className="text-[10px] font-semibold text-green-500">{formatNumber(item.net_remaining)}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
