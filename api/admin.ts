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

interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'admin';
  message: string;
  at: string;
  code?: string;
  device?: string;
  userName?: string;
  userEmail?: string;
  read?: boolean;
}

interface FriendRecord {
  id: string;
  fromCode: string;
  fromDevice: string;
  fromName: string;
  toCode: string;
  toName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAtUtc: string;
  updatedAtUtc: string;
}

interface FriendChatMessage {
  id: string;
  conversationId: string;
  senderCode: string;
  senderName: string;
  message: string;
  at: string;
  read?: boolean;
  /** Friend codes that have opened the thread after this message was sent. */
  readBy?: string[];
}

interface GroupMember {
  code: string;
  name: string;
  joinedAtUtc: string;
  /** ISO timestamp of the last time this member opened the group thread. */
  lastReadAt?: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  code: string;
  ownerCode: string;
  createdAtUtc: string;
  members: GroupMember[];
}

interface GroupChatMessage {
  id: string;
  groupId: string;
  senderCode: string;
  senderName: string;
  message: string;
  at: string;
}

interface PresenceRecord {
  code: string;
  lastSeenAt: string;
  device?: string;
}

interface LicenseSettings {
  /** When true, the Gold app opens for everyone without a license code. */
  freeMode: boolean;
}

interface LicenseDatabase {
  schemaVersion: 1;
  updatedAtUtc: string;
  licenses: LicenseRecord[];
  activity: ActivityEvent[];
  chats: ChatMessage[];
  friends: FriendRecord[];
  friendChats: FriendChatMessage[];
  groups: StudyGroup[];
  groupChats: GroupChatMessage[];
  presence: PresenceRecord[];
  settings: LicenseSettings;
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
const MAX_CHATS = 2000;
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
  chats: [],
  friends: [],
  friendChats: [],
  groups: [],
  groupChats: [],
  presence: [],
  settings: { freeMode: false },
});

const normalizeSettings = (raw: unknown): LicenseSettings => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { freeMode: false };
  const source = raw as Record<string, unknown>;
  return { freeMode: asBoolean(pick(source, 'freeMode', 'FreeMode')) };
};

const normalizeFriends = (raw: unknown): FriendRecord[] => {
  if (!Array.isArray(raw)) return [];
  const records: FriendRecord[] = [];
  for (const item of raw.slice(0, 5000)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const id = asString(pick(source, 'id', 'Id'), 80) || randomUUID();
    const fromCode = normalizeCode(pick(source, 'fromCode', 'FromCode'));
    const fromDevice = asString(pick(source, 'fromDevice', 'FromDevice'), 240);
    const fromName = asString(pick(source, 'fromName', 'FromName'), 160);
    const toCode = normalizeCode(pick(source, 'toCode', 'ToCode'));
    const toName = asString(pick(source, 'toName', 'ToName'), 160);
    const statusRaw = asString(pick(source, 'status', 'Status'), 16).toLowerCase();
    const status: 'pending' | 'accepted' | 'rejected' =
      statusRaw === 'accepted' ? 'accepted' : statusRaw === 'rejected' ? 'rejected' : 'pending';
    const createdAtUtc = normalizeDate(pick(source, 'createdAtUtc', 'CreatedAtUtc')) || nowIso();
    const updatedAtUtc = normalizeDate(pick(source, 'updatedAtUtc', 'UpdatedAtUtc')) || createdAtUtc;
    if (!fromCode || !toCode || fromCode === toCode) continue;
    records.push({ id, fromCode, fromDevice, fromName, toCode, toName, status, createdAtUtc, updatedAtUtc });
  }
  return records;
};

const normalizeFriendChat = (raw: unknown): FriendChatMessage[] => {
  if (!Array.isArray(raw)) return [];
  const messages: FriendChatMessage[] = [];
  for (const item of raw.slice(0, 5000)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const id = asString(pick(source, 'id', 'Id'), 80) || randomUUID();
    const conversationId = asString(pick(source, 'conversationId', 'ConversationId'), 200);
    const senderCode = normalizeCode(pick(source, 'senderCode', 'SenderCode'));
    const senderName = asString(pick(source, 'senderName', 'SenderName'), 160);
    const message = asString(pick(source, 'message', 'Message'), 2000);
    const at = normalizeDate(pick(source, 'at', 'At')) || nowIso();
    if (!conversationId || !message) continue;
    const rawReadBy = pick(source, 'readBy', 'ReadBy');
    const readBy = Array.isArray(rawReadBy)
      ? rawReadBy.map((entry) => normalizeCode(entry)).filter(Boolean).slice(0, 50)
      : [];
    messages.push({ id, conversationId, senderCode, senderName, message, at, read: asBoolean(pick(source, 'read', 'Read')), readBy });
  }
  return messages;
};

const normalizeGroups = (raw: unknown): StudyGroup[] => {
  if (!Array.isArray(raw)) return [];
  const groups: StudyGroup[] = [];
  for (const item of raw.slice(0, 2000)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const id = asString(pick(source, 'id', 'Id'), 80) || randomUUID();
    const name = asString(pick(source, 'name', 'Name'), 80);
    const description = asString(pick(source, 'description', 'Description'), 300);
    const code = normalizeCode(pick(source, 'code', 'Code'));
    const ownerCode = normalizeCode(pick(source, 'ownerCode', 'OwnerCode'));
    const createdAtUtc = normalizeDate(pick(source, 'createdAtUtc', 'CreatedAtUtc')) || nowIso();
    if (!name || !code) continue;
    const rawMembers = Array.isArray(source.members) ? source.members : [];
    const members: GroupMember[] = [];
    for (const m of rawMembers.slice(0, 500)) {
      if (!m || typeof m !== 'object' || Array.isArray(m)) continue;
      const ms = m as Record<string, unknown>;
      const memberCode = normalizeCode(pick(ms, 'code', 'Code'));
      if (!memberCode) continue;
      members.push({
        code: memberCode,
        name: asString(pick(ms, 'name', 'Name'), 160),
        joinedAtUtc: normalizeDate(pick(ms, 'joinedAtUtc', 'JoinedAtUtc')) || createdAtUtc,
        lastReadAt: normalizeDate(pick(ms, 'lastReadAt', 'LastReadAt')) || undefined,
      });
    }
    groups.push({ id, name, description, code, ownerCode, createdAtUtc, members });
  }
  return groups;
};

const normalizeGroupChat = (raw: unknown): GroupChatMessage[] => {
  if (!Array.isArray(raw)) return [];
  const messages: GroupChatMessage[] = [];
  for (const item of raw.slice(0, 5000)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const id = asString(pick(source, 'id', 'Id'), 80) || randomUUID();
    const groupId = asString(pick(source, 'groupId', 'GroupId'), 80);
    const senderCode = normalizeCode(pick(source, 'senderCode', 'SenderCode'));
    const senderName = asString(pick(source, 'senderName', 'SenderName'), 160);
    const message = asString(pick(source, 'message', 'Message'), 2000);
    const at = normalizeDate(pick(source, 'at', 'At')) || nowIso();
    if (!groupId || !message) continue;
    messages.push({ id, groupId, senderCode, senderName, message, at });
  }
  return messages;
};

const normalizeChat = (raw: unknown): ChatMessage[] => {
  if (!Array.isArray(raw)) return [];
  const messages: ChatMessage[] = [];
  for (const item of raw.slice(0, MAX_CHATS)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const id = asString(pick(source, 'id', 'Id'), 80) || randomUUID();
    const conversationId = asString(pick(source, 'conversationId', 'ConversationId'), 200);
    const message = asString(pick(source, 'message', 'Message'), 2000);
    const at = normalizeDate(pick(source, 'at', 'At')) || nowIso();
    const senderRaw = asString(pick(source, 'sender', 'Sender'), 10).toLowerCase();
    const sender: 'user' | 'admin' = senderRaw === 'admin' ? 'admin' : 'user';
    if (!conversationId || !message) continue;
    messages.push({
      id,
      conversationId,
      sender,
      message,
      at,
      code: normalizeCode(pick(source, 'code', 'Code')) || undefined,
      device: asString(pick(source, 'device', 'Device'), 240) || undefined,
      userName: asString(pick(source, 'userName', 'UserName'), 160) || undefined,
      userEmail: asString(pick(source, 'userEmail', 'UserEmail'), 240) || undefined,
      read: asBoolean(pick(source, 'read', 'Read')),
    });
  }
  return messages;
};

const normalizePresence = (raw: unknown): PresenceRecord[] => {
  if (!Array.isArray(raw)) return [];
  const records: PresenceRecord[] = [];
  for (const item of raw.slice(0, 5000)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const source = item as Record<string, unknown>;
    const code = normalizeCode(pick(source, 'code', 'Code'));
    if (!code) continue;
    const lastSeenAt = normalizeDate(pick(source, 'lastSeenAt', 'LastSeenAt')) || nowIso();
    records.push({ code, lastSeenAt, device: asString(pick(source, 'device', 'Device'), 240) || undefined });
  }
  return records;
};

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
    chats: normalizeChat(source.chats ?? source.Chats),
    friends: normalizeFriends(source.friends ?? source.Friends),
    friendChats: normalizeFriendChat(source.friendChats ?? source.FriendChats),
    groups: normalizeGroups(source.groups ?? source.Groups),
    groupChats: normalizeGroupChat(source.groupChats ?? source.GroupChats),
    presence: normalizePresence(source.presence ?? source.Presence),
    settings: normalizeSettings(source.settings ?? source.Settings),
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

const handleGetMode = async (): Promise<{ freeMode: boolean; updatedAtUtc: string }> => {
  const database = await loadDatabase();
  return {
    freeMode: Boolean(database.settings?.freeMode),
    updatedAtUtc: database.updatedAtUtc,
  };
};

const handleSetMode = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const freeMode = asBoolean(body.freeMode);
  return withDatabaseLock(async () => {
    const database = await loadDatabase();
    database.settings = { freeMode };
    addActivity(
      database,
      'mode',
      freeMode
        ? 'تم تفعيل وضع التجربة المجانية — التطبيق يفتح بدون كود.'
        : 'تمت العودة إلى الوضع المدفوع — التطبيق يطلب كودًا مفعّلًا.',
    );
    await saveDatabase(database);
    return { database, freeMode };
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

const conversationIdFor = (code: string, device: string): string =>
  `${code || 'anon'}::${device || 'unknown'}`;

const handleChatSend = async (body: Record<string, unknown>) => {
  const message = asString(body.message, 2000);
  if (message.length < 1) {
    throw new HttpError(400, 'الرسالة فارغة.');
  }
  const code = asString(body.code, 48);
  const device = asString(body.device, 240);
  const userName = asString(body.userName, 160);
  const userEmail = asString(body.userEmail, 240) || asString(body.email, 240);
  const conversationId = conversationIdFor(code, device);
  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const msg: ChatMessage = {
      id: randomUUID(),
      conversationId,
      sender: 'user',
      message: message.slice(0, 2000),
      at: nowIso(),
      code: code || undefined,
      device: device || undefined,
      userName: userName || undefined,
      userEmail: userEmail || undefined,
      read: false,
    };
    database.chats.push(msg);
    if (database.chats.length > MAX_CHATS) {
      database.chats = database.chats.slice(database.chats.length - MAX_CHATS);
    }
    await saveDatabase(database);
    return msg.id;
  });
  return { ok: true, id };
};

const handleFriendsRequest = async (body: Record<string, unknown>) => {
  const fromCode = normalizeCode(body.code);
  const fromDevice = asString(body.device, 240);
  const fromName = asString(body.userName, 160);
  const toCode = normalizeCode(body.targetCode);
  if (!fromCode || !toCode) throw new HttpError(400, 'كود المرسل والمستهدف مطلوبان.');
  if (fromCode === toCode) throw new HttpError(400, 'لا يمكنك إضافة نفسك.');
  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    // Check if already friends or pending
    const existing = database.friends.find(
      (f) => (f.fromCode === fromCode && f.toCode === toCode) || (f.fromCode === toCode && f.toCode === fromCode),
    );
    if (existing) {
      if (existing.status === 'accepted') throw new HttpError(409, 'أنتما أصدقاء بالفعل.');
      if (existing.status === 'pending') throw new HttpError(409, 'طلب صداقة معلق بالفعل.');
      // A rejected request can be re-sent: revive it.
      existing.status = 'pending';
      existing.fromCode = fromCode;
      existing.fromDevice = fromDevice;
      existing.fromName = fromName;
      existing.toCode = toCode;
      existing.updatedAtUtc = nowIso();
      await saveDatabase(database);
      return existing.id;
    }
    const record: FriendRecord = {
      id: randomUUID(),
      fromCode,
      fromDevice,
      fromName,
      toCode,
      toName: '',
      status: 'pending',
      createdAtUtc: nowIso(),
      updatedAtUtc: nowIso(),
    };
    database.friends.push(record);
    if (database.friends.length > 5000) database.friends = database.friends.slice(database.friends.length - 5000);
    await saveDatabase(database);
    return record.id;
  });
  return { ok: true, id };
};

const handleFriendsAccept = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const userName = asString(body.userName, 160);
  const requestId = asString(body.requestId, 80);
  if (!code || !requestId) throw new HttpError(400, 'كود و requestId مطلوبان.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = database.friends.find((f) => f.id === requestId && f.toCode === code && f.status === 'pending');
    if (!record) throw new HttpError(404, 'طلب الصداقة غير موجود.');
    record.status = 'accepted';
    record.toName = userName || record.toName;
    record.updatedAtUtc = nowIso();
    await saveDatabase(database);
  });
  return { ok: true };
};

const handleFriendsReject = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const requestId = asString(body.requestId, 80);
  if (!code || !requestId) throw new HttpError(400, 'كود و requestId مطلوبان.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const record = database.friends.find((f) => f.id === requestId && f.toCode === code && f.status === 'pending');
    if (!record) throw new HttpError(404, 'طلب الصداقة غير موجود.');
    record.status = 'rejected';
    record.updatedAtUtc = nowIso();
    await saveDatabase(database);
  });
  return { ok: true };
};

const handlePresencePing = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  if (!code) throw new HttpError(400, 'كود مطلوب.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const now = nowIso();
    const existing = database.presence.find((p) => p.code === code);
    if (existing) {
      existing.lastSeenAt = now;
      const device = asString(body.device, 240);
      if (device) existing.device = device;
    } else {
      database.presence.push({ code, lastSeenAt: now, device: asString(body.device, 240) || undefined });
      if (database.presence.length > 5000) database.presence = database.presence.slice(database.presence.length - 5000);
    }
    await saveDatabase(database);
  });
  return { ok: true };
};

const handleFriendsList = async (query: Record<string, string | string[] | undefined>) => {
  const code = normalizeCode(Array.isArray(query.code) ? query.code[0] : query.code);
  if (!code) return { friends: [], requests: [], unreadTotal: 0 };
  const database = await loadDatabase();
  const presenceMap = new Map(database.presence.map((p) => [p.code, p.lastSeenAt]));
  const friends: Array<{
    code: string;
    name: string;
    status: 'accepted';
    lastMessage: string;
    lastAt: string;
    lastSenderCode: string;
    unread: number;
    lastSeenAt: string;
  }> = [];
  const requests: Array<{ id: string; fromCode: string; fromName: string; createdAtUtc: string }> = [];
  let unreadTotal = 0;
  for (const f of database.friends) {
    if (f.status === 'accepted' && (f.fromCode === code || f.toCode === code)) {
      const mine = f.fromCode === code;
      const otherCode = mine ? f.toCode : f.fromCode;
      const otherName = mine ? f.toName : f.fromName;
      const convId = [code, otherCode].sort().join('::');
      const conversation = database.friendChats
        .filter((m) => m.conversationId === convId)
        .sort((a, b) => (a.at < b.at ? -1 : 1));
      const last = conversation[conversation.length - 1];
      const unread = conversation.filter(
        (m) => m.senderCode !== code && !(m.readBy ?? []).includes(code),
      ).length;
      unreadTotal += unread;
      friends.push({
        code: otherCode,
        name: otherName || '',
        status: 'accepted',
        lastMessage: last?.message ?? '',
        lastAt: last?.at ?? '',
        lastSenderCode: last?.senderCode ?? '',
        unread,
        lastSeenAt: presenceMap.get(otherCode) ?? '',
      });
    }
    if (f.status === 'pending' && f.toCode === code) {
      requests.push({ id: f.id, fromCode: f.fromCode, fromName: f.fromName, createdAtUtc: f.createdAtUtc });
    }
  }
  friends.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  return { friends, requests, unreadTotal };
};

const handleFriendsRemove = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const friendCode = normalizeCode(body.friendCode);
  if (!code || !friendCode) throw new HttpError(400, 'كود و friendCode مطلوبان.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    database.friends = database.friends.filter(
      (f) =>
        !((f.fromCode === code && f.toCode === friendCode) || (f.fromCode === friendCode && f.toCode === code)),
    );
    const convId = [code, friendCode].sort().join('::');
    database.friendChats = database.friendChats.filter((m) => m.conversationId !== convId);
    await saveDatabase(database);
  });
  return { ok: true };
};

const handleFriendsChatGet = async (query: Record<string, string | string[] | undefined>) => {
  const code = normalizeCode(Array.isArray(query.code) ? query.code[0] : query.code);
  const friendCode = normalizeCode(Array.isArray(query.friendCode) ? query.friendCode[0] : query.friendCode);
  if (!code || !friendCode) return { messages: [] };
  const convId = [code, friendCode].sort().join('::');
  const messages = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const conversation = database.friendChats
      .filter((m) => m.conversationId === convId)
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    let changed = false;
    for (const m of conversation) {
      if (m.senderCode === code) continue;
      const readBy = m.readBy ?? [];
      if (!readBy.includes(code)) {
        m.readBy = [...readBy, code].slice(0, 50);
        changed = true;
      }
    }
    if (changed) {
      database.updatedAtUtc = nowIso();
      await saveDatabase(database);
    }
    return conversation.slice(-100);
  });
  return { messages };
};

const handleFriendsChatSend = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const device = asString(body.device, 240);
  const userName = asString(body.userName, 160);
  const friendCode = normalizeCode(body.friendCode);
  const message = asString(body.message, 2000);
  if (!code || !friendCode || message.length < 1) throw new HttpError(400, 'كود و friendCode ورسالة مطلوبة.');
  const convId = [code, friendCode].sort().join('::');
  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const msg: FriendChatMessage = {
      id: randomUUID(),
      conversationId: convId,
      senderCode: code,
      senderName: userName || code,
      message: message.slice(0, 2000),
      at: nowIso(),
      read: false,
      readBy: [code],
    };
    database.friendChats.push(msg);
    if (database.friendChats.length > 5000) database.friendChats = database.friendChats.slice(database.friendChats.length - 5000);
    await saveDatabase(database);
    return msg.id;
  });
  return { ok: true, id };
};

const GROUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateGroupCode = (): string => {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += GROUP_CODE_ALPHABET.charAt(Math.floor(Math.random() * GROUP_CODE_ALPHABET.length));
  }
  return `G-${out}`;
};

const findGroupByCode = (database: LicenseDatabase, code: string): StudyGroup | undefined =>
  database.groups.find((g) => g.code === code);

const isGroupMember = (group: StudyGroup, code: string): boolean =>
  group.ownerCode === code || group.members.some((m) => m.code === code);

const publicGroup = (group: StudyGroup) => ({
  id: group.id,
  name: group.name,
  description: group.description,
  code: group.code,
  ownerCode: group.ownerCode,
  createdAtUtc: group.createdAtUtc,
  members: group.members.map((m) => ({ code: m.code, name: m.name, joinedAtUtc: m.joinedAtUtc })),
});

const handleGroupsCreate = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const userName = asString(body.userName, 160);
  const name = asString(body.name, 80);
  const description = asString(body.description, 300);
  if (!code) throw new HttpError(400, 'كود المستخدم مطلوب.');
  if (!name) throw new HttpError(400, 'اسم المجموعة مطلوب.');
  const group = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    let groupCode = generateGroupCode();
    let guard = 0;
    while (findGroupByCode(database, groupCode) && guard < 20) {
      groupCode = generateGroupCode();
      guard += 1;
    }
    const record: StudyGroup = {
      id: randomUUID(),
      name: name.slice(0, 80),
      description: description.slice(0, 300),
      code: groupCode,
      ownerCode: code,
      createdAtUtc: nowIso(),
      members: [{ code, name: userName || code, joinedAtUtc: nowIso(), lastReadAt: nowIso() }],
    };
    database.groups.push(record);
    if (database.groups.length > 2000) database.groups = database.groups.slice(database.groups.length - 2000);
    await saveDatabase(database);
    return record;
  });
  return { ok: true, group: publicGroup(group) };
};

const handleGroupsJoin = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const userName = asString(body.userName, 160);
  const groupCode = normalizeCode(body.groupCode);
  if (!code || !groupCode) throw new HttpError(400, 'كود المستخدم وكود المجموعة مطلوبان.');
  const group = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const target = findGroupByCode(database, groupCode);
    if (!target) throw new HttpError(404, 'المجموعة غير موجودة.');
    if (isGroupMember(target, code)) return target;
    if (target.members.length >= 200) throw new HttpError(409, 'المجموعة ممتلئة (200 عضو).');
    target.members.push({ code, name: userName || code, joinedAtUtc: nowIso(), lastReadAt: nowIso() });
    await saveDatabase(database);
    return target;
  });
  return { ok: true, group: publicGroup(group) };
};

const handleGroupsList = async (query: Record<string, string | string[] | undefined>) => {
  const code = normalizeCode(Array.isArray(query.code) ? query.code[0] : query.code);
  if (!code) return { groups: [], unreadTotal: 0 };
  const database = await loadDatabase();
  const presenceMap = new Map(database.presence.map((p) => [p.code, p.lastSeenAt]));
  let unreadTotal = 0;
  const groups = database.groups
    .filter((g) => isGroupMember(g, code))
    .map((group) => {
      const member = group.members.find((m) => m.code === code);
      const lastReadAt = member?.lastReadAt ?? '';
      const conversation = database.groupChats
        .filter((m) => m.groupId === group.id)
        .sort((a, b) => (a.at < b.at ? -1 : 1));
      const last = conversation[conversation.length - 1];
      const unread = conversation.filter(
        (m) => m.senderCode !== code && (!lastReadAt || m.at > lastReadAt),
      ).length;
      unreadTotal += unread;
      const enrichedGroup = publicGroup(group);
      enrichedGroup.members = enrichedGroup.members.map((m) => ({
        ...m,
        lastSeenAt: presenceMap.get(m.code) ?? '',
      }));
      return {
        ...enrichedGroup,
        lastMessage: last?.message ?? '',
        lastAt: last?.at ?? '',
        lastSenderCode: last?.senderCode ?? '',
        lastSenderName: last?.senderName ?? '',
        unread,
      };
    })
    .sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  return { groups, unreadTotal };
};

const handleGroupsLeave = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const groupId = asString(body.groupId, 80);
  if (!code || !groupId) throw new HttpError(400, 'كود و groupId مطلوبان.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const group = database.groups.find((g) => g.id === groupId);
    if (!group) return;
    group.members = group.members.filter((m) => m.code !== code);
    if (group.ownerCode === code) {
      if (group.members.length === 0) {
        database.groups = database.groups.filter((g) => g.id !== groupId);
        database.groupChats = database.groupChats.filter((m) => m.groupId !== groupId);
      } else {
        group.ownerCode = group.members[0].code;
      }
    }
    await saveDatabase(database);
  });
  return { ok: true };
};

const handleGroupsChatGet = async (query: Record<string, string | string[] | undefined>) => {
  const code = normalizeCode(Array.isArray(query.code) ? query.code[0] : query.code);
  const groupId = asString(Array.isArray(query.groupId) ? query.groupId[0] : query.groupId, 80);
  if (!code || !groupId) return { messages: [] };
  const messages = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const group = database.groups.find((g) => g.id === groupId);
    if (!group || !isGroupMember(group, code)) return [];
    const conversation = database.groupChats
      .filter((m) => m.groupId === groupId)
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    const member = group.members.find((m) => m.code === code);
    const last = conversation[conversation.length - 1];
    if (member && last && (!member.lastReadAt || member.lastReadAt < last.at)) {
      member.lastReadAt = nowIso();
      database.updatedAtUtc = nowIso();
      await saveDatabase(database);
    }
    return conversation.slice(-200);
  });
  return { messages };
};

const handleGroupsChatSend = async (body: Record<string, unknown>) => {
  const code = normalizeCode(body.code);
  const userName = asString(body.userName, 160);
  const groupId = asString(body.groupId, 80);
  const message = asString(body.message, 2000);
  if (!code || !groupId || message.length < 1) throw new HttpError(400, 'كود و groupId ورسالة مطلوبة.');
  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const group = database.groups.find((g) => g.id === groupId);
    if (!group) throw new HttpError(404, 'المجموعة غير موجودة.');
    if (!isGroupMember(group, code)) throw new HttpError(403, 'أنت لست عضواً في هذه المجموعة.');
    const msg: GroupChatMessage = {
      id: randomUUID(),
      groupId,
      senderCode: code,
      senderName: userName || code,
      message: message.slice(0, 2000),
      at: nowIso(),
    };
    database.groupChats.push(msg);
    if (database.groupChats.length > 5000) database.groupChats = database.groupChats.slice(database.groupChats.length - 5000);
    await saveDatabase(database);
    return msg.id;
  });
  return { ok: true, id };
};

/** Lightweight unread counter for the friends/groups floating button badge. */
const handleSocialSummary = async (query: Record<string, string | string[] | undefined>) => {
  const code = normalizeCode(Array.isArray(query.code) ? query.code[0] : query.code);
  if (!code) return { unreadTotal: 0 };
  const database = await loadDatabase();
  let unreadTotal = 0;
  for (const f of database.friends) {
    if (f.status !== 'accepted') continue;
    if (f.fromCode !== code && f.toCode !== code) continue;
    const otherCode = f.fromCode === code ? f.toCode : f.fromCode;
    const convId = [code, otherCode].sort().join('::');
    unreadTotal += database.friendChats.filter(
      (m) => m.conversationId === convId && m.senderCode !== code && !(m.readBy ?? []).includes(code),
    ).length;
  }
  for (const group of database.groups) {
    const member = group.members.find((m) => m.code === code);
    if (!member) continue;
    unreadTotal += database.groupChats.filter(
      (m) => m.groupId === group.id && m.senderCode !== code && (!member.lastReadAt || m.at > member.lastReadAt),
    ).length;
  }
  return { unreadTotal };
};

const handleChatGet = async (query: Record<string, string | string[] | undefined>) => {
  const code = asString(Array.isArray(query.code) ? query.code[0] : query.code, 48);
  const device = asString(Array.isArray(query.device) ? query.device[0] : query.device, 240);
  const conversationId = conversationIdFor(code, device);
  const database = await loadDatabase();
  const messages = database.chats
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return { messages };
};

const handleChatList = async () => {
  const database = await loadDatabase();
  const convMap = new Map<string, { conversationId: string; code?: string; device?: string; userName?: string; userEmail?: string; lastMessage: string; lastAt: string; unread: number; messageCount: number }>();
  for (const m of database.chats) {
    const existing = convMap.get(m.conversationId);
    if (!existing) {
      convMap.set(m.conversationId, {
        conversationId: m.conversationId,
        code: m.code,
        device: m.device,
        userName: m.userName,
        userEmail: m.userEmail,
        lastMessage: m.message,
        lastAt: m.at,
        unread: m.sender === 'user' && !m.read ? 1 : 0,
        messageCount: 1,
      });
    } else {
      if (m.at > existing.lastAt) {
        existing.lastMessage = m.message;
        existing.lastAt = m.at;
      }
      existing.messageCount += 1;
      if (m.sender === 'user' && !m.read) existing.unread += 1;
      if (!existing.userName && m.userName) existing.userName = m.userName;
      if (!existing.userEmail && m.userEmail) existing.userEmail = m.userEmail;
      if (!existing.code && m.code) existing.code = m.code;
      if (!existing.device && m.device) existing.device = m.device;
    }
  }
  const conversations = [...convMap.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  return { conversations };
};

const handleChatReply = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const conversationId = asString(body.conversationId, 200);
  const message = asString(body.message, 2000);
  if (!conversationId || !message) {
    throw new HttpError(400, 'conversationId و message مطلوبان.');
  }
  const id = await withDatabaseLock(async () => {
    const database = await loadDatabase();
    const msg: ChatMessage = {
      id: randomUUID(),
      conversationId,
      sender: 'admin',
      message: message.slice(0, 2000),
      at: nowIso(),
      read: true,
    };
    // Find the conversation's code/device from existing messages
    const existing = database.chats.find((m) => m.conversationId === conversationId);
    if (existing) {
      msg.code = existing.code;
      msg.device = existing.device;
      msg.userName = existing.userName;
      msg.userEmail = existing.userEmail;
    }
    database.chats.push(msg);
    if (database.chats.length > MAX_CHATS) {
      database.chats = database.chats.slice(database.chats.length - MAX_CHATS);
    }
    await saveDatabase(database);
    return msg.id;
  });
  return { ok: true, id };
};

const handleChatRead = async (request: AdminRequest, body: Record<string, unknown>) => {
  requireAuth(request);
  assertSameOrigin(request);
  const conversationId = asString(body.conversationId, 200);
  if (!conversationId) throw new HttpError(400, 'conversationId مطلوب.');
  await withDatabaseLock(async () => {
    const database = await loadDatabase();
    for (const m of database.chats) {
      if (m.conversationId === conversationId && m.sender === 'user') {
        m.read = true;
      }
    }
    await saveDatabase(database);
  });
  return { ok: true };
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
    if (action === 'check' || action === 'support' || action === 'mode' || action === 'chat' || action === 'chat_get' || action === 'social_summary' || action === 'presence_ping' || action.startsWith('friends_') || action.startsWith('groups_')) setCheckCors(response);
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

    if (action === 'chat') {
      setCheckCors(response);
      if (method === 'GET') {
        return response.status(200).json(await handleChatGet(request.query ?? {}));
      }
      if (method !== 'POST') {
        response.setHeader('Allow', 'GET, POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleChatSend(body));
    }

    if (action === 'chats') {
      if (method !== 'GET') {
        response.setHeader('Allow', 'GET, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleChatList());
    }

    if (action === 'chat_reply') {
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleChatReply(request, body));
    }

    if (action === 'chat_read') {
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleChatRead(request, body));
    }

    // ---- Friends (social) ----
    if (action === 'friends_list') {
      setCheckCors(response);
      if (method !== 'GET') {
        response.setHeader('Allow', 'GET, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsList(request.query ?? {}));
    }

    if (action === 'friends_request') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsRequest(body));
    }

    if (action === 'friends_accept') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsAccept(body));
    }

    if (action === 'friends_reject') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsReject(body));
    }

    if (action === 'friends_remove') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsRemove(body));
    }

    if (action === 'friends_chat') {
      setCheckCors(response);
      if (method === 'GET') {
        return response.status(200).json(await handleFriendsChatGet(request.query ?? {}));
      }
      if (method !== 'POST') {
        response.setHeader('Allow', 'GET, POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleFriendsChatSend(body));
    }

    // ---- Study groups ----
    if (action === 'social_summary') {
      setCheckCors(response);
      if (method !== 'GET') {
        response.setHeader('Allow', 'GET, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleSocialSummary(request.query ?? {}));
    }

    if (action === 'presence_ping') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handlePresencePing(body));
    }

    if (action === 'groups_list') {
      setCheckCors(response);
      if (method !== 'GET') {
        response.setHeader('Allow', 'GET, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleGroupsList(request.query ?? {}));
    }

    if (action === 'groups_create') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleGroupsCreate(body));
    }

    if (action === 'groups_join') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleGroupsJoin(body));
    }

    if (action === 'groups_leave') {
      setCheckCors(response);
      if (method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleGroupsLeave(body));
    }

    if (action === 'groups_chat') {
      setCheckCors(response);
      if (method === 'GET') {
        return response.status(200).json(await handleGroupsChatGet(request.query ?? {}));
      }
      if (method !== 'POST') {
        response.setHeader('Allow', 'GET, POST, OPTIONS');
        return response.status(405).json({ error: 'Method not allowed.' });
      }
      return response.status(200).json(await handleGroupsChatSend(body));
    }

    if (action === 'mode') {
      setCheckCors(response);
      if (method === 'GET') return response.status(200).json(await handleGetMode());
      return response.status(200).json(await handleSetMode(request, body));
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
