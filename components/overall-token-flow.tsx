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
            <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse">
                <h3 className="text-xs font-semibold text-muted-foreground/60 mb-4">Tracking Inflows</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-secondary/10 rounded-xl" />
                    ))}
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground/60">Token Flow</h3>
                <Wallet className="w-3.5 h-3.5 text-orange-400/40" />
            </div>
            <div className="space-y-2">
                {data.map((item) => (
                    <div key={item.token} className="flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-orange-500/5 transition-all duration-300">
                        <span className="text-[11px] font-bold text-foreground/80 w-16 truncate">{item.token}</span>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] text-muted-foreground/20 font-bold   leading-none mb-1">Inflow</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
                                    <ArrowDownRight className="w-2.5 h-2.5" />
                                    {formatNumber(item.overall_deposit)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] text-muted-foreground/20 font-bold   leading-none mb-1">Outflow</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                                    <ArrowUpRight className="w-2.5 h-2.5" />
                                    {formatNumber(item.overall_withdrawal)}
                                </span>
                            </div>
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
            <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl animate-pulse">
                <h3 className="text-xs font-semibold text-muted-foreground/60 mb-4">Auditing Reserves</h3>
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div key={i} className="h-8 bg-secondary/10 rounded-xl" />
                    ))}
                </div>
            </Card>
        )
    }

    if (data.length === 0) {
        return (
            <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl">
                <h3 className="text-[10px] font-bold  text-muted-foreground/40 dark:text-muted-foreground/40 text-muted-foreground/80  mb-2">Net Reserves</h3>
                <p className="text-[10px] text-muted-foreground/30 font-bold uppercase ">No positive retention detected</p>
            </Card>
        )
    }

    return (
        <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm flex-1 group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold  text-muted-foreground/40 dark:text-muted-foreground/40 text-muted-foreground/80 ">Net Token Retention</h3>
                <Wallet className="w-3.5 h-3.5 text-green-500/40" />
            </div>
            <div className="space-y-2">
                {data.map((item) => (
                    <div key={item.token} className="flex items-center justify-between p-3 bg-secondary/5 rounded-2xl border border-border/5 hover:bg-green-500/5 transition-all duration-300">
                        <span className="text-[11px] font-bold text-foreground/80">{item.token}</span>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] text-muted-foreground/20 font-bold   leading-none mb-1">Retained</span>
                            <span className="text-[11px] font-bold text-green-400">{formatNumber(item.net_remaining)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}

