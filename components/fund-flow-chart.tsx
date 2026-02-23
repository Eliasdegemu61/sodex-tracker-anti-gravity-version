'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatNumber } from '@/lib/format-number'

interface FlowData {
    date: string
    token: string
    total_depo: number
    total_with: number
}

export function FundFlowChart() {
    const [data, setData] = useState<FlowData[]>([])
    const [tokens, setTokens] = useState<string[]>([])
    const [selectedToken, setSelectedToken] = useState<string>('USDC')
    const [isLoading, setIsLoading] = useState(true)
    const [showNetRemaining, setShowNetRemaining] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Fund-flow-sodex/main/daily_net_flows.csv')
                const csvText = await response.text()

                const lines = csvText.trim().split('\n')
                if (lines.length < 2) return

                const parsedData: FlowData[] = []
                const tokenSet = new Set<string>()

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',')
                    if (values.length >= 4) {
                        const date = values[0].trim()
                        const token = values[1].trim()
                        const total_depo = parseFloat(values[2].trim())
                        const total_with = parseFloat(values[3].trim())

                        parsedData.push({ date, token, total_depo, total_with })
                        tokenSet.add(token)
                    }
                }

                const uniqueTokens = Array.from(tokenSet).sort()
                setData(parsedData)
                setTokens(uniqueTokens)
                if (uniqueTokens.includes('USDC')) setSelectedToken('USDC')
                else if (uniqueTokens.length > 0) setSelectedToken(uniqueTokens[0])
            } catch (err) {
                console.error('Failed to fetch fund flow data', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const chartData = useMemo(() => {
        if (!selectedToken) return []
        const tokenData = data
            .filter((d) => d.token === selectedToken)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        let cumulative = 0;
        return tokenData.map((d) => {
            cumulative += (d.total_depo - d.total_with);
            return {
                ...d,
                net_remaining: cumulative
            }
        })
    }, [data, selectedToken])

    if (isLoading) {
        return (
            <Card className="p-4 bg-card/50 border-border h-64 flex items-center justify-center mt-4">
                <div className="text-muted-foreground">Loading Fund Flows...</div>
            </Card>
        )
    }

    return (
        <Card className="p-4 bg-card/50 border-border mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h3 className="text-xs md:text-sm font-semibold text-foreground">Fund Flows</h3>
                    <p className="text-xs text-muted-foreground">Daily Deposits and Withdrawals</p>
                </div>
                <div className="w-[120px]">
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Token" />
                        </SelectTrigger>
                        <SelectContent>
                            {tokens.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="w-full h-64">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDepo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getMonth() + 1}/${d.getDate()}`
                                }}
                                stroke="currentColor"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tick={{ fill: 'currentColor' }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                tickFormatter={(val) => val === 0 ? '0' : formatNumber(val)}
                                stroke="currentColor"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={50}
                                tick={{ fill: 'currentColor' }}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--popover-foreground))',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                                formatter={(value: any) => formatNumber(value as number)}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_depo"
                                name="Deposits"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorDepo)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="total_with"
                                name="Withdrawals"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorWith)"
                                strokeWidth={2}
                            />
                            {showNetRemaining && (
                                <Area
                                    type="monotone"
                                    dataKey="net_remaining"
                                    name="Net Remaining"
                                    stroke="#f59e0b"
                                    fill="none"
                                    strokeWidth={2.5}
                                    isAnimationActive={false}
                                    dot={false}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        No data available for {selectedToken}
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-6 text-xs justify-center flex-wrap items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-muted-foreground">Deposit</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="text-muted-foreground">Withdrawal</span>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="show-net-remaining"
                        checked={showNetRemaining}
                        onCheckedChange={(checked) => setShowNetRemaining(checked as boolean)}
                        className="h-3.5 w-3.5"
                    />
                    <label
                        htmlFor="show-net-remaining"
                        className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none"
                    >
                        <div className="w-3 h-3 border-2 border-amber-500 rounded" />
                        Net Remaining
                    </label>
                </div>
            </div>
        </Card>
    )
}
