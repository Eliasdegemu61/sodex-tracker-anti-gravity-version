import { Card } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-48 bg-card/50 rounded animate-pulse" />
          <div className="h-10 w-32 bg-card/50 rounded animate-pulse" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="p-4 md:p-6 space-y-6">
        {/* Tab skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-card/50 rounded animate-pulse" />
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 bg-card/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
