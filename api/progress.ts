import { createHash } from 'node:crypto';
import process from 'node:process';
import { isValidProgressCode, validateProgressBackupProfile } from '../src/services/storageService';

interface ProgressRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface ProgressResponse {
  status(code: number): ProgressResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

interface StoredProgressBackup {
  format: 'englishtok-progress-backup';
  schemaVersion: 1;
  code: string;
  createdAt: string;
  profile: ReturnType<typeof validateProgressBackupProfile>;
}

const BACKUP_TTL_SECONDS = 60 * 60 * 24 * 90;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMITS = { GET: 30, POST: 8 } as const;

const getRedisCredentials = () => ({
  url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, ''),
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const rateLimitKey = (request: ProgressRequest, method: 'GET' | 'POST') => {
  const forwarded = request.headers['x-forwarded-for'];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim();
  const fingerprint = createHash('sha256').update(address || 'unknown-client').digest('hex').slice(0, 24);
  return `englishtok:progress:rate:${method}:${fingerprint}`;
};

const redisCommand = async (url: string, token: string, command: string, ...args: string[]) => {
  const path = [command, ...args].map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Redis REST request failed (${response.status}).`);
  const payload = await response.json() as { result?: unknown; error?: string };
  if (payload.error) throw new Error('Redis REST returned an error.');
  return payload.result;
};

const readBody = (body: unknown): Record<string, unknown> | null => {
  if (typeof body === 'string') {
    try { body = JSON.parse(body) as unknown; } catch { return null; }
  }
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : null;
};

export default async function progressHandler(request: ProgressRequest, response: ProgressResponse) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const method = request.method?.toUpperCase();
  if (method !== 'GET' && method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const { url, token } = getRedisCredentials();
  if (!url || !token) {
    return response.status(503).json({ error: 'Cross-device progress storage is not configured.' });
  }

  try {
    const rateKey = rateLimitKey(request, method);
    const requestCount = Number(await redisCommand(url, token, 'incr', rateKey));
    if (requestCount === 1) await redisCommand(url, token, 'expire', rateKey, String(RATE_WINDOW_MS / 1000));
    if (!Number.isFinite(requestCount) || requestCount > RATE_LIMITS[method]) {
      return response.status(429).json({ error: 'Too many requests. Try again later.' });
    }

    if (method === 'POST') {
      const body = readBody(request.body);
      const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
      const profile = validateProgressBackupProfile(body?.profile);
      if (!isValidProgressCode(code) || !profile) {
        return response.status(400).json({ error: 'Invalid backup code or profile.' });
      }
      const record: StoredProgressBackup = {
        format: 'englishtok-progress-backup',
        schemaVersion: 1,
        code,
        createdAt: new Date().toISOString(),
        profile,
      };
      const serialized = JSON.stringify(record);
      if (serialized.length > 64_000) return response.status(413).json({ error: 'Progress backup is too large.' });
      const result = await redisCommand(url, token, 'set', `englishtok:progress:${code}`, serialized, 'EX', String(BACKUP_TTL_SECONDS), 'NX');
      if (result !== 'OK') return response.status(409).json({ error: 'Backup code already exists.' });
      return response.status(201).json({ code, createdAt: record.createdAt, expiresInDays: 90 });
    }

    const queryCode = request.query?.code;
    const code = (Array.isArray(queryCode) ? queryCode[0] : queryCode)?.trim().toUpperCase() ?? '';
    if (!isValidProgressCode(code)) return response.status(400).json({ error: 'Invalid backup code.' });
    const result = await redisCommand(url, token, 'get', `englishtok:progress:${code}`);
    if (typeof result !== 'string') return response.status(404).json({ error: 'Progress backup not found.' });
    let record: unknown;
    try { record = JSON.parse(result) as unknown; } catch { return response.status(500).json({ error: 'Stored progress backup is invalid.' }); }
    if (!record || typeof record !== 'object' || Array.isArray(record)) return response.status(500).json({ error: 'Stored progress backup is invalid.' });
    const stored = record as Record<string, unknown>;
    const profile = validateProgressBackupProfile(stored.profile);
    if (stored.format !== 'englishtok-progress-backup' || stored.schemaVersion !== 1 || stored.code !== code || typeof stored.createdAt !== 'string' || !profile) {
      return response.status(500).json({ error: 'Stored progress backup failed validation.' });
    }
    return response.status(200).json({ ...stored, profile });
  } catch (error) {
    console.error('[progress-api] Remote backup storage is unavailable:', error instanceof Error ? error.message : 'unknown error');
    return response.status(503).json({ error: 'Remote progress storage is temporarily unavailable.' });
  }
}
