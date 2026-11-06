import process from 'node:process';

/**
 * Public YouTube feed for the Lin Go channel.
 *
 * The app opens the Reels viewer and reads this endpoint so a newly published
 * Short appears without shipping a new APK. The control panel uses the same
 * payload to show subscribers, views and the latest uploads.
 *
 * Prefer a YouTube Data API key (YOUTUBE_API_KEY) for exact statistics. When
 * the key is absent we fall back to the public channel pages, which keeps the
 * feature working with zero configuration.
 */

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

interface YoutubeVideo {
  id: string;
  title: string;
  type: 'short' | 'video';
  views: number | null;
  viewsText: string;
  published: string;
  thumbnail: string;
  fallbackThumbnail: string;
  url: string;
  embedUrl: string;
}

interface YoutubeStats {
  channelId: string;
  handle: string;
  title: string;
  subscribers: number | null;
  subscribersText: string;
  videoCount: number | null;
  videoCountText: string;
  totalViews: number | null;
  totalViewsText: string;
  source: 'api' | 'scrape';
  updatedAt: string;
}

interface YoutubePayload {
  channel: YoutubeStats;
  videos: YoutubeVideo[];
  shorts: YoutubeVideo[];
  channelUrl: string;
  subscribeUrl: string;
}

const DEFAULT_CHANNEL_ID = 'UCIbTUbYh4nkiVHqHbz6KKzg';
const HANDLE = (process.env.YOUTUBE_CHANNEL_HANDLE || 'lingogold')
  .trim()
  .replace(/^@/, '') || 'lingogold';
const CHANNEL_ID = (process.env.YOUTUBE_CHANNEL_ID || DEFAULT_CHANNEL_ID).trim();
const API_KEY = (process.env.YOUTUBE_API_KEY || '').trim();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_VIDEOS = 24;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const channelUrl = `https://www.youtube.com/@${HANDLE}`;
const subscribeUrl = `https://www.youtube.com/@${HANDLE}?sub_confirmation=1`;

const queryValue = (query: ApiRequest['query'], name: string): string => {
  const value = query?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const parseCount = (text: string): number | null => {
  if (!text) return null;
  const cleaned = String(text).replace(/\u00a0/g, ' ').replace(/,/g, '');
  const match = /([\d.]+)\s*([KMB])?/i.exec(cleaned);
  if (!match) return null;
  let value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') value *= 1e3;
  if (suffix === 'M') value *= 1e6;
  if (suffix === 'B') value *= 1e9;
  return Math.round(value);
};

const formatCount = (value: number | null, singular: string, plural: string): string => {
  if (value === null) return '';
  return `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`;
};

const extractInitialData = (html: string): Record<string, unknown> | null => {
  const patterns = [
    /var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
    /ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (!match) continue;
    try {
      return JSON.parse(match[1]) as Record<string, unknown>;
    } catch {
      // Try the next pattern.
    }
  }
  return null;
};

const walk = (node: unknown, visit: (value: Record<string, unknown>) => void): void => {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  const record = node as Record<string, unknown>;
  visit(record);
  for (const key of Object.keys(record)) walk(record[key], visit);
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'en-US,en;q=0.9',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`YouTube ${response.status} for ${url}`);
  return response.text();
};

const thumbnailFor = (id: string, type: 'short' | 'video'): string =>
  type === 'short'
    ? `https://i.ytimg.com/vi/${id}/oar2.jpg`
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const fallbackThumbnailFor = (id: string): string =>
  `https://i.ytimg.com/vi/${id}/frame0.jpg`;

const embedFor = (id: string): string =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1`;

const videoUrlFor = (id: string, type: 'short' | 'video'): string =>
  type === 'short'
    ? `https://www.youtube.com/shorts/${id}`
    : `https://www.youtube.com/watch?v=${id}`;

const makeVideo = (
  id: string,
  title: string,
  type: 'short' | 'video',
  viewsText: string,
  published = '',
): YoutubeVideo => ({
  id,
  title: title.trim() || 'مقطع من قناة Lin Go',
  type,
  views: parseCount(viewsText),
  viewsText: viewsText.trim(),
  published: published.trim(),
  thumbnail: thumbnailFor(id, type),
  fallbackThumbnail: fallbackThumbnailFor(id),
  url: videoUrlFor(id, type),
  embedUrl: embedFor(id),
});

const parseShorts = (data: Record<string, unknown> | null): YoutubeVideo[] => {
  const items = new Map<string, YoutubeVideo>();
  walk(data, (node) => {
    const view = node.shortsLockupViewModel as Record<string, unknown> | undefined;
    if (!view) return;
    const entityId = typeof view.entityId === 'string' ? view.entityId : '';
    const reel = view.onTap as Record<string, unknown> | undefined;
    const command = reel?.innertubeCommand as Record<string, unknown> | undefined;
    const watch = command?.reelWatchEndpoint as Record<string, unknown> | undefined;
    const id =
      (typeof watch?.videoId === 'string' ? watch.videoId : '') ||
      entityId.replace(/^shorts-shelf-item-/, '');
    if (!/^[\w-]{11}$/.test(id)) return;
    const overlay = view.overlayMetadata as Record<string, unknown> | undefined;
    const primary = overlay?.primaryText as Record<string, unknown> | undefined;
    const secondary = overlay?.secondaryText as Record<string, unknown> | undefined;
    const accessibility = typeof view.accessibilityText === 'string' ? view.accessibilityText : '';
    const title =
      (typeof primary?.content === 'string' ? primary.content : '') ||
      accessibility.replace(/,\s*[\d.,]+\s*[KMB]?\s+views?.*$/i, '').replace(/^.*?:\s*/, '') ||
      accessibility;
    const viewsText =
      (typeof secondary?.content === 'string' ? secondary.content : '') ||
      (/[\d.,]+\s*[KMB]?\s+views?/i.exec(accessibility)?.[0] ?? '');
    if (!items.has(id)) items.set(id, makeVideo(id, title, 'short', viewsText));
  });
  return [...items.values()];
};

const parseVideos = (data: Record<string, unknown> | null): YoutubeVideo[] => {
  const items = new Map<string, YoutubeVideo>();
  walk(data, (node) => {
    const renderer =
      (node.videoRenderer as Record<string, unknown> | undefined) ||
      (node.gridVideoRenderer as Record<string, unknown> | undefined) ||
      (node.richItemRenderer as Record<string, unknown> | undefined);
    if (!renderer) return;
    const candidate =
      (renderer.videoRenderer as Record<string, unknown> | undefined) ||
      (renderer.content as Record<string, unknown> | undefined)?.videoRenderer as
        | Record<string, unknown>
        | undefined ||
      renderer;
    const id = typeof candidate.videoId === 'string' ? candidate.videoId : '';
    if (!/^[\w-]{11}$/.test(id)) return;
    const title = candidate.title as Record<string, unknown> | undefined;
    const runs = Array.isArray(title?.runs) ? (title.runs as Array<Record<string, unknown>>) : [];
    const titleText =
      (typeof runs[0]?.text === 'string' ? runs[0].text : '') ||
      (typeof title?.simpleText === 'string' ? title.simpleText : '');
    const viewCount = candidate.viewCountText as Record<string, unknown> | undefined;
    const shortViewCount = candidate.shortViewCountText as Record<string, unknown> | undefined;
    const viewsText =
      (typeof viewCount?.simpleText === 'string' ? viewCount.simpleText : '') ||
      (typeof shortViewCount?.simpleText === 'string' ? shortViewCount.simpleText : '');
    const published = candidate.publishedTimeText as Record<string, unknown> | undefined;
    const publishedText = typeof published?.simpleText === 'string' ? published.simpleText : '';
    if (!items.has(id)) items.set(id, makeVideo(id, titleText, 'video', viewsText, publishedText));
  });
  return [...items.values()];
};

const parseAbout = (html: string): {
  title: string;
  subscribersText: string;
  videoCountText: string;
} => {
  let title = '';
  let subscribersText = '';
  let videoCountText = '';
  const ogTitle = /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i.exec(html);
  if (ogTitle) title = ogTitle[1];
  const data = extractInitialData(html);
  walk(data, (node) => {
    const about = node.aboutChannelViewModel as Record<string, unknown> | undefined;
    if (about) {
      if (typeof about.subscriberCountText === 'string' && !subscribersText) {
        subscribersText = about.subscriberCountText;
      }
      if (typeof about.videoCountText === 'string' && !videoCountText) {
        videoCountText = about.videoCountText;
      }
    }
    const header = node.pageHeaderViewModel as Record<string, unknown> | undefined;
    const metadata = header?.metadata as Record<string, unknown> | undefined;
    const rows = Array.isArray(metadata?.metadataRows)
      ? (metadata.metadataRows as Array<Record<string, unknown>>)
      : [];
    for (const row of rows) {
      const parts = Array.isArray(row.metadataParts)
        ? (row.metadataParts as Array<Record<string, unknown>>)
        : [];
      for (const part of parts) {
        const text = part.text as Record<string, unknown> | undefined;
        const content = typeof text?.content === 'string' ? text.content : '';
        if (!content) continue;
        if (!subscribersText && /subscriber/i.test(content)) subscribersText = content;
        if (!videoCountText && /video|فيديو/i.test(content)) videoCountText = content;
      }
    }
  });
  if (!title) {
    const channelTitle = /<title>([^<]+)<\/title>/i.exec(html);
    if (channelTitle) title = channelTitle[1].replace(/\s*-\s*YouTube\s*$/i, '');
  }
  return { title, subscribersText, videoCountText };
};

const scrape = async (): Promise<YoutubePayload> => {
  const [shortsResult, videosResult, aboutResult] = await Promise.allSettled([
    fetchText(`https://www.youtube.com/@${HANDLE}/shorts?hl=en`),
    fetchText(`https://www.youtube.com/@${HANDLE}/videos?hl=en`),
    fetchText(`https://www.youtube.com/@${HANDLE}/about?hl=en`),
  ]);
  const shortsHtml = shortsResult.status === 'fulfilled' ? shortsResult.value : '';
  const videosHtml = videosResult.status === 'fulfilled' ? videosResult.value : '';
  const aboutHtml = aboutResult.status === 'fulfilled' ? aboutResult.value : '';
  if (!shortsHtml && !videosHtml && !aboutHtml) {
    throw new Error('تعذر الوصول إلى صفحات قناة يوتيوب.');
  }
  const shorts = parseShorts(extractInitialData(shortsHtml)).slice(0, MAX_VIDEOS);
  const videos = parseVideos(extractInitialData(videosHtml)).slice(0, MAX_VIDEOS);
  const about = parseAbout(aboutHtml);
  const seen = new Set(shorts.map((item) => item.id));
  const combined = [...shorts, ...videos.filter((item) => !seen.has(item.id))];
  const subscribers = parseCount(about.subscribersText);
  const videoCount = parseCount(about.videoCountText);
  const totalViews = combined.reduce((sum, item) => sum + (item.views ?? 0), 0);
  return {
    channel: {
      channelId: CHANNEL_ID,
      handle: `@${HANDLE}`,
      title: about.title || 'Lin Go',
      subscribers,
      subscribersText: about.subscribersText || formatCount(subscribers, 'subscriber', 'subscribers'),
      videoCount,
      videoCountText: about.videoCountText || formatCount(videoCount, 'video', 'videos'),
      totalViews: totalViews > 0 ? totalViews : null,
      totalViewsText: totalViews > 0 ? formatCount(totalViews, 'view', 'views') : '',
      source: 'scrape',
      updatedAt: new Date().toISOString(),
    },
    videos: combined.filter((item) => item.type === 'video'),
    shorts: combined.filter((item) => item.type === 'short'),
    channelUrl,
    subscribeUrl,
  };
};

const fetchApi = async (): Promise<YoutubePayload> => {
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(CHANNEL_ID)}&key=${encodeURIComponent(API_KEY)}`,
    { cache: 'no-store', signal: AbortSignal.timeout(8000) },
  );
  if (!channelResponse.ok) throw new Error(`YouTube Data API ${channelResponse.status}`);
  const channelPayload = (await channelResponse.json()) as {
    items?: Array<{
      snippet?: { title?: string };
      statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
    }>;
  };
  const channel = channelPayload.items?.[0];
  const uploads = CHANNEL_ID.startsWith('UC') ? `UU${CHANNEL_ID.slice(2)}` : CHANNEL_ID;
  const playlistResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploads)}&maxResults=${MAX_VIDEOS}&key=${encodeURIComponent(API_KEY)}`,
    { cache: 'no-store', signal: AbortSignal.timeout(8000) },
  );
  if (!playlistResponse.ok) throw new Error(`YouTube Data API ${playlistResponse.status}`);
  const playlistPayload = (await playlistResponse.json()) as {
    items?: Array<{
      snippet?: { title?: string; publishedAt?: string };
      contentDetails?: { videoId?: string };
    }>;
  };
  const entries = (playlistPayload.items ?? [])
    .map((item) => ({
      id: item.contentDetails?.videoId ?? '',
      title: item.snippet?.title ?? '',
      published: item.snippet?.publishedAt ?? '',
    }))
    .filter((item) => /^[\w-]{11}$/.test(item.id));
  const detailsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${entries.map((item) => item.id).join(',')}&key=${encodeURIComponent(API_KEY)}`,
    { cache: 'no-store', signal: AbortSignal.timeout(8000) },
  );
  if (!detailsResponse.ok) throw new Error(`YouTube Data API ${detailsResponse.status}`);
  const detailsPayload = (await detailsResponse.json()) as {
    items?: Array<{
      id?: string;
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }>;
  };
  const details = new Map(
    (detailsPayload.items ?? []).map((item) => [item.id ?? '', item] as const),
  );
  const videos: YoutubeVideo[] = entries.map((entry) => {
    const detail = details.get(entry.id);
    const duration = detail?.contentDetails?.duration ?? '';
    const seconds = parseDuration(duration);
    const type: 'short' | 'video' = seconds > 0 && seconds <= 61 ? 'short' : 'video';
    const viewsText = detail?.statistics?.viewCount
      ? formatCount(Number(detail.statistics.viewCount), 'view', 'views')
      : '';
    return {
      ...makeVideo(entry.id, entry.title, type, viewsText, entry.published),
      published: entry.published,
    };
  });
  const stats = channel?.statistics;
  const subscribers = stats?.subscriberCount ? Number(stats.subscriberCount) : null;
  const videoCount = stats?.videoCount ? Number(stats.videoCount) : null;
  const totalViews = stats?.viewCount ? Number(stats.viewCount) : null;
  return {
    channel: {
      channelId: CHANNEL_ID,
      handle: `@${HANDLE}`,
      title: channel?.snippet?.title ?? 'Lin Go',
      subscribers,
      subscribersText: formatCount(subscribers, 'subscriber', 'subscribers'),
      videoCount,
      videoCountText: formatCount(videoCount, 'video', 'videos'),
      totalViews,
      totalViewsText: formatCount(totalViews, 'view', 'views'),
      source: 'api',
      updatedAt: new Date().toISOString(),
    },
    videos: videos.filter((item) => item.type === 'video'),
    shorts: videos.filter((item) => item.type === 'short'),
    channelUrl,
    subscribeUrl,
  };
};

const parseDuration = (value: string): number => {
  const match = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return 0;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
};

let cache: { at: number; payload: YoutubePayload } | null = null;

const getPayload = async (force: boolean): Promise<YoutubePayload> => {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.payload;
  try {
    let payload: YoutubePayload;
    if (API_KEY) {
      try {
        payload = await fetchApi();
      } catch {
        payload = await scrape();
      }
    } else {
      payload = await scrape();
    }
    cache = { at: Date.now(), payload };
    return payload;
  } catch (error) {
    // A temporary YouTube hiccup should never blank the Reels feed when we
    // already have a recent snapshot. Serve the stale copy and refresh later.
    if (cache) return cache.payload;
    throw error;
  }
};

export default async function youtubeHandler(
  request: ApiRequest,
  response: ApiResponse,
): Promise<void> {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  const method = request.method?.toUpperCase() || 'GET';
  if (method === 'OPTIONS') {
    response.setHeader('Allow', 'GET, OPTIONS');
    response.status(204).json({});
    return;
  }
  if (method !== 'GET') {
    response.setHeader('Allow', 'GET, OPTIONS');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const force = queryValue(request.query, 'refresh') === '1';
    const payload = await getPayload(force);
    response.status(200).json(payload);
  } catch (error) {
    console.error(
      '[youtube-api] Failed to load channel:',
      error instanceof Error ? error.message : String(error),
    );
    response.status(502).json({
      error: 'تعذر تحميل فيديوهات القناة الآن. حاول لاحقًا.',
      channelUrl,
      subscribeUrl,
    });
  }
}
