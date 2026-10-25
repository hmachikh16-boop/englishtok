interface TtsRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface TtsResponse {
  status(code: number): TtsResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
  send(payload: Uint8Array): void;
  end(): void;
}

const MAX_TEXT_LENGTH = 200;
const UPSTREAM_TIMEOUT_MS = 15_000;

// Keep the speech fallback available long enough for a slow mobile network.
export const config = { maxDuration: 30 };

const cleanText = (value: string): string =>
  value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Small server-side proxy for French lesson speech. The app prefers a French
 * voice installed on the device; this endpoint is the fallback for browsers and
 * Android WebViews that only have an English or Arabic voice installed.
 *
 * It is deliberately limited to French and short lesson sentences. Dynamic
 * tutor replies must not be routed through this endpoint.
 */
export default async function handler(
  request: TtsRequest,
  response: TtsResponse,
): Promise<void> {
  // The Android build is served from Capacitor's local origin and requests
  // this French fallback from the deployed site. Media elements usually allow
  // this without CORS, but an explicit header keeps fetch-based clients and
  // older WebViews working too.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method && request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  let text = '';
  try {
    const url = new URL(request.url ?? '', 'https://englishtok.local');
    if (url.searchParams.get('lang') !== 'fr') {
      response.status(400).json({ error: 'Only French speech is supported.' });
      return;
    }
    text = cleanText(url.searchParams.get('q') ?? '');
  } catch {
    response.status(400).json({ error: 'Invalid speech request.' });
    return;
  }

  if (!text || text.length > MAX_TEXT_LENGTH) {
    response.status(400).json({ error: 'Speech text must be between 1 and 200 characters.' });
    return;
  }

  const upstreamUrl =
    'https://translate.google.com/translate_tts' +
    `?ie=UTF-8&client=tw-ob&tl=fr&q=${encodeURIComponent(text)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5',
        Referer: 'https://translate.google.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      throw new Error(`Speech provider returned ${upstream.status}.`);
    }

    const upstreamType = (upstream.headers.get('content-type') ?? '').toLowerCase();
    if (!upstreamType.includes('audio/')) {
      throw new Error(`Speech provider returned unexpected content (${upstreamType || 'unknown'}).`);
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    if (audio.byteLength < 256) {
      throw new Error('Speech provider returned an empty clip.');
    }

    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Content-Length', String(audio.byteLength));
    response.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (request.method === 'HEAD') {
      response.status(200).end();
      return;
    }
    response.status(200).send(audio);
  } catch (error) {
    console.error('[tts] French speech fallback failed:', error);
    response.status(502).json({ error: 'French speech is temporarily unavailable.' });
  }
}
