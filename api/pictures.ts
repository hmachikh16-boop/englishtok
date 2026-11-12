import { put, del } from '@vercel/blob';
import process from 'node:process';

const PICTURES_KEY = 'lingo:edu:pictures:v1';
const ADMIN_KEY = (process.env.LINGO_ADMIN_KEY || '').trim();

const getRedisCredentials = () => ({
  url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, ''),
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const redisConfigured = (): boolean => {
  const { url, token } = getRedisCredentials();
  return Boolean(url && token);
};

const redisCommand = async (...args: string[]): Promise<unknown> => {
  const { url, token } = getRedisCredentials();
  if (!url || !token) throw new Error('التخزين السحابي غير مهيأ.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`تعذر الوصول إلى التخزين (${response.status}).`);
  const text = await response.text();
  const payload = JSON.parse(text) as { result?: unknown; error?: string };
  if (payload.error) throw new Error('أعاد التخزين خطأً.');
  return payload.result;
};

interface PictureRecord {
  id: string;
  url: string;
  caption: string;
  createdAt: string;
}

const loadPictures = async (): Promise<PictureRecord[]> => {
  if (!redisConfigured()) return [];
  try {
    const raw = await redisCommand('get', PICTURES_KEY);
    if (typeof raw !== 'string' || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PictureRecord[]) : [];
  } catch {
    return [];
  }
};

const savePictures = async (items: PictureRecord[]): Promise<void> => {
  if (!redisConfigured()) throw new Error('التخزين السحابي غير مهيأ.');
  await redisCommand('set', PICTURES_KEY, JSON.stringify(items));
};

const assertAdmin = (candidate: string): boolean => {
  if (!ADMIN_KEY) return false;
  if (candidate.length !== ADMIN_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < ADMIN_KEY.length; i++) diff |= candidate.charCodeAt(i) ^ ADMIN_KEY.charCodeAt(i);
  return diff === 0;
};

const cors = (response: { setHeader: (n: string, v: string) => void }) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  response.setHeader('Cache-Control', 'no-store, max-age=0');
};

const ADMIN_KEY_QUERY = 'key';

export default async function handler(request: any, response: any) {
  cors(response);
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const adminCandidate =
    (typeof request.query?.key === 'string' ? request.query.key : '') ||
    (typeof request.headers?.['x-admin-key'] === 'string' ? request.headers['x-admin-key'] : '');

  if (request.method === 'GET') {
    const items = await loadPictures();
    response.status(200).json({ items });
    return;
  }

  if (request.method === 'POST') {
    if (!assertAdmin(adminCandidate)) {
      response.status(401).json({ error: 'مفتاح إدارة غير صالح.' });
      return;
    }
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {};
    const image = typeof body.image === 'string' ? body.image : '';
    const caption = typeof body.caption === 'string' ? body.caption.trim().slice(0, 200) : '';
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(image);
    if (!match) {
      response.status(400).json({ error: 'صورة غير صالحة. أرسل data URL (base64).' });
      return;
    }
    const mime = match[1];
    const base64 = match[2];
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length < 100 || buffer.length > 4_500_000) {
      response.status(413).json({ error: 'حجم الصورة يجب أن يكون بين 100 بايت و 4.5 MB.' });
      return;
    }
    const id = `pic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const pathname = `edu-pictures/${id}.${ext}`;
    const blob = await put(pathname, buffer, { access: 'public', contentType: mime });
    const record: PictureRecord = {
      id,
      url: blob.url,
      caption,
      createdAt: new Date().toISOString(),
    };
    const items = await loadPictures();
    items.unshift(record);
    await savePictures(items);
    response.status(201).json({ item: record });
    return;
  }

  if (request.method === 'DELETE') {
    if (!assertAdmin(adminCandidate)) {
      response.status(401).json({ error: 'مفتاح إدارة غير صالح.' });
      return;
    }
    const id = typeof request.query?.id === 'string' ? request.query.id : '';
    if (!id) {
      response.status(400).json({ error: 'معرّف الصورة مطلوب.' });
      return;
    }
    const items = await loadPictures();
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) {
      response.status(404).json({ error: 'الصورة غير موجودة.' });
      return;
    }
    const [removed] = items.splice(index, 1);
    try {
      await del(removed.url);
    } catch {
      // ignore blob deletion failures
    }
    await savePictures(items);
    response.status(200).json({ ok: true });
    return;
  }

  response.status(405).json({ error: 'Method not allowed.' });
}
