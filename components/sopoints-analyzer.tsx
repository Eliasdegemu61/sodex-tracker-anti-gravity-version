'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Calendar as CalendarIcon, AlertCircle, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatNumber } from '@/lib/format-number';

interface UserVolumeData {
  userId: string;
  address: string;
  futuresVolGained: number;
  spotVolGained: number;
  totalVolGained: number;
}

interface AnalysisState {
  hasFuturesData: boolean;
  hasSpotData: boolean;
}

export function SopointsAnalyzer() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UserVolumeData[]>([]);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'futures' | 'spot'>('total');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ hasFuturesData: false, hasSpotData: false });
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const validateDateRange = (start: string, end: string): boolean => {
    const startD = new Date(start);
    const endD = new Date(end);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleAnalyze = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }

    if (!validateDateRange(startDate, endDate)) {
      setError('Date range must not exceed 7 days');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    setAnalysisState({ hasFuturesData: true, hasSpotData: true });

    try {
      const startD = new Date(startDate);
      const endD = new Date(endDate);

      // Generate all dates in the range
      const allDates: string[] = [];
      const currentDate = new Date(startD);
      while (currentDate <= endD) {
        allDates.push(getDateString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('[v0] Analyzing dates:', allDates);

      // Fetch futures data for all dates
      let futuresDataByDate: Record<string, any[]> = {};
      let hasFuturesData = false;

      for (const date of allDates) {
        try {
          const url = `https://raw.githubusercontent.com/Eliasdegemu61/Sodex-Tracker-new-v1/main/history/daily/${date}.json`;
          const res = await fetch(url);
          if (res.ok) {
            futuresDataByDate[date] = await res.json();
            hasFuturesData = true;
          }
        } catch (err) {
          console.log(`[v0] No futures data for ${date}`);
        }
      }

      // Fetch spot data for all dates
      let spotDataByDate: Record<string, Record<string, { total_volume: number }>> = {};
      let hasSpotData = false;

      for (const date of allDates) {
        try {
          const url = `https://raw.githubusercontent.com/Eliasdegemu61/sodex-spot-volume-data/refs/heads/main/daily_stats/${date}.json`;
          const res = await fetch(url);
          if (res.ok) {
            spotDataByDate[date] = await res.json();
            hasSpotData = true;
          }
        } catch (err) {
          console.log(`[v0] No spot data for ${date}`);
        }
      }

      setAnalysisState({ hasFuturesData, hasSpotData });

      if (!hasFuturesData && !hasSpotData) {
        setError('No data available for selected date range');
        setIsLoading(false);
        return;
      }

      const usersMap = new Map<string, UserVolumeData>();

      // Track first and last appearance of each user across all dates
      const userFirstLast = new Map<string, { firstFuturesDate: string | null; lastFuturesDate: string | null; firstSpotDate: string | null; lastSpotDate: string | null }>();

      // First pass: identify first and last dates for each user in each market
      if (hasFuturesData) {
        Object.entries(futuresDataByDate).forEach(([date, data]: [string, any]) => {
          data.forEach((entry: any) => {
            if (!userFirstLast.has(entry.address)) {
              userFirstLast.set(entry.address, { firstFuturesDate: null, lastFuturesDate: null, firstSpotDate: null, lastSpotDate: null });
            }
            const user = userFirstLast.get(entry.address)!;
            if (!user.firstFuturesDate) user.firstFuturesDate = date;
            user.lastFuturesDate = date;
          });
        });
      }

      if (hasSpotData) {
        Object.entries(spotDataByDate).forEach(([date, data]: [string, any]) => {
          Object.keys(data).forEach((address: string) => {
            if (!userFirstLast.has(address)) {
              userFirstLast.set(address, { firstFuturesDate: null, lastFuturesDate: null, firstSpotDate: null, lastSpotDate: null });
            }
            const user = userFirstLast.get(address)!;
            if (!user.firstSpotDate) user.firstSpotDate = date;
            user.lastSpotDate = date;
          });
        });
      }

      // Second pass: calculate volume from first to last date for each user
      userFirstLast.forEach((dateRange, address) => {
        let futuresVolGained = 0;
        let spotVolGained = 0;

        // Calculate futures volume from first to last futures date
        if (dateRange.firstFuturesDate && dateRange.lastFuturesDate && hasFuturesData) {
          const firstData = futuresDataByDate[dateRange.firstFuturesDate];
          const lastData = futuresDataByDate[dateRange.lastFuturesDate];

          const firstEntry = firstData.find((e: any) => e.address === address);
          const lastEntry = lastData.find((e: any) => e.address === address);

          if (firstEntry && lastEntry) {
            const startVol = parseFloat(firstEntry.vol) || 0;
            const endVol = parseFloat(lastEntry.vol) || 0;
            futuresVolGained = Math.max(0, endVol - startVol);
          }
        }

        // Calculate spot volume from first to last spot date
        if (dateRange.firstSpotDate && dateRange.lastSpotDate && hasSpotData) {
          const firstData = spotDataByDate[dateRange.firstSpotDate];
          const lastData = spotDataByDate[dateRange.lastSpotDate];

          if (firstData[address] && lastData[address]) {
            const startVol = firstData[address].total_volume || 0;
            const endVol = lastData[address].total_volume || 0;
            spotVolGained = Math.max(0, endVol - startVol);
          }
        }

        const totalVolGained = futuresVolGained + spotVolGained;

        if (totalVolGained > 0) {
          usersMap.set(address, {
            userId: '',
            address,
            futuresVolGained,
            spotVolGained,
            totalVolGained,
          });
        }
      });

      // Yield to browser after computation
      await new Promise(resolve => setTimeout(resolve, 0));

      const resultsArray = Array.from(usersMap.values());

      if (resultsArray.length === 0) {
        setError('No trading volume detected across all date combinations in the selected range');
        setIsLoading(false);
        return;
      }

      // Sort by selected criteria
      const sorted = [...resultsArray].sort((a, b) => {
        if (sortBy === 'total') return b.totalVolGained - a.totalVolGained;
        if (sortBy === 'futures') return b.futuresVolGained - a.futuresVolGained;
        return b.spotVolGained - a.spotVolGained;
      });

      setResults(sorted);
    } catch (err) {
      console.error('[v0] Sopoints analysis error:', err);
      setError('Failed to analyze data. Please try again.');
    } finally {
      setIsLoading(false);
      setCurrentPage(1);
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'total') return b.totalVolGained - a.totalVolGained;
    if (sortBy === 'futures') return b.futuresVolGained - a.futuresVolGained;
    return b.spotVolGained - a.spotVolGained;
  });

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card border border-border">
        <h3 className="text-lg font-semibold mb-6">Volume Analysis (Max 7 Days)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal bg-transparent hover:bg-accent/5 border h-10 px-3 py-2 text-foreground transition-all ${
                    startDate 
                      ? 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500' 
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className={`flex-1 ${startDate ? 'text-orange-500 font-semibold' : ''}`}>
                    {startDate ? new Date(startDate).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Select date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-border">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = date.toLocaleDateString('en-CA');
                      setStartDate(dateStr);
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date > today;
                  }}
                  className="border-none"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal bg-transparent hover:bg-accent/5 border h-10 px-3 py-2 text-foreground transition-all ${
                    endDate 
                      ? 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500' 
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className={`flex-1 ${endDate ? 'text-orange-500 font-semibold' : ''}`}>
                    {endDate ? new Date(endDate).toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Select date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border border-border">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate + 'T00:00:00') : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = date.toLocaleDateString('en-CA');
                      setEndDate(dateStr);
                    }
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date > today;
                  }}
                  className="border-none"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={isLoading || !startDate || !endDate}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? 'Analyzing...' : 'Analyze Volume'}
        </Button>

        {isLoading && (
          <Card className="p-4 mt-6 bg-orange-500/10 border border-orange-500/50">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-sm text-orange-600">Analyzing data across all date combinations... This may take a moment.</span>
            </div>
          </Card>
        )}
      </Card>

      {results.length > 0 && (
        <Card className="p-6 bg-card border border-border">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold">Results</h3>
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-10 border-border/50"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Sort by Total</SelectItem>
                <SelectItem value="futures">Sort by Futures</SelectItem>
                <SelectItem value="spot">Sort by Spot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-600">
              <span className="font-semibold">Note:</span> Estimated SO Points is a fun calculation based on volume proportion and should not be considered 100% accurate. This is for estimation purposes only.
            </p>
          </div>

          {!analysisState.hasFuturesData && analysisState.hasSpotData && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-600">
                <span className="font-semibold">Spot Only:</span> Data is only available from Spot markets for the selected date range.
              </p>
            </div>
          )}

          {analysisState.hasFuturesData && !analysisState.hasSpotData && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-amber-600">
                <span className="font-semibold">Futures Only:</span> Data is only available from Futures markets for the selected date range.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Rank</TableHead>
                  <TableHead>Address</TableHead>
                  {analysisState.hasFuturesData && (
                    <TableHead className="text-right">Futures Vol Gained</TableHead>
                  )}
                  {analysisState.hasSpotData && (
                    <TableHead className="text-right">Spot Vol Gained</TableHead>
                  )}
                  <TableHead className="text-right">Total Vol Gained</TableHead>
                  <TableHead className="text-right">Estimated SO Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const totalVolume = sortedResults.reduce((sum, user) => sum + user.totalVolGained, 0);
                  
                  // Filter results based on search query
                  const filteredResults = sortedResults.filter(user =>
                    user.address.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  const startIdx = (currentPage - 1) * rowsPerPage;
                  const endIdx = startIdx + rowsPerPage;
                  const displayedRows = filteredResults.slice(startIdx, endIdx);
                  
                  // If search has results but none on this page, show a message
                  if (searchQuery && filteredResults.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={analysisState.hasFuturesData && analysisState.hasSpotData ? 7 : 6} className="text-center py-4 text-muted-foreground">
                          No results found for "{searchQuery}"
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return displayedRows.map((user, idx) => {
                    // Calculate weighted volume: futures at 1x, spot at 2x
                    const weightedVolume = user.futuresVolGained + (user.spotVolGained * 2);
                    const totalWeightedVolume = sortedResults.reduce((sum, u) => 
                      sum + u.futuresVolGained + (u.spotVolGained * 2), 0
                    );
                    const estimatedSoPoints = (weightedVolume / totalWeightedVolume) * 1_000_000;
                    return (
                      <TableRow key={user.address} className="border-border/30">
                        <TableCell className="font-medium text-orange-500">#{startIdx + idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-xs text-muted-foreground">{user.address}</TableCell>
                        {analysisState.hasFuturesData && (
                          <TableCell className="text-right text-foreground">{formatNumber(user.futuresVolGained)}</TableCell>
                        )}
                        {analysisState.hasSpotData && (
                          <TableCell className="text-right text-foreground">{formatNumber(user.spotVolGained)}</TableCell>
                        )}
                        <TableCell className="text-right font-semibold text-orange-500">{formatNumber(user.totalVolGained)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{formatNumber(estimatedSoPoints)}</TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(v) => {
                setRowsPerPage(parseInt(v));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {(() => {
                  const filteredResults = sortedResults.filter(user =>
                    user.address.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const startIdx = (currentPage - 1) * rowsPerPage;
                  const endIdx = Math.min(currentPage * rowsPerPage, filteredResults.length);
                  const totalCount = filteredResults.length;
                  
                  if (totalCount === 0) return 'No results';
                  return `${startIdx + 1} - ${endIdx} of ${totalCount}`;
                })()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-border/50 text-foreground hover:text-foreground hover:bg-accent/10 dark:hover:text-foreground"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => {
                  const filteredResults = sortedResults.filter(user =>
                    user.address.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const maxPage = Math.ceil(filteredResults.length / rowsPerPage);
                  return Math.min(prev + 1, maxPage);
                })}
                disabled={(() => {
                  const filteredResults = sortedResults.filter(user =>
                    user.address.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  return currentPage >= Math.ceil(filteredResults.length / rowsPerPage);
                })()}
                className="border-border/50 text-foreground hover:text-foreground hover:bg-accent/10 dark:hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
