'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { Card } from '@/components/ui/card'
import { useAnnouncement } from '@/context/announcement-context'

interface Article {
  id: number
  title: string
  created_at: string
  html_url: string
  body: string
}

// Global cache for announcements
let cachedAnnouncements: Article[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

const AnnouncementItem = memo(function AnnouncementItem({
  article,
  onNavigate,
}: {
  article: Article
  onNavigate: (id: number) => void
}) {
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [])

  return (
    <div
      className="group cursor-pointer p-4 rounded-2xl bg-secondary/5 border border-border/5 hover:bg-orange-500/5 hover:border-orange-500/10 transition-all duration-300"
      onClick={() => onNavigate(article.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(article.id)}
    >
      <p className="text-[11px] font-bold text-foreground/80 group-hover:text-orange-400 line-clamp-2 transition-colors leading-relaxed">
        {article.title}
      </p>
      <p className="text-[9px] text-muted-foreground/30 mt-2 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-orange-400/30" />
        {formatDate(article.created_at)}
      </p>
    </div>
  )
})

export function AnnouncementsPanel() {
  const { setSelectedArticleId } = useAnnouncement()
  const [announcements, setAnnouncements] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(() => {
    const now = Date.now()
    return !(cachedAnnouncements && (now - cacheTimestamp) < CACHE_DURATION)
  })

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const now = Date.now()
        if (cachedAnnouncements && (now - cacheTimestamp) < CACHE_DURATION) {
          console.log('[v0] Using cached announcements from panel')
          setAnnouncements(cachedAnnouncements)
          setIsLoading(false)
          return
        }

        setIsLoading(true)

        const response = await fetch(
          'https://sodex-support.zendesk.com/api/v2/help_center/en-us/articles.json?page=1&per_page=100',
          {
            next: { revalidate: 900 }
          }
        )
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()

        const sorted = (data.articles || []).sort(
          (a: Article, b: Article) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 3)

        cachedAnnouncements = sorted
        cacheTimestamp = now
        setAnnouncements(sorted)
        setIsLoading(false)
      } catch (error) {
        console.error('[v0] Error fetching announcements:', error)
        setAnnouncements([])
        setIsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleNavigate = useCallback((id: number) => {
    setSelectedArticleId(id)
  }, [setSelectedArticleId])

  const announcementItems = useMemo(() => {
    return announcements.map((article) => (
      <AnnouncementItem
        key={article.id}
        article={article}
        onNavigate={handleNavigate}
      />
    ))
  }, [announcements, handleNavigate])

  if (isLoading) {
    return (
      <Card className="p-5 bg-card/95 shadow-sm border border-border/20 rounded-3xl animate-pulse">
        <h3 className="text-xs font-semibold text-muted-foreground/60 mb-4">Scanning Broadcasts</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-secondary/10 rounded-2xl" />
          ))}
        </div>
      </Card>
    )
  }

  if (announcements.length === 0) {
    return (
      <Card className="p-5 bg-card/95 shadow-sm border border-border/20 rounded-3xl shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground/60 mb-4">Latest Announcement</h3>
        <p className="text-[10px] text-muted-foreground/30 font-bold uppercase  text-center py-6">No active transmissions</p>
      </Card>
    )
  }

  return (
    <Card className="p-5 bg-card/95 shadow-sm border border-border/20 rounded-3xl shadow-sm">
      <h3 className="text-xs font-semibold text-muted-foreground/80 dark:text-muted-foreground/60 mb-4">Latest Announcement</h3>
      <div className="space-y-3">
        {announcementItems}
      </div>
    </Card>
  )
}

