'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { fetchLeaderboardData, fetchSpotLeaderboardData } from '@/lib/volume-service';

interface RankData {
  perpsVolumeRank: number | null;
  spotVolumeRank: number | null;
  pnlRank: number | null;
  isLoading: boolean;
}

interface RankingCardProps {
  walletAddress?: string | null;
}

export function RankingCard({ walletAddress }: RankingCardProps) {
  const [rankData, setRankData] = useState<RankData>({
    perpsVolumeRank: null,
    spotVolumeRank: null,
    pnlRank: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchRankData = async () => {
      if (!walletAddress) {
        console.log('[v0] No wallet address provided to RankingCard');
        setRankData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        console.log('[v0] RankingCard fetching data for:', walletAddress);
        setRankData(prev => ({ ...prev, isLoading: true }));

        // Fetch both leaderboards
        const [perpsData, spotData] = await Promise.all([
          fetchLeaderboardData(),
          fetchSpotLeaderboardData(),
        ]);

        console.log('[v0] Perps data fetched:', perpsData.length);
        console.log('[v0] Spot data fetched:', spotData.length);

        // Find wallet address in leaderboards
        const walletLower = walletAddress.toLowerCase();

        // Get Perps Volume Rank
        const perpsVolumeRanked = [...perpsData]
          .sort((a, b) => Number(b.vol) - Number(a.vol))
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));
        const perpsVolumeEntry = perpsVolumeRanked.find(
          e => e.address.toLowerCase() === walletLower
        );

        console.log('[v0] Perps volume entry:', perpsVolumeEntry?.rank);

        // Get Perps PnL Rank
        const perpsPnlRanked = [...perpsData]
          .sort((a, b) => Number(b.pnl) - Number(a.pnl))
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));
        const perpsPnlEntry = perpsPnlRanked.find(
          e => e.address.toLowerCase() === walletLower
        );

        console.log('[v0] Perps PnL entry:', perpsPnlEntry?.rank);

        // Get Spot Volume Rank
        const spotVolumeRanked = [...spotData]
          .sort((a, b) => b.vol - a.vol)
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
          }));
        const spotVolumeEntry = spotVolumeRanked.find(
          e => e.address.toLowerCase() === walletLower
        );

        console.log('[v0] Spot volume entry:', spotVolumeEntry?.rank);

        setRankData({
          perpsVolumeRank: perpsVolumeEntry?.rank || null,
          spotVolumeRank: spotVolumeEntry?.rank || null,
          pnlRank: perpsPnlEntry?.rank || null,
          isLoading: false,
        });
      } catch (error) {
        console.error('[v0] Error fetching rank data:', error);
        setRankData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchRankData();
  }, [walletAddress]);

  const getRankColor = (rank: number | null) => {
    if (rank === null) return 'text-muted-foreground';
    if (rank <= 10) return 'text-yellow-400';
    if (rank <= 50) return 'text-emerald-400';
    if (rank <= 100) return 'text-blue-400';
    return 'text-muted-foreground';
  };

  const RankBadge = ({ label, rank }: { label: string; rank: number | null }) => (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-secondary/10 border border-border/5 hover:border-accent/10 transition-all group">
      <p className="text-[8px] text-muted-foreground/30 font-bold  mb-3 text-center  group-hover:text-muted-foreground/50 transition-colors">{label}</p>
      {rankData.isLoading ? (
        <div className="h-8 w-12 bg-secondary/20 rounded-lg animate-pulse" />
      ) : rank !== null ? (
        <div className="relative">
          <div className={`absolute inset-0 blur-lg opacity-20 ${getRankColor(rank).replace('text-', 'bg-')}`} />
          <p className={`relative text-2xl font-bold tracking-tighter ${getRankColor(rank)}`}>
            <span className="text-sm opacity-30 mr-0.5">#</span>{rank}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/20 font-bold  ">unranked</p>
      )}
    </div>
  );

  return (
    <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
      <h3 className="text-xs font-semibold text-muted-foreground/60 mb-6">World Rankings</h3>
      <div className="grid grid-cols-3 gap-3">
        <RankBadge label="Perps Vol" rank={rankData.perpsVolumeRank} />
        <RankBadge label="Spot Vol" rank={rankData.spotVolumeRank} />
        <RankBadge label="Yield pnl" rank={rankData.pnlRank} />
      </div>
    </Card>
  );
}

