import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Shield, Zap, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { getTokenLogo } from '@/lib/token-logos';

interface PnLPoint {
    time: string;
    pnl: number;
}

interface Position {
    symbol: string;
    positionId: string;
    side: string;
    leverage: string;
    margin_type: string;
    margin_allocated: string;
    liquidation_price: string;
    size: string;
    entry_price: string;
    tp: string;
    sl: string;
    unrealized_pnl: string;
    realized_pnl: string;
    fees_paid: string;
    opened_at: string;
    last_action_at: string;
    history?: PnLPoint[];
}

export function WhaleTracker() {
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [whaleData, setWhaleData] = useState<Position[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [whaleInfo, setWhaleInfo] = useState<{ userId: string; address: string } | null>(null);
    const historyRef = useRef<{ [key: string]: PnLPoint[] }>({});

    // Poll every 2 seconds
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (whaleInfo) {
            interval = setInterval(() => {
                fetchWhaleData(whaleInfo.userId, true);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [whaleInfo]);

    const fetchWhaleData = async (userId: string, isUpdate = false) => {
        if (!isUpdate) setIsLoading(true);
        try {
            const [posResponse, ordersResponse] = await Promise.all([
                fetch(`https://mainnet-gw.sodex.dev/futures/fapi/user/v1/public/account/details?accountId=${userId}`),
                fetch(`https://mainnet-gw.sodex.dev/futures/fapi/trade/v1/public/list?accountId=${userId}`)
            ]);

            const posJson = await posResponse.json();
            const ordersJson = await ordersResponse.json();

            const posData = posJson.data;
            const openOrders = ordersJson.data;

            if (!posData || !posData.positions || posData.positions.length === 0) {
                setWhaleData([]);
                historyRef.current = {};
                return;
            }

            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const processedData: Position[] = posData.positions.map((pos: any) => {
                let tp_price = "None";
                let sl_price = "None";

                if (openOrders && Array.isArray(openOrders)) {
                    openOrders.forEach((order: any) => {
                        if (String(order.positionId) === String(pos.positionId)) {
                            if (order.triggerProfitPrice) tp_price = order.triggerProfitPrice;
                            if (order.triggerStopPrice) sl_price = order.triggerStopPrice;
                        }
                    });
                }

                const pId = String(pos.positionId);
                const currentPnl = parseFloat(pos.unrealizedProfit);

                // Update history
                if (!historyRef.current[pId]) {
                    historyRef.current[pId] = [];
                }

                // Keep last 30 points (1 minute of data at 2s interval)
                const newHistory = [...historyRef.current[pId], { time: now, pnl: currentPnl }].slice(-30);
                historyRef.current[pId] = newHistory;

                return {
                    symbol: pos.symbol,
                    positionId: pos.positionId,
                    side: pos.positionSide,
                    leverage: `${pos.leverage}x`,
                    margin_type: pos.positionType,
                    margin_allocated: pos.isolatedMargin,
                    liquidation_price: pos.liquidationPrice,
                    size: pos.positionSize,
                    entry_price: pos.entryPrice,
                    tp: tp_price,
                    sl: sl_price,
                    unrealized_pnl: pos.unrealizedProfit,
                    realized_pnl: pos.realizedProfit,
                    fees_paid: pos.cumTradingFee,
                    opened_at: pos.createdTime,
                    last_action_at: pos.updatedTime,
                    history: newHistory
                };
            });

            setWhaleData(processedData);
        } catch (err) {
            console.error('Error fetching whale data:', err);
            if (!isUpdate) setError('Failed to fetch whale position data');
        } finally {
            if (!isUpdate) setIsLoading(false);
        }
    };

    const handleTrack = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!address.trim()) return;

        setIsLoading(true);
        setError(null);
        setWhaleData(null);
        setWhaleInfo(null);
        historyRef.current = {};

        try {
            const response = await fetch('https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/refs/heads/main/registry.json');
            const registry = await response.json();

            const foundWhale = registry.find((entry: any) => entry.address.toLowerCase() === address.toLowerCase());

            if (foundWhale) {
                setWhaleInfo(foundWhale);
                await fetchWhaleData(foundWhale.userId);
            } else {
                setError('Address not found in registry');
            }
        } catch (err) {
            setError('Failed to load registry');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val: string | number) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    };

    const formatTime = (timestamp: string | number) => {
        if (!timestamp || timestamp === "0") return "N/A";
        return new Date(Number(timestamp)).toLocaleString();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Search Header */}
            <div className="relative overflow-hidden rounded-3xl bg-secondary/10 border border-border/20 p-6 md:p-10">
                <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                    <h1 className="text-sm md:text-base font-medium text-muted-foreground/60 italic lowercase text-center">
                        tracking open positions in real time...
                    </h1>

                    <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Enter wallet address..."
                                className="h-11 pl-10 bg-background/20 border-border/30 focus:border-accent/30 focus:ring-0 text-sm rounded-xl placeholder:text-muted-foreground/30"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="h-11 px-6 bg-card hover:bg-secondary border border-border/30 text-foreground text-xs font-bold rounded-xl transition-all shadow-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" />
                            ) : null}
                            {isLoading ? 'scanning' : 'track'}
                        </Button>
                    </form>

                    {error && (
                        <div className="text-[10px] text-red-400/80 text-center animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Whale Intel */}
            {whaleInfo && (
                <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between p-3 px-4 bg-secondary/10 border border-border/30 rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-accent/5 text-accent/60">
                                <Target className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">Target</p>
                                <p className="text-xs font-bold text-foreground/80 truncate">{whaleInfo.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Positions Table/Cards */}
            {whaleData && whaleData.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                                active positions ({whaleData.length})
                            </h2>
                        </div>
                        <div className="text-[9px] text-muted-foreground/30 uppercase italic">
                            live update • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {whaleData.map((pos) => {
                            const isProfit = parseFloat(pos.unrealized_pnl) >= 0;
                            return (
                                <Card key={pos.positionId} className="group relative overflow-hidden bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl transition-all hover:border-accent/10">
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-colors ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />

                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden border border-border/10">
                                                    {getTokenLogo(pos.symbol) ? (
                                                        <img
                                                            src={getTokenLogo(pos.symbol)}
                                                            alt={pos.symbol}
                                                            className="w-6 h-6 object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const parent = e.currentTarget.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = `<span class="font-bold text-sm text-muted-foreground">${pos.symbol.split('-')[0].charAt(0)}</span>`;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-sm text-muted-foreground">{pos.symbol.split('-')[0].charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-bold tracking-tight">{pos.symbol}</h3>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${pos.side === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                                                            {pos.side} {pos.leverage}
                                                        </span>
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground/30">#{pos.positionId}</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 px-4 h-8 self-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={pos.history || []}>
                                                        <defs>
                                                            <linearGradient id={`pnlGradient-${pos.positionId}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={isProfit ? '#4ade80' : '#f87171'} stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor={isProfit ? '#4ade80' : '#f87171'} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="pnl"
                                                            stroke={isProfit ? '#4ade80' : '#f87171'}
                                                            strokeWidth={1.5}
                                                            fillOpacity={1}
                                                            fill={`url(#pnlGradient-${pos.positionId})`}
                                                            isAnimationActive={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-bold tracking-tighter ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isProfit ? '+' : ''}{formatCurrency(pos.unrealized_pnl)}
                                                </p>
                                                <p className="text-[8px] text-muted-foreground/40 uppercase font-bold tracking-widest mt-0.5">unrealized pnl</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { label: 'entry', val: formatCurrency(pos.entry_price) },
                                                { label: 'size', val: `${pos.size}` },
                                                { label: 'margin', val: formatCurrency(pos.margin_allocated), color: 'text-orange-400/80' },
                                                { label: 'liq. price', val: formatCurrency(pos.liquidation_price), color: 'text-red-500/80' }
                                            ].map((stat, i) => (
                                                <div key={i} className="p-2.5 rounded-2xl bg-secondary/10 border border-border/5">
                                                    <p className="text-[7px] text-muted-foreground/40 uppercase font-bold mb-0.5">{stat.label}</p>
                                                    <p className={`text-[10px] font-bold truncate ${stat.color || ''}`}>{stat.val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-2.5 rounded-2xl border border-green-500/10 bg-green-500/[0.02]">
                                                    <p className="text-[6px] text-green-500/40 uppercase font-bold mb-1">take profit</p>
                                                    <p className="text-[10px] font-bold">{pos.tp === "None" ? 'none' : formatCurrency(pos.tp)}</p>
                                                </div>
                                                <div className="p-2.5 rounded-2xl border border-red-500/10 bg-red-500/[0.02]">
                                                    <p className="text-[6px] text-red-500/40 uppercase font-bold mb-1">stop loss</p>
                                                    <p className="text-[10px] font-bold">{pos.sl === "None" ? 'none' : formatCurrency(pos.sl)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-between text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest border-t border-border/5">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1.5"><Clock className="w-2.5 h-2.5" /> {formatTime(pos.opened_at).split(',')[1]}</span>
                                                <span className="opacity-50">fees: {formatCurrency(pos.fees_paid)}</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-secondary/20">{pos.margin_type}</span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : whaleData && whaleData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-secondary/5 rounded-3xl border border-dashed border-border/10">
                    <TrendingDown className="w-6 h-6 text-muted-foreground/10 mb-4" />
                    <h3 className="text-xs font-bold text-muted-foreground/20 lowercase italic">ocean is quiet...</h3>
                </div>
            ) : null}

        </div>
    );
}
