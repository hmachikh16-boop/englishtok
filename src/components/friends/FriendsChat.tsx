import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  LogOut,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
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

interface GroupMember {
  code: string;
  name: string;
  joinedAtUtc: string;
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

interface GroupMessage {
  id: string;
  groupId: string;
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

const membersLabel = (count: number): string => `${count} ${count === 1 ? 'عضو' : 'أعضاء'}`;

const QUICK_PHRASES = [
  'Hi! How are you?',
  'Let’s practise English together.',
  'Can you help me with this word?',
  'Great job! 🎉',
];

type Tab = 'friends' | 'groups';

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

  const [tab, setTab] = useState<Tab>('friends');
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

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const groupThreadRef = useRef<HTMLDivElement | null>(null);

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

  const loadGroups = useCallback(async () => {
    try {
      const url = `${CHAT_BASE}?action=groups_list&code=${encodeURIComponent(myCode)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      if (Array.isArray(payload.groups)) setGroups(payload.groups);
    } catch {
      /* offline */
    } finally {
      setLoadingGroups(false);
    }
  }, [myCode]);

  const loadGroupMessages = useCallback(
    async (groupId: string) => {
      try {
        const url = `${CHAT_BASE}?action=groups_chat&code=${encodeURIComponent(myCode)}&groupId=${encodeURIComponent(groupId)}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        if (Array.isArray(payload.messages)) setGroupMessages(payload.messages);
      } catch {
        /* offline */
      }
    },
    [myCode],
  );

  useEffect(() => {
    void loadFriends();
    void loadGroups();
    const interval = window.setInterval(() => {
      void loadFriends();
      void loadGroups();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadFriends, loadGroups]);

  useEffect(() => {
    if (!activeFriend) return;
    void loadMessages(activeFriend.code);
    const interval = window.setInterval(() => void loadMessages(activeFriend.code), 7000);
    return () => window.clearInterval(interval);
  }, [activeFriend, loadMessages]);

  useEffect(() => {
    if (!activeGroup) return;
    void loadGroupMessages(activeGroup.id);
    const interval = window.setInterval(() => void loadGroupMessages(activeGroup.id), 7000);
    return () => window.clearInterval(interval);
  }, [activeGroup, loadGroupMessages]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (groupThreadRef.current) groupThreadRef.current.scrollTop = groupThreadRef.current.scrollHeight;
  }, [groupMessages]);

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

  const handleRemoveFriend = async (friendCode: string) => {
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

  const handleSendFriend = async () => {
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

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name || creatingGroup) return;
    setCreatingGroup(true);
    notify('');
    try {
      const response = await fetch(`${CHAT_BASE}?action=groups_create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, name, description: groupDesc.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إنشاء المجموعة.');
      setGroupName('');
      setGroupDesc('');
      notify('تم إنشاء المجموعة — شارك كودها مع أصدقائك.', 'ok');
      await loadGroups();
      if (payload.group) setActiveGroup(payload.group as StudyGroup);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إنشاء المجموعة.', 'error');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    const code = normalizeCode(joinCode);
    if (!code || joiningGroup) return;
    setJoiningGroup(true);
    notify('');
    try {
      const response = await fetch(`${CHAT_BASE}?action=groups_join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, groupCode: code }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر الانضمام.');
      setJoinCode('');
      notify('انضممت إلى المجموعة ✅', 'ok');
      await loadGroups();
      if (payload.group) setActiveGroup(payload.group as StudyGroup);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر الانضمام.', 'error');
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleLeaveGroup = async (group: StudyGroup) => {
    if (!window.confirm('مغادرة هذه المجموعة؟')) return;
    try {
      const response = await fetch(`${CHAT_BASE}?action=groups_leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, groupId: group.id }),
      });
      if (!response.ok) throw new Error('تعذر مغادرة المجموعة.');
      setActiveGroup(null);
      setGroupMessages([]);
      notify('غادرت المجموعة.', 'ok');
      await loadGroups();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر مغادرة المجموعة.', 'error');
    }
  };

  const handleSendGroup = async () => {
    const text = input.trim();
    if (!text || sending || !activeGroup) return;
    setSending(true);
    try {
      const response = await fetch(`${CHAT_BASE}?action=groups_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: myCode, device, userName, groupId: activeGroup.id, message: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
      setInput('');
      await loadGroupMessages(activeGroup.id);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إرسال الرسالة.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify(`الكود: ${value}`, 'info');
    }
  };

  const myCodeCard = (
    <div className="friends-my-code-card">
      <div>
        <span className="friends-my-code-label">كودك لمشاركة الصداقة</span>
        <code className="friends-my-code-value" dir="ltr">
          {myCode}
        </code>
      </div>
      <button type="button" className="friends-copy-btn" onClick={() => void handleCopyCode(myCode)} aria-label="نسخ الكود">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
      </button>
    </div>
  );

  return (
    <div className="friends-chat-modal" role="dialog" aria-modal="true" aria-labelledby="friends-chat-title">
      <div className="friends-chat-panel">
        <header className="friends-chat-header">
          <div className="friends-chat-title">
            <Users className="h-5 w-5" aria-hidden="true" />
            <h2 id="friends-chat-title">تعلّم مع الأصدقاء</h2>
          </div>
          {onClose && (
            <button type="button" className="friends-chat-close" onClick={onClose} aria-label="إغلاق">
              <X className="h-4 w-4" />
            </button>
          )}
        </header>

        {!activeFriend && !activeGroup && (
          <div className="friends-tabs" role="tablist" aria-label="أصدقاء ومجموعات">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'friends'}
              className={`friends-tab ${tab === 'friends' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('friends');
                notify('');
              }}
            >
              <Users className="h-4 w-4" />
              أصدقاء
              {requests.length > 0 && <span className="friends-tab-badge">{requests.length}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'groups'}
              className={`friends-tab ${tab === 'groups' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('groups');
                notify('');
              }}
            >
              <UsersRound className="h-4 w-4" />
              مجموعات
              {groups.length > 0 && <span className="friends-tab-badge">{groups.length}</span>}
            </button>
          </div>
        )}

        <div className="friends-chat-body">
          {tab === 'friends' && !activeFriend && (
            <>
              {myCodeCard}

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
          )}

          {tab === 'friends' && activeFriend && (
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
                  onClick={() => void handleRemoveFriend(activeFriend.code)}
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
                  <button key={phrase} type="button" className="friends-quick-chip" onClick={() => setInput(phrase)}>
                    {phrase}
                  </button>
                ))}
              </div>

              <form
                className="friends-chat-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendFriend();
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

          {tab === 'groups' && !activeGroup && (
            <>
              {myCodeCard}

              <div className="friends-group-forms">
                <div className="friends-group-form">
                  <h3>إنشاء مجموعة دراسة</h3>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="اسم المجموعة (مثال: نادي المحادثة)"
                    className="friends-add-input"
                    maxLength={80}
                  />
                  <input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="وصف مختصر (اختياري)"
                    className="friends-add-input"
                    maxLength={300}
                  />
                  <button
                    type="button"
                    className="friends-create-btn"
                    onClick={() => void handleCreateGroup()}
                    disabled={creatingGroup || !groupName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                    {creatingGroup ? '…' : 'إنشاء مجموعة'}
                  </button>
                </div>

                <div className="friends-group-form">
                  <h3>الانضمام بكود</h3>
                  <div className="friends-add-row">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleJoinGroup();
                        }
                      }}
                      placeholder="أدخل كود المجموعة (G-XXXXXX)"
                      className="friends-add-input"
                      dir="ltr"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="friends-add-btn"
                      onClick={() => void handleJoinGroup()}
                      disabled={joiningGroup || !joinCode.trim()}
                    >
                      <UsersRound className="h-4 w-4" />
                      {joiningGroup ? '…' : 'انضمام'}
                    </button>
                  </div>
                </div>
              </div>

              {status && <p className={`friends-status is-${statusTone}`}>{status}</p>}

              <section className="friends-section">
                <h3>مجموعاتي ({groups.length})</h3>
                {loadingGroups && groups.length === 0 ? (
                  <p className="friends-empty">جارٍ تحميل المجموعات…</p>
                ) : groups.length === 0 ? (
                  <p className="friends-empty">
                    لا مجموعات بعد. أنشئ مجموعة وشارك كودها، أو انضم بكود صديقك.
                  </p>
                ) : (
                  <ul className="friends-list">
                    {groups.map((g) => (
                      <li key={g.id}>
                        <button
                          type="button"
                          className="friends-item friends-group-item"
                          onClick={() => {
                            setActiveGroup(g);
                            setGroupMessages([]);
                            notify('');
                          }}
                        >
                          <span className="friends-avatar friends-group-avatar">
                            <UsersRound className="h-4 w-4" />
                          </span>
                          <div>
                            <strong>{g.name}</strong>
                            <small>
                              {membersLabel(g.members.length)} • <span dir="ltr">{g.code}</span>
                            </small>
                          </div>
                          <MessageCircle className="friends-item-icon h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {tab === 'groups' && activeGroup && (
            <>
              <div className="friends-thread-head">
                <button type="button" className="friends-back-btn" onClick={() => setActiveGroup(null)}>
                  ← رجوع
                </button>
                <div className="friends-thread-peer">
                  <strong>{activeGroup.name}</strong>
                  <small>{membersLabel(activeGroup.members.length)} • {activeGroup.code}</small>
                </div>
                <button
                  type="button"
                  className="friends-remove-btn"
                  onClick={() => void handleLeaveGroup(activeGroup)}
                  aria-label="مغادرة المجموعة"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {activeGroup.description && (
                <p className="friends-group-desc">{activeGroup.description}</p>
              )}

              <div className="friends-members-row">
                {activeGroup.members.slice(0, 8).map((m) => (
                  <span key={m.code} className="friends-member-chip" title={m.code}>
                    {(m.name || m.code).charAt(0).toUpperCase()}
                  </span>
                ))}
                {activeGroup.members.length > 8 && (
                  <span className="friends-member-chip friends-member-more">+{activeGroup.members.length - 8}</span>
                )}
              </div>

              <div className="friends-chat-thread" ref={groupThreadRef}>
                {groupMessages.length === 0 ? (
                  <p className="friends-empty">ابدأوا المحادثة بالإنجليزية — تدرّبوا معًا! 🇬🇧</p>
                ) : (
                  groupMessages.map((m) => {
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
                  <button key={phrase} type="button" className="friends-quick-chip" onClick={() => setInput(phrase)}>
                    {phrase}
                  </button>
                ))}
              </div>

              <form
                className="friends-chat-input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendGroup();
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
