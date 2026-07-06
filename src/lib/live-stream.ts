import { prisma } from '@/lib/prisma'

export type LiveStatus = {
  isLive: boolean
  videoId: string | null
  title: string | null
  thumbnail: string | null
  startedAt: string | null
  source: 'youtube' | 'manual' | null
}

const NOT_LIVE: LiveStatus = {
  isLive: false,
  videoId: null,
  title: null,
  thumbnail: null,
  startedAt: null,
  source: null,
}

export function extractYouTubeId(url: string): string | null {
  if (!url?.trim()) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  const m = url.match(/(?:youtube\.com\/live\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// search.list costs 100 quota units/call — cached 10 minutes server-side to stay close
// to the 10,000/day free quota (~144 calls/day = 14,400 units) while keeping detection timely.
async function getYouTubeApiLiveStatus(): Promise<LiveStatus | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID
  if (!apiKey || !channelId) return null

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`,
      { next: { revalidate: 600 } }
    )
    if (!response.ok) return null
    const data = await response.json()
    const liveVideo = data.items?.[0]
    if (!liveVideo) return NOT_LIVE

    return {
      isLive: true,
      videoId: liveVideo.id.videoId,
      title: liveVideo.snippet.title,
      thumbnail: liveVideo.snippet.thumbnails?.high?.url || liveVideo.snippet.thumbnails?.default?.url || null,
      startedAt: liveVideo.snippet.publishedAt,
      source: 'youtube',
    }
  } catch {
    return null
  }
}

async function getManualLiveStatus(): Promise<LiveStatus> {
  try {
    const [activeSetting, urlSetting, titleSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'live_stream_active' } }),
      prisma.setting.findUnique({ where: { key: 'live_stream_url' } }),
      prisma.setting.findUnique({ where: { key: 'live_stream_title' } }),
    ])
    const videoId = extractYouTubeId(urlSetting?.value || '')
    if (activeSetting?.value === 'true' && videoId) {
      return {
        isLive: true,
        videoId,
        title: titleSetting?.value || 'Sfânta Liturghie Live',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        startedAt: null,
        source: 'manual',
      }
    }
  } catch { /* DB unavailable */ }
  return NOT_LIVE
}

// Auto-detection (YouTube API) is the primary source; falls back to the admin's
// manual toggle when the API finds nothing live or is unavailable (quota, missing key, etc).
export async function getCombinedLiveStatus(): Promise<LiveStatus> {
  const ytStatus = await getYouTubeApiLiveStatus()
  if (ytStatus?.isLive) return ytStatus
  return getManualLiveStatus()
}

export type ArchivedLive = {
  videoId: string
  title: string
  archivedAt: string | null
}

export async function getLastArchivedLive(): Promise<ArchivedLive | null> {
  try {
    const video = await prisma.video.findFirst({
      where: { isLive: true },
      orderBy: { archivedAt: 'desc' },
      select: { videoId: true, title: true, archivedAt: true },
    })
    if (!video) return null
    return {
      videoId: video.videoId,
      title: video.title,
      archivedAt: video.archivedAt ? video.archivedAt.toISOString() : null,
    }
  } catch {
    return null
  }
}
