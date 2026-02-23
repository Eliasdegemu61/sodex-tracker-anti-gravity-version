'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { usePortfolio } from '@/context/portfolio-context';

interface DayTrades {
  date: Date;
  pnl: number;
  trades: any[];
}

export function MonthlyCalendar() {
  const { positions } = usePortfolio();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dayData = useMemo(() => {
    if (!positions || positions.length === 0) {
      return new Map<string, DayTrades>();
    }
    const dateMap = new Map<string, DayTrades>();
    positions.forEach((position) => {
      const posDate = new Date(position.created_at);
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
        dateMap.set(dateKey, { date: posDate, pnl, trades: [position] });
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
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.unshift({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month filler days
    const totalSlots = days.length > 35 ? 42 : 35;
    let nextDay = 1;
    while (days.length < totalSlots) {
      days.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  const getDayPnL = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return dayData.get(`${year}-${month}-${day}`) || null;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let totalPnL = 0, totalTrades = 0, winDays = 0, loseDays = 0;
    dayData.forEach((d) => {
      if (d.date.getFullYear() === year && d.date.getMonth() === month) {
        totalPnL += d.pnl;
        totalTrades += d.trades.length;
        if (d.pnl > 0) winDays++;
        if (d.pnl < 0) loseDays++;
      }
    });
    return { totalPnL, totalTrades, winDays, loseDays };
  }, [dayData, currentDate]);

  return (
    <div className="w-full space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Net Return', value: `${monthStats.totalPnL >= 0 ? '+' : ''}$${Math.abs(monthStats.totalPnL).toFixed(0)}`, color: monthStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Trades', value: monthStats.totalTrades, color: 'text-white/80' },
          { label: 'Green Days', value: monthStats.winDays, color: 'text-green-400' },
          { label: 'Red Days', value: monthStats.loseDays, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card/20 backdrop-blur-xl border border-border/20 rounded-2xl p-4 flex flex-col items-center gap-1">
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{stat.label}</span>
            <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <Card className="p-4 sm:p-6 bg-[#111111] border border-white/[0.06] rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Navigation */}
        <div className="flex items-center justify-center gap-5 mb-6">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()))} className="text-white/30 hover:text-white transition-colors font-bold text-sm leading-none">&lt;&lt;</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="text-white/30 hover:text-white transition-colors font-bold text-sm leading-none">&lt;</button>
          <h3 className="text-sm sm:text-base font-bold text-white/90 tracking-wide select-none min-w-[160px] text-center">{monthYear}</h3>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="text-white/30 hover:text-white transition-colors font-bold text-sm leading-none">&gt;</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()))} className="text-white/30 hover:text-white transition-colors font-bold text-sm leading-none">&gt;&gt;</button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[8px] sm:text-[10px] font-bold text-white/50 tracking-widest py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((dayObj, idx) => {
            const { date, isCurrentMonth } = dayObj;
            const dayTrades = isCurrentMonth ? getDayPnL(date) : null;
            const hasActivity = !!dayTrades && dayTrades.pnl !== 0;
            const isPositive = hasActivity && (dayTrades?.pnl ?? 0) > 0;

            const now = new Date();
            const isToday =
              isCurrentMonth &&
              date.getDate() === now.getDate() &&
              date.getMonth() === now.getMonth() &&
              date.getFullYear() === now.getFullYear();

            let cellBg = '';
            let numColor = '';

            if (!isCurrentMonth) {
              cellBg = 'bg-[#0c0c0c] opacity-40';
              numColor = 'text-white/20';
            } else if (hasActivity) {
              cellBg = isPositive
                ? 'bg-[#0d2b16] border border-green-700/50 hover:border-green-600/70'
                : 'bg-[#2b0d0d] border border-red-700/50 hover:border-red-600/70';
              numColor = 'text-white/80';
            } else if (isToday) {
              cellBg = 'bg-[#1c1c1c] border border-white/20';
              numColor = 'text-white/90';
            } else {
              cellBg = 'bg-[#191919] border border-transparent hover:bg-[#212121]';
              numColor = 'text-white/40';
            }

            return (
              <div
                key={idx}
                className={`relative rounded-xl sm:rounded-2xl transition-all duration-200 flex flex-col justify-between p-2 sm:p-3 
                  aspect-[3/2.4] sm:aspect-[3/2.2]
                  ${cellBg} ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Day number — top left */}
                <span className={`text-[9px] sm:text-[12px] font-semibold leading-none ${numColor}`}>
                  {date.getDate()}
                </span>

                {/* PnL info — bottom right */}
                {hasActivity && isCurrentMonth && dayTrades && (
                  <div className="flex flex-col items-end text-right mt-auto gap-0.5">
                    <span className={`text-[7px] sm:text-[9px] font-bold leading-tight ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '' : '-'}${Math.abs(dayTrades.pnl).toFixed(2)} P&L
                    </span>
                    <span className="text-[6px] sm:text-[8px] text-white/30 font-semibold leading-tight">
                      {dayTrades.trades.length} Trade{dayTrades.trades.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
