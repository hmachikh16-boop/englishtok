import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import process from 'node:process';

interface AdminRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface AdminResponse {
  status(code: number): AdminResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

interface LicenseRecord {
  id: string;
  code: string;
  plan: string;
  durationDays: number;
  deviceLimit: number;
  userName: string;
  userEmail: string;
  deviceId: string;
  createdAtUtc: string;
  activatedAtUtc: string | null;
  expiresAtUtc: string | null;
  lastSeenAtUtc: string | null;
  revoked: boolean;
  notes: string;
}

interface ActivityEvent {
  id: string;
  at: string;
  type: string;
  message: string;
  code?: string;
}

interface LicenseDatabase {
  schemaVersion: 1;
  updatedAtUtc: string;
  licenses: LicenseRecord[];
  activity: ActivityEvent[];
}

class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const ADMIN_KEY = (process.env.LINGO_ADMIN_KEY || '').trim();
const DB_KEY = (process.env.LINGO_ADMIN_STORE_KEY || '').trim() || 'lingo:gold:control:db:v1';
const SESSION_COOKIE = 'lingo_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const CODE_PREFIX = 'LINGO-GOLD';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_DB_BYTES = 2_000_000;
const MAX_ACTIVITY = 120;
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_SECONDS = 15 * 60;
const CHECK_RATE_LIMIT = 30;
const CHECK_RATE_WINDOW_SECONDS = 60 * 60;

const nowIso = () => new Date().toISOString();

const headerValue = (headers: AdminRequest['headers'], name: string): string => {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const queryValue = (
  query: AdminRequest['query'],
  name: string,
): string => {
  const value = query?.[name];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
};

const readBody = (body: unknown): Record<string, unknown> => {
  let value = body;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
};

const pick = (source: Record<string, unknown>, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }
  return undefined;
};

const asString = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
};

const asBoolean = (value: unknown): boolean =>
  value === true || value === 'true' || value === 1 || value === '1';

const asInteger = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
};

const normalizeCode = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase().replace(/\s+/g, '');
};

const isGoldCode = (value: string): boolean =>
  /^LINGO-GOLD-[A-Z0-9-]{4,60}$/.test(value);

const normalizeDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value !== 'string') return null;
  const serialized = /\/Date\((-?\d+)(?:[+-]\d{4})?\)\//.exec(value);
  const date = serialized ? new Date(Number(serialized[1])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeRecord = (raw: unknown): LicenseRecord | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const code = normalizeCode(pick(source, 'code', 'Code'));
  if (!isGoldCode(code)) return null;
  const createdAtUtc = normalizeDate(pick(source, 'createdAtUtc', 'CreatedAtUtc')) || nowIso();
  const durationDays = asInteger(pick(source, 'durationDays', 'DurationDays'), 30, 0, 3650);
  const deviceLimit = asInteger(pick(source, 'deviceLimit', 'DeviceLimit'), 1, 1, 50);
  return {
    id: asString(pick(source, 'id', 'Id'), 80) || randomUUID(),
    code,
    plan: asString(pick(source, 'plan', 'Plan'), 40) || 'Gold',
    durationDays,
    deviceLimit,
    userName: asString(pick(source, 'userName', 'UserName'), 160),
    userEmail: asString(pick(source, 'userEmail', 'UserEmail'), 240),
    deviceId: asString(pick(source, 'deviceId', 'DeviceId'), 240),
    createdAtUtc,
    activatedAtUtc: normalizeDate(pick(source, 'activatedAtUtc', 'ActivatedAtUtc')),
    expiresAtUtc: normalizeDate(pick(source, 'expiresAtUtc', 'ExpiresAtUtc')),
    lastSeenAtUtc: normalizeDate(pick(source, 'lastSeenAtUtc', 'LastSeenAtUtc')),
    revoked: asBoolean(pick(source, 'revoked', 'Revoked')),
    notes: asString(pick(source, 'notes', 'Notes'), 2000),
  };
};

const normalizeActivity = (raw: unknown): ActivityEvent[] => {
  if (!Array.isArray(raw)) return [];
  const events: ActivityEvent[] = [];
  for (const item of raw.slice(0, MAX_ACTIVITY)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const at = normalizeDate(pick(source, 'at', 'At'));
    const message = asString(pick(source, 'message', 'Message'), 240);
    if (!at || !message) continue;
    events.push({
      id: asString(pick(source, 'id', 'Id'), 80) || randomUUID(),
      at,
      type: asString(pick(source, 'type', 'Type'), 40) || 'event',
      message,
      code: normalizeCode(pick(source, 'code', 'Code')) || undefined,
    });
  }
  return events;
};

const emptyDatabase = (): LicenseDatabase => ({
  schemaVersion: 1,
  updatedAtUtc: nowIso(),
  licenses: [],
  activity: [],
});

const normalizeDatabase = (raw: unknown): LicenseDatabase => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new HttpError(400, 'صيغة قاعدة البيانات غير صالحة.');
  }
  const source = raw as Record<string, unknown>;
  const rawRecords = Array.isArray(source.licenses)
    ? source.licenses
    : Array.isArray(source.Licenses)
      ? source.Licenses
      : [];
  const licenses: LicenseRecord[] = [];
  const seen = new Set<string>();
  for (const rawRecord of rawRecords) {
    const record = normalizeRecord(rawRecord);
    if (!record || seen.has(record.code)) continue;
    seen.add(record.code);
    licenses.push(record);
  }
  return {
    schemaVersion: 1,
    updatedAtUtc: normalizeDate(pick(source, 'updatedAtUtc', 'UpdatedAtUtc')) || nowIso(),
    licenses,
    activity: normalizeActivity(source.activity ?? source.Activity),
  };
};

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
  if (!url || !token) throw new HttpError(503, 'التخزين السحابي غير مهيأ.');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new HttpError(503, `تعذر الوصول إلى التخزين السحابي (${response.status}).`);
  }
  const text = await response.text();
  let payload: { result?: unknown; error?: string };
  try {
    payload = JSON.parse(text) as { result?: unknown; error?: string };
  } catch {
    throw new HttpError(503, 'أعاد التخزين السحابي استجابة غير صالحة.');
  }
  if (payload.error) throw new HttpError(503, 'أعاد التخزين السحابي خطأً.');
  return payload.result;
};

const loadDatabase = async (): Promise<LicenseDatabase> => {
  const raw = await redisCommand('get', DB_KEY);
  if (typeof raw !== 'string' || !raw.trim()) return emptyDatabase();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(500, 'قاعدة البيانات السحابية تالفة. لم يتم تعديل أي شيء.');
  }
  return normalizeDatabase(parsed);
};

const saveDatabase = async (database: LicenseDatabase): Promise<void> => {
  database.updatedAtUtc = nowIso();
  const serialized = JSON.stringify(database);
  if (serialized.length > MAX_DB_BYTES) {
    throw new HttpError(413, 'حجم قاعدة البيانات تجاوز الحد المسموح.');
  }
  await redisCommand('set', DB_KEY, serialized);
};

const withDatabaseLock = async <T>(work: () => Promise<T>): Promise<T> => {
  const lockKey = `${DB_KEY}:lock`;
  const token = randomUUID();
  const acquired = await redisCommand('set', lockKey, token, 'NX', 'PX', '8000');
  if (acquired !== 'OK') {
    throw new HttpError(409, 'هناك عملية إدارة أخرى قيد التنفيذ. أعد المحاولة بعد لحظات.');
  }
  try {
    return await work();
  } finally {
    const script =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    void redisCommand('eval', script, '1', lockKey, token).catch(() => undefined);
  }
};

const addActivity = (
  database: LicenseDatabase,
  type: string,
  message: string,
  code?: string,
): void => {
  database.activity.unshift({
    id: randomUUID(),
    at: nowIso(),
    type,
    message,
    ...(code ? { code } : {}),
  });
  if (database.activity.length > MAX_ACTIVITY) {
    database.activity.length = MAX_ACTIVITY;
  }
};

const generateCode = (existing: Set<string>): string => {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const blocks: string[] = [];
    for (let block = 0; block < 3; block += 1) {
      const bytes = randomBytes(4);
      let text = '';
      for (let index = 0; index < 4; index += 1) {
        text += CODE_ALPHABET[bytes[index] % CODE_ALPHABET.length];
      }
      blocks.push(text);
    }
    const code = `${CODE_PREFIX}-${blocks.join('-')}`;
    if (!existing.has(code)) {
      existing.add(code);
      return code;
    }
  }
  throw new HttpError(500, 'تعذر توليد كود فريد. أعد المحاولة.');
};

const findRecord = (database: LicenseDatabase, id: string): LicenseRecord => {
  const record = database.licenses.find((item) => item.id === id);
  if (!record) throw new HttpError(404, 'لم يتم العثور على الكود.');
  return record;
};

const addDays = (base: Date, days: number): string =>
  new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const getSessionToken = (request: AdminRequest): string => {
  const raw = headerValue(request.headers, 'cookie');
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return '';
};

const signSessionPayload = (payload: string): string =>
  createHmac('sha256', ADMIN_KEY).update(payload).digest('base64url');

const createSessionToken = (): string => {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const nonce = randomBytes(12).toString('hex');
  const payload = `${expires}.${nonce}`;
  return `${payload}.${signSessionPayload(payload)}`;
};

const verifySessionToken = (token: string): boolean => {
  if (!token || !ADMIN_KEY) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = signSessionPayload(`${expires}.${nonce}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const isAuthenticated = (request: AdminRequest): boolean =>
  verifySessionToken(getSessionToken(request));

const requestHost = (request: AdminRequest): string =>
  headerValue(request.headers, 'x-forwarded-host') || headerValue(request.headers, 'host');

const isLocalHost = (host: string): boolean =>
  /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);

const sessionCookie = (request: AdminRequest, token: string): string => {
  const secure = isLocalHost(requestHost(request)) ? '' : ' Secure;';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict;${secure} Max-Age=${SESSION_TTL_SECONDS}`;
};

const clearSessionCookie = (request: AdminRequest): string => {
  const secure = isLocalHost(requestHost(request)) ? '' : ' Secure;';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict;${secure} Max-Age=0`;
};

const assertSameOrigin = (request: AdminRequest): void => {
  const origin = headerValue(request.headers, 'origin');
  if (!origin) return;
  try {
    if (new URL(origin).host !== requestHost(request)) {
      throw new HttpError(403, 'طلب غير مصرح به من مصدر مختلف.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, 'مصدر الطلب غير صالح.');
  }
};

const clientFingerprint = (request: AdminRequest): string => {
  const forwarded = headerValue(request.headers, 'x-forwarded-for');
  const address = forwarded.split(',')[0]?.trim() || headerValue(request.headers, 'x-real-ip') || 'unknown';
  return createHash('sha256').update(address).digest('hex').slice(0, 24);
};

const loginRateLimitKey = (request: AdminRequest): string =>
  `lingo:gold:control:login-rate:${clientFingerprint(request)}`;

const enforceLoginRateLimit = async (request: AdminRequest): Promise<void> => {
  const key = loginRateLimitKey(request);
  const count = Number(await redisCommand('incr', key));
  if (count === 1) {
    await redisCommand('expire', key, String(LOGIN_RATE_WINDOW_SECONDS));
  }
  if (!Number.isFinite(count) || count > LOGIN_RATE_LIMIT) {
    throw new HttpError(429, 'محاولات دخول كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.');
  }
};

const clearLoginRateLimit = async (request: AdminRequest): Promise<void> => {
  await redisCommand('del', loginRateLimitKey(request)).catch(() => undefined);
};

const enforceCheckRateLimit = async (request: AdminRequest): Promise<void> => {
  const key = `lingo:gold:control:check-rate:${clientFingerprint(request)}`;
  const count = Number(await redisCommand('incr', key));
  if (count === 1) {
    await redisCommand('expire', key, String(CHECK_RATE_WINDOW_SECONDS));
  }
  if (!Number.isFinite(count) || count > CHECK_RATE_LIMIT) {
    throw new HttpError(429, 'محاولات فحص كثيرة. أعد المحاولة بعد قليل.');
  }
};

const assertAdminKey = (candidate: string): boolean => {
  if (!ADMIN_KEY) return false;
  const actualBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(ADMIN_KEY);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const setCommonHeaders = (request: AdminRequest, response: AdminResponse): void => {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Vary', 'Cookie, Origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  void request;
};

const requireAuth = (request: AdminRequest): void => {
  if (!isAuthenticated(request)) {
    throw new HttpError(401, 'انتهت الجلسة. سجّل الدخول من جديد.');
  }
};

const getAction = (request: AdminRequest, body: Record<string, unknown>): string => {
  const fromQuery = queryValue(request.query, 'action');
  if (fromQuery) return fromQuery;
  return asString(body.action, 40);
};

const handleSession = (request: AdminRequest) => ({
  authenticated: isAuthenticated(request),
  configured: Boolean(ADMIN_KEY && redisConfigured()),
  storage: redisConfigured(),
  apiVersion: '2026-10-28.1',
});

const handleLogin = async (request: AdminRequest, response: AdminResponse, body: Record<string, unknown>) => {
  if (!ADMIN_KEY) {
    throw new HttpError(503, 'لم يتم إعداد مفتاح الإدارة على الخادم بعد.');
  }
  if (!redisConfigured()) {
    throw new HttpError(503, 'التخزين السحابي غير مهيأ على الخادم بعد.');
  }
  assertSameOrigin(request);
  await enforceLoginRateLimit(request);
  const candidate = asString(body.key, 200);
  if (!assertAdminKey(candidate)) {
    throw new HttpError(401, 'مفتاح الإدارة غير صحيح.');
  }
  await clearLoginRateLimit(request);
  const token = createSessionToken();
  response.setHeader('Set-Cookie', sessionCookie(request, token));
  return {
    authenticated: true,
    expiresInSeconds: SESSION_TTL_SECONDS,
  };
};

const handleLogout = (request: AdminRequest, response: AdminResponse) => {
  assertSameOrigin(request);
  response.setHeader('Set-Cookie', clearSessionCookie(request));
  return { authenticated: false };
};

const handleGetDatabase = async () => {
  const database = await loadDatabase();
  return { database, serverTime: nowIso() };
};

const handleGenerate = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const count = asInteger(body.count, 0, 0, 200);
  if (count < 1) throw new HttpError(400, 'حدد عددًا بين 1 و200.');
  const durationDays = asInteger(body.durationDays, 30, 0, 3650);
  const deviceLimit = asInteger(body.deviceLimit, 1, 1, 50);
  const plan = asString(body.plan, 40) || 'Gold';
  const notes = asString(body.notes, 1000);
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const existing = new Set(database.licenses.map((record) => record.code));
    const generatedCodes: string[] = [];
    const createdAtUtc = nowIso();
    for (let index = 0; index < count; index += 1) {
      const code = generateCode(existing);
      generatedCodes.push(code);
      database.licenses.push({
        id: randomUUID(),
        code,
        plan,
        durationDays,
        deviceLimit,
        userName: '',
        userEmail: '',
        deviceId: '',
        createdAtUtc,
        activatedAtUtc: null,
        expiresAtUtc: null,
        lastSeenAtUtc: null,
        revoked: false,
        notes,
      });
    }
    addActivity(database, 'generate', `تم إنشاء ${count} كودًا جديدًا.`);
    await saveDatabase(database);
    return { database, generatedCodes };
  });
};

const handleUpdate = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const id = asString(body.id, 80);
  if (!id) throw new HttpError(400, 'معرّف الكود مطلوب.');
  const patch = readBody(body.patch);
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = findRecord(database, id);
    if (patch.plan !== undefined) record.plan = asString(patch.plan, 40) || 'Gold';
    if (patch.durationDays !== undefined) {
      const durationDays = asInteger(patch.durationDays, record.durationDays, 0, 3650);
      if (durationDays !== record.durationDays) {
        record.durationDays = durationDays;
        if (record.activatedAtUtc) {
          const activatedAt = new Date(record.activatedAtUtc);
          record.expiresAtUtc = durationDays > 0 ? addDays(activatedAt, durationDays) : null;
        }
      }
    }
    if (patch.deviceLimit !== undefined) record.deviceLimit = asInteger(patch.deviceLimit, record.deviceLimit, 1, 50);
    if (patch.userName !== undefined) record.userName = asString(patch.userName, 160);
    if (patch.userEmail !== undefined) record.userEmail = asString(patch.userEmail, 240);
    if (patch.deviceId !== undefined) record.deviceId = asString(patch.deviceId, 240);
    if (patch.notes !== undefined) record.notes = asString(patch.notes, 2000);
    if (patch.revoked !== undefined) {
      const revoked = asBoolean(patch.revoked);
      if (revoked !== record.revoked) {
        record.revoked = revoked;
        addActivity(
          database,
          revoked ? 'revoke' : 'restore',
          revoked ? 'تم إلغاء كود.' : 'تمت إعادة تفعيل كود ملغى.',
          record.code,
        );
      }
    }
    addActivity(database, 'update', 'تم تحديث بيانات كود.', record.code);
    await saveDatabase(database);
    return { database };
  });
};

const handleActivate = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const id = asString(body.id, 80);
  if (!id) throw new HttpError(400, 'معرّف الكود مطلوب.');
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = findRecord(database, id);
    if (record.revoked) throw new HttpError(409, 'هذا الكود ملغى. أعد تفعيله أولًا.');
    if (body.userName !== undefined) record.userName = asString(body.userName, 160);
    if (body.userEmail !== undefined) record.userEmail = asString(body.userEmail, 240);
    if (body.deviceId !== undefined) record.deviceId = asString(body.deviceId, 240);
    if (body.durationDays !== undefined) {
      record.durationDays = asInteger(body.durationDays, record.durationDays, 0, 3650);
    }
    const activated = new Date();
    record.activatedAtUtc = activated.toISOString();
    record.lastSeenAtUtc = activated.toISOString();
    record.expiresAtUtc = record.durationDays > 0 ? addDays(activated, record.durationDays) : null;
    addActivity(database, 'activate', 'تم تفعيل كود وتعيينه للمستخدم.', record.code);
    await saveDatabase(database);
    return { database };
  });
};

const handleExtend = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const id = asString(body.id, 80);
  const days = asInteger(body.days, 0, 0, 3650);
  if (!id) throw new HttpError(400, 'معرّف الكود مطلوب.');
  if (days < 1) throw new HttpError(400, 'حدد عدد أيام صحيحًا.');
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = findRecord(database, id);
    if (record.durationDays === 0 && record.expiresAtUtc === null) {
      throw new HttpError(409, 'هذا الكود مدى الحياة ولا يحتاج تمديدًا.');
    }
    if (record.expiresAtUtc) {
      const currentExpiry = new Date(record.expiresAtUtc).getTime();
      const base = Number.isFinite(currentExpiry) && currentExpiry > Date.now()
        ? new Date(currentExpiry)
        : new Date();
      record.expiresAtUtc = addDays(base, days);
    } else if (record.activatedAtUtc) {
      record.expiresAtUtc = addDays(new Date(), days);
    } else {
      record.durationDays = Math.min(3650, record.durationDays + days);
    }
    addActivity(database, 'extend', `تم تمديد الكود ${days} يومًا.`, record.code);
    await saveDatabase(database);
    return { database };
  });
};

const handleRevoke = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const id = asString(body.id, 80);
  if (!id) throw new HttpError(400, 'معرّف الكود مطلوب.');
  const revoked = body.revoked === undefined ? true : asBoolean(body.revoked);
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = findRecord(database, id);
    record.revoked = revoked;
    addActivity(
      database,
      revoked ? 'revoke' : 'restore',
      revoked ? 'تم إلغاء كود.' : 'تمت إعادة تفعيل كود ملغى.',
      record.code,
    );
    await saveDatabase(database);
    return { database };
  });
};

const handleDelete = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const id = asString(body.id, 80);
  if (!id) throw new HttpError(400, 'معرّف الكود مطلوب.');
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = findRecord(database, id);
    database.licenses = database.licenses.filter((item) => item.id !== id);
    addActivity(database, 'delete', 'تم حذف كود نهائيًا.', record.code);
    await saveDatabase(database);
    return { database };
  });
};

const handleImport = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const incoming = normalizeDatabase(body.database ?? body);
  if (incoming.licenses.length === 0) {
    throw new HttpError(400, 'الملف لا يحتوي على أكواد Gold صالحة.');
  }
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const existing = new Set(database.licenses.map((record) => record.code));
    let added = 0;
    let skipped = 0;
    for (const record of incoming.licenses) {
      if (existing.has(record.code)) {
        skipped += 1;
        continue;
      }
      existing.add(record.code);
      database.licenses.push(record);
      added += 1;
    }
    addActivity(database, 'import', `تم استيراد ${added} كودًا وتجاهل ${skipped} مكررًا.`);
    await saveDatabase(database);
    return { database, added, skipped };
  });
};

const readRecordStatus = (record: LicenseRecord): 'valid' | 'active' | 'expired' | 'revoked' => {
  if (record.revoked) return 'revoked';
  const expiresAt = record.expiresAtUtc ? new Date(record.expiresAtUtc).getTime() : null;
  if (expiresAt && expiresAt <= Date.now()) return 'expired';
  if (record.activatedAtUtc) return 'active';
  return 'valid';
};

const handlePublicCheck = async (request: AdminRequest, rawCode: unknown) => {
  const code = normalizeCode(rawCode);
  if (!isGoldCode(code)) {
    throw new HttpError(400, 'أدخل كود Gold صالحًا.');
  }
  await enforceCheckRateLimit(request);
  const incomingDeviceId = asString(
    (request.method?.toUpperCase() === 'GET'
      ? queryValue(request.query, 'deviceId')
      : (readBody(request.body).deviceId as unknown)) ?? '',
    240,
  );

  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = database.licenses.find((item) => item.code === code);
    if (!record) {
      return {
        valid: false,
        status: 'not_found',
        message: 'هذا الكود غير موجود في مساحة العمل.',
      };
    }

    // Bind the code to the first device that activates it. A second device
    // using the same code is rejected (and logged) while the original owner
    // keeps working. This fights code sharing without revoking the original.
    if (incomingDeviceId) {
      if (!record.deviceId) {
        record.deviceId = incomingDeviceId;
        record.activatedAtUtc = record.activatedAtUtc || nowIso();
        addActivity(database, 'device_bind', `تم ربط الكود ${code} بالجهاز ${incomingDeviceId}.`, code);
      } else if (record.deviceId !== incomingDeviceId) {
        addActivity(
          database,
          'device_mismatch',
          `محاولة استخدام الكود ${code} من جهاز ثانٍ (${incomingDeviceId}) — مرفوضة. الجهاز الأصلي: ${record.deviceId}.`,
          code,
        );
        await saveDatabase(database);
        return {
          valid: false,
          status: 'device_mismatch',
          plan: record.plan,
          durationDays: record.durationDays,
          expiresAtUtc: record.expiresAtUtc,
          message: 'هذا الكود مستخدم على جهاز آخر. تواصل مع الدعم.',
        };
      }
    }

    record.lastSeenAtUtc = nowIso();
    const status = readRecordStatus(record);
    const valid = status === 'valid' || status === 'active';
    await saveDatabase(database);
    return {
      valid,
      status,
      plan: record.plan,
      durationDays: record.durationDays,
      expiresAtUtc: record.expiresAtUtc,
      message: valid
        ? 'تم التحقق من كود Gold بنجاح.'
        : status === 'revoked'
          ? 'هذا الكود ملغى.'
          : 'هذا الكود منتهي الصلاحية.',
    };
  });
};

const handleSupportSubmit = async (request: AdminRequest, body: Record<string, unknown>): Promise<{ ok: boolean; id: string }> => {
  await enforceCheckRateLimit(request);
  const message = asString(body.message, 1000);
  if (message.length < 5) {
    throw new HttpError(400, 'اكتب تفاصيل المشكلة (5 أحرف على الأقل).');
  }
  const email = asString(body.email, 120);
  const code = asString(body.code, 48);
  const device = asString(body.device, 120);
  const fullMessage = [
    message,
    email ? `email: ${email}` : '',
    code ? `code: ${code}` : '',
    device ? `device: ${device}` : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 1000);

  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    addActivity(database, 'support', fullMessage, code || undefined);
    await saveDatabase(database);
    return database.activity[0]?.id || '';
  });

  return { ok: true, id };
};

const setCheckCors = (response: AdminResponse): void => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function adminHandler(
  request: AdminRequest,
  response: AdminResponse,
) {
  setCommonHeaders(request, response);
  const method = request.method?.toUpperCase() || 'GET';
  const body = readBody(request.body);
  const action = getAction(request, body);
  if (method === 'OPTIONS') {
    if (action === 'check' || action === 'support') setCheckCors(response);
    response.setHeader('Allow', 'GET, POST, OPTIONS');
    return response.status(204).json({});
  }
  if (method !== 'GET' && method !== 'POST') {
    response.setHeader('Allow', 'GET, POST, OPTIONS');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    if (action === 'check') {
      setCheckCors(response);
      return response.status(200).json(
        await handlePublicCheck(
          request,
          method === 'GET' ? queryValue(request.query, 'code') : body.code,
        ),
      );
    }

    if (action === 'support') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleSupportSubmit(request, body));
    }

    if (method === 'GET') {
      if (action === 'session') return response.status(200).json(handleSession(request));
      if (action === 'db') {
        requireAuth(request);
        return response.status(200).json(await handleGetDatabase());
      }
      return response.status(404).json({ error: 'Unknown admin action.' });
    }

    if (action === 'login') {
      return response.status(200).json(await handleLogin(request, response, body));
    }
    if (action === 'logout') {
      return response.status(200).json(handleLogout(request, response));
    }
    if (action === 'generate') return response.status(200).json(await handleGenerate(request, body));
    if (action === 'update') return response.status(200).json(await handleUpdate(request, body));
    if (action === 'activate') return response.status(200).json(await handleActivate(request, body));
    if (action === 'extend') return response.status(200).json(await handleExtend(request, body));
    if (action === 'revoke') return response.status(200).json(await handleRevoke(request, body));
    if (action === 'delete') return response.status(200).json(await handleDelete(request, body));
    if (action === 'import') return response.status(200).json(await handleImport(request, body));
    return response.status(404).json({ error: 'Unknown admin action.' });
  } catch (error) {
    if (error instanceof HttpError) {
      return response.status(error.status).json({ error: error.message });
    }
    console.error(
      '[admin-api] Unexpected failure:',
      error instanceof Error ? error.message : String(error),
    );
    return response.status(500).json({ error: 'حدث خطأ غير متوقع. لم يتم تعديل البيانات.' });
  }
}
