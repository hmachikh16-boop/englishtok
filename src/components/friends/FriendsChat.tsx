import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  MessageCircle,
  Send,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getStoredGoldLicenseCode } from '../../services/goldLicense';

interface FriendRecord {
  code: string;
  name: string;
  status: 'accepted';
}

interface FriendRequest {
  id: string;
  fromCode: string;
  fromName: string;
  createdAtUtc: string;
}

interface FriendMessage {
  id: string;
  senderCode: string;
  senderName: string;
  message: string;
  at: string;
}

const CHAT_BASE = 'https://englishtok-eight.vercel.app/api/admin';
const FRIEND_ID_KEY = 'lin-go-friend-id-v1';

const normalizeCode = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '');

const createLocalId = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `U-${out}`;
};

/**
 * A stable, non-reversible friend code derived from the licence. It never
 * exposes the licence itself, so sharing it can't be used to activate Gold on
 * another phone or trip the device-limit anti-cheat.
 */
const hashToFriendCode = (input: string): string => {
  let forward = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    forward ^= input.charCodeAt(i);
    forward = Math.imul(forward, 0x01000193) >>> 0;
  }
  let backward = 0x811c9dc5;
  for (let i = input.length - 1; i >= 0; i -= 1) {
    backward ^= input.charCodeAt(i);
    backward = Math.imul(backward, 0x01000193) >>> 0;
  }
  const body = (forward.toString(36) + backward.toString(36))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
    .padEnd(8, '0');
  return `U-${body}`;
};

/** A stable friend identity: derived from the licence when present, otherwise a per-device ID. */
const readFriendIdentity = (): string => {
  const license = normalizeCode(getStoredGoldLicenseCode() || '');
  if (license) return hashToFriendCode(license);
  try {
    const stored = localStorage.getItem(FRIEND_ID_KEY);
    if (stored && /^U-[A-Z0-9]{6,12}$/.test(stored)) return stored;
    const created = createLocalId();
    localStorage.setItem(FRIEND_ID_KEY, created);
    return created;
  } catch {
    return createLocalId();
  }
};

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
};

const QUICK_PHRASES = [
  'Hi! How are you?',
  'Let’s practise English together.',
  'Can you help me with this word?',
  'Great job! 🎉',
];

interface FriendsChatProps {
  onClose?: () => void;
  userName?: string;
}

export const FriendsChat: React.FC<FriendsChatProps> = ({ onClose, userName = '' }) => {
  const myCode = useMemo(() => readFriendIdentity(), []);
  const device = useMemo(() => {
    try {
      return Capacitor.getPlatform();
    } catch {
      return 'web';
    }
  }, []);

  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activeFriend, setActiveFriend] = useState<FriendRecord | null>(null);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'ok' | 'error'>('info');
  const [addCode, setAddCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const notify = useCallback((message: string, tone: 'info' | 'ok' | 'error' = 'info') => {
    setStatus(message);
    setStatusTone(tone);
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const url = `${CHAT_BASE}?action=friends_list&code=${encodeURIComponent(myCode)}&device=${encodeURIComponent(device)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.friends)) setFriends(payload.friends);
      if (Array.isArray(payload.requests)) setRequests(payload.requests);
    } catch {
      /* offline — keep the last known list */
    } finally {
      setLoadingFriends(false);
    }
  }, [myCode, device]);

  const loadMessages = useCallback(
    async (friendCode: string) => {
      try {
        const url = `${CHAT_BASE}?action=friends_chat&code=${encodeURIComponent(myCode)}&friendCode=${encodeURIComponent(friendCode)}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        if (Array.isArray(payload.messages)) setMessages(payload.messages);
      } catch {
        /* offline */
      }
    },
    [myCode],
  );

  useEffect(() => {
    void loadFriends();
    const interval = window.setInterval(() => void loadFriends(), 15000);
    return () => window.clearInterval(interval);
  }, [loadFriends]);

  useEffect(() => {
    if (!activeFriend) return;
    void loadMessages(activeFriend.code);
    const interval = window.setInterval(() => void loadMessages(activeFriend.code), 7000);
    return () => window.clearInterval(interval);
  }, [activeFriend, loadMessages]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const handleAddFriend = async () => {
    const target = normalizeCode(addCode);
    if (!target || adding) return;
    if (target === myCode) {
      notify('هذا كودك أنت — شاركه مع صديقك.', 'error');
      return;
    }
    setAdding(true);
    notify('');
    try {
      const response = await fetch(`${CHAT_BASE}?action=friends_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, targetCode: target }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الطلب.');
      setAddCode('');
      notify('تم إرسال طلب الصداقة — بانتظار الموافقة.', 'ok');
      await loadFriends();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إرسال الطلب.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const response = await fetch(`${CHAT_BASE}?action=friends_accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, requestId }),
      });
      if (!response.ok) throw new Error('تعذر قبول الطلب.');
      notify('تمت إضافة الصديق ✅', 'ok');
      await loadFriends();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر قبول الطلب.', 'error');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`${CHAT_BASE}?action=friends_reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, requestId }),
      });
      if (!response.ok) throw new Error('تعذر رفض الطلب.');
      await loadFriends();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر رفض الطلب.', 'error');
    }
  };

  const handleRemove = async (friendCode: string) => {
    if (!window.confirm('إزالة هذا الصديق وحذف المحادثة؟')) return;
    try {
      const response = await fetch(`${CHAT_BASE}?action=friends_remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, friendCode }),
      });
      if (!response.ok) throw new Error('تعذر إزالة الصديق.');
      setActiveFriend(null);
      setMessages([]);
      notify('تمت إزالة الصديق.', 'ok');
      await loadFriends();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إزالة الصديق.', 'error');
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeFriend) return;
    setSending(true);
    try {
      const response = await fetch(`${CHAT_BASE}?action=friends_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, friendCode: activeFriend.code, message: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
      setInput('');
      await loadMessages(activeFriend.code);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إرسال الرسالة.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify(`كودك: ${myCode}`, 'info');
    }
  };

  return (
    <div className="friends-chat-modal" role="dialog" aria-modal="true" aria-labelledby="friends-chat-title">
      <div className="friends-chat-panel">
        <header className="friends-chat-header">
          <div className="friends-chat-title">
            <Users className="h-5 w-5" aria-hidden="true" />
            <h2 id="friends-chat-title">أصدقاء التعلّم</h2>
          </div>
          {onClose && (
            <button type="button" className="friends-chat-close" onClick={onClose} aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        <div className="friends-chat-body">
          {!activeFriend ? (
            <>
              <div className="friends-my-code-card">
                <div>
                  <span className="friends-my-code-label">كودك لمشاركة الصداقة</span>
                  <code className="friends-my-code-value" dir="ltr">
                    {myCode}
                  </code>
                </div>
                <button type="button" className="friends-copy-btn" onClick={() => void handleCopyCode()} aria-label="نسخ الكود">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              <div className="friends-add-row">
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleAddFriend();
                    }
                  }}
                  placeholder="أدخل كود صديقك لإضافته"
                  className="friends-add-input"
                  dir="ltr"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="friends-add-btn"
                  onClick={() => void handleAddFriend()}
                  disabled={adding || !addCode.trim()}
                >
                  <UserPlus className="h-4 w-4" />
                  {adding ? '…' : 'إضافة'}
                </button>
              </div>

              {status && <p className={`friends-status is-${statusTone}`}>{status}</p>}

              {requests.length > 0 && (
                <section className="friends-section">
                  <h3>طلبات صداقة ({requests.length})</h3>
                  <ul className="friends-list">
                    {requests.map((req) => (
                      <li key={req.id} className="friends-request-item">
                        <span className="friends-avatar">{(req.fromName || req.fromCode).charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{req.fromName || req.fromCode}</strong>
                          <small>{req.fromCode}</small>
                        </div>
                        <div className="friends-request-actions">
                          <button type="button" onClick={() => void handleAccept(req.id)} className="friends-accept-btn">
                            قبول
                          </button>
                          <button type="button" onClick={() => void handleReject(req.id)} className="friends-reject-btn">
                            رفض
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="friends-section">
                <h3>أصدقائي ({friends.length})</h3>
                {loadingFriends && friends.length === 0 ? (
                  <p className="friends-empty">جارٍ تحميل الأصدقاء…</p>
                ) : friends.length === 0 ? (
                  <p className="friends-empty">
                    لا أصدقاء بعد. شارك كودك مع صديقك أو أدخل كوده أعلاه للبدء.
                  </p>
                ) : (
                  <ul className="friends-list">
                    {friends.map((f) => (
                      <li key={f.code}>
                        <button
                          type="button"
                          className="friends-item"
                          onClick={() => {
                            setActiveFriend(f);
                            setMessages([]);
                            notify('');
                          }}
                        >
                          <span className="friends-avatar">{(f.name || f.code).charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{f.name || f.code}</strong>
                            <small>{f.code}</small>
                          </div>
                          <MessageCircle className="friends-item-icon h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <>
              <div className="friends-thread-head">
                <button type="button" className="friends-back-btn" onClick={() => setActiveFriend(null)}>
                  ← رجوع
                </button>
                <div className="friends-thread-peer">
                  <strong>{activeFriend.name || activeFriend.code}</strong>
                  <small dir="ltr">{activeFriend.code}</small>
                </div>
                <button
                  type="button"
                  className="friends-remove-btn"
                  onClick={() => void handleRemove(activeFriend.code)}
                  aria-label="إزالة الصديق"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="friends-chat-thread" ref={threadRef}>
                {messages.length === 0 ? (
                  <p className="friends-empty">ابدأ المحادثة بالإنجليزية — تدرّب مع صديقك! 🇬🇧</p>
                ) : (
                  messages.map((m) => {
                    const mine = normalizeCode(m.senderCode) === myCode;
                    return (
                      <div key={m.id} className={`friends-bubble ${mine ? 'is-mine' : 'is-theirs'}`}>
                        <span className="friends-bubble-author">{mine ? 'أنت' : m.senderName || m.senderCode}</span>
                        <p dir="auto">{m.message}</p>
                        <time>{formatTime(m.at)}</time>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="friends-quick-row">
                {QUICK_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    className="friends-quick-chip"
                    onClick={() => setInput(phrase)}
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              <form
                className="friends-chat-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب بالإنجليزية…"
                  className="friends-chat-input"
                  dir="ltr"
                  autoComplete="off"
                />
                <button type="submit" className="friends-chat-send" disabled={sending || !input.trim()} aria-label="إرسال">
                  <Send className="h-4 w-4" />
                </button>
              </form>
              {status && <p className={`friends-status is-${statusTone}`}>{status}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
