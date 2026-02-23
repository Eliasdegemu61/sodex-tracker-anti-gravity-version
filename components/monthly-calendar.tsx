'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePortfolio } from '@/context/portfolio-context';

interface DayTrades {
  date: Date;
  pnl: number;
  trades: any[];
}

export function MonthlyCalendar() {
  const { positions } = usePortfolio();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dayData = useMemo(() => {
    if (!positions || positions.length === 0) {
      return new Map<string, DayTrades>();
    }

    const dateMap = new Map<string, DayTrades>();

    positions.forEach((position) => {
      let posDate: Date;
      if (typeof position.created_at === 'number') {
        posDate = new Date(position.created_at);
      } else {
        posDate = new Date(position.created_at);
      }

      // Use local date string to avoid timezone offset issues
      const year = posDate.getFullYear();
      const month = String(posDate.getMonth() + 1).padStart(2, '0');
      const day = String(posDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const existing = dateMap.get(dateKey);
      const pnl = position.realizedPnlValue || 0;

      if (existing) {
        existing.pnl += pnl;
        existing.trades.push(position);
      } else {
        dateMap.set(dateKey, {
          date: posDate,
          pnl,
          trades: [position],
        });
      }
    });

    return dateMap;
  }, [positions]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
    setIsModalOpen(false);
  };

  const getDayPnL = (date: Date | null) => {
    if (!date) return null;
    // Use local date string to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return dayData.get(dateKey);
  };

  const getBackgroundColor = (pnl: number | null) => {
    if (pnl === null || pnl === 0) {
      return 'bg-secondary/30 border border-border/50 hover:bg-secondary/50';
    }
    if (pnl > 0) {
      return 'bg-emerald-900/40 border border-emerald-700/50 hover:bg-emerald-900/60';
    } else {
      return 'bg-red-900/40 border border-red-700/50 hover:bg-red-900/60';
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const selectedDayTrades = selectedDate ? getDayPnL(selectedDate) : null;

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDaysFull = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let totalPnL = 0;
    let totalTrades = 0;
    let winningDays = 0;
    let losingDays = 0;

    dayData.forEach((dayTrades) => {
      const dayYear = dayTrades.date.getFullYear();
      const dayMonth = dayTrades.date.getMonth();

      if (dayYear === year && dayMonth === month) {
        totalPnL += dayTrades.pnl;
        totalTrades += dayTrades.trades.length;
        if (dayTrades.pnl > 0) winningDays++;
        if (dayTrades.pnl < 0) losingDays++;
      }
    });

    return { totalPnL, totalTrades, winningDays, losingDays };
  }, [dayData, currentDate]);

  return (
    <>
      {/* Calendar Card - Compact Layout */}
      <Card className="p-5 bg-card/20 backdrop-blur-xl border border-border/20 rounded-3xl shadow-sm">
        {/* Header with Month/Year and Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic">{monthYear}</h3>
          <div className="flex gap-2">
            <Button
              onClick={previousMonth}
              variant="outline"
              className="h-7 w-7 p-0 bg-secondary/10 border-border/10 rounded-lg hover:bg-accent/10 hover:text-accent transition-all"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              onClick={nextMonth}
              variant="outline"
              className="h-7 w-7 p-0 bg-secondary/10 border-border/10 rounded-lg hover:bg-accent/10 hover:text-accent transition-all"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-secondary/5 rounded-2xl border border-border/5">
          <div className="text-center space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Return</p>
            <p className={`text-sm font-bold ${monthStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {monthStats.totalPnL >= 0 ? '+' : ''}${Math.abs(monthStats.totalPnL).toFixed(0)}
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">Volume</p>
            <p className="text-sm font-bold text-foreground/80">{monthStats.totalTrades}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">green</p>
            <p className="text-sm font-bold text-green-400">{monthStats.winningDays}</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[7px] text-muted-foreground/30 font-bold uppercase tracking-widest italic">red</p>
            <p className="text-sm font-bold text-red-400">{monthStats.losingDays}</p>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-3">
          {weekDaysFull.map((day) => (
            <div
              key={day}
              className="text-center text-[8px] font-bold text-muted-foreground/20 tracking-widest uppercase italic"
            >
              {day[0]}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((date, idx) => {
            const dayTrades = getDayPnL(date);
            const hasActivity = dayTrades && dayTrades.pnl !== 0;

            return (
              <button
                key={idx}
                onClick={() => date && handleDayClick(date)}
                disabled={!date}
                className={`
                  relative aspect-square rounded-lg transition-all duration-300 flex flex-col items-center justify-center border
                  ${!date ? 'bg-transparent border-transparent' :
                    hasActivity
                      ? `${dayTrades.pnl > 0 ? 'bg-green-500/10 border-green-500/10 hover:bg-green-500/20' : 'bg-red-500/10 border-red-500/10 hover:bg-red-500/20'} cursor-pointer`
                      : 'bg-secondary/5 border-border/5 hover:border-border/10 cursor-pointer'}
                `}
              >
                {date && (
                  <>
                    <div className={`text-[10px] font-bold leading-none ${hasActivity ? (dayTrades.pnl > 0 ? 'text-green-400' : 'text-red-400') : 'text-muted-foreground/40'}`}>
                      {date.getDate()}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Modal Popup for Trades */}
      {isModalOpen && selectedDayTrades && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 italic mb-2">
                  {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <p className={`text-2xl font-bold tracking-tight ${selectedDayTrades.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedDayTrades.pnl >= 0 ? '+' : ''}${selectedDayTrades.pnl.toFixed(2)}
                </p>
                <p className="text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest mt-1">Daily Realized PnL</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-secondary/10 hover:bg-secondary/20 rounded-2xl transition-all border border-border/10"
              >
                <X className="w-5 h-5 text-muted-foreground/40" />
              </button>
            </div>

            {/* Trades List */}
            <div className="overflow-y-auto flex-1 p-8 space-y-4 custom-scrollbar">
              {selectedDayTrades.trades.map((trade, idx) => (
                <div key={idx} className="group p-5 rounded-3xl bg-secondary/5 border border-border/5 hover:border-accent/10 transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-foreground/80 tracking-tight">{trade.pairName}</span>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold ${trade.realizedPnlValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.realizedPnlValue >= 0 ? '+' : ''}${trade.realizedPnlValue.toFixed(2)}
                      </span>
                      <span className="text-[7px] text-muted-foreground/20 font-bold uppercase tracking-widest">Realized</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic mb-1">Position</span>
                      <span className="text-[11px] font-bold text-foreground/70">{trade.positionSideLabel} {trade.leverage}x</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic mb-1">Entry / Close</span>
                      <span className="text-[11px] font-bold text-foreground/70">${parseFloat(trade.avg_entry_price).toFixed(2)} / ${parseFloat(trade.avg_close_price).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest italic mb-1">Size</span>
                      <span className="text-[11px] font-bold text-foreground/70">{trade.closedSize.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-secondary/[0.02]">
              <Button
                onClick={() => setIsModalOpen(false)}
                className="w-full h-12 bg-secondary/10 border-border/10 rounded-2xl hover:bg-accent/10 hover:text-accent transition-all text-xs font-bold uppercase tracking-widest"
                variant="outline"
              >
                Close Connection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
