import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCheck,
  Copy,
  LogOut,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { normalizeFriendCode, readFriendIdentity } from '../../services/friendIdentity';

interface FriendRecord {
  code: string;
  name: string;
  status: 'accepted';
  lastMessage?: string;
  lastAt?: string;
  lastSenderCode?: string;
  unread?: number;
  lastSeenAt?: string;
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
  readBy?: string[];
}

interface GroupMember {
  code: string;
  name: string;
  joinedAtUtc: string;
  lastReadAt?: string;
  lastSeenAt?: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  code: string;
  ownerCode: string;
  createdAtUtc: string;
  members: GroupMember[];
  lastMessage?: string;
  lastAt?: string;
  lastSenderCode?: string;
  lastSenderName?: string;
  unread?: number;
}

interface GroupMessage {
  id: string;
  groupId: string;
  senderCode: string;
  senderName: string;
  message: string;
  at: string;
}

type Screen =
  | { name: 'inbox' }
  | { name: 'dm'; code: string }
  | { name: 'group'; id: string }
  | { name: 'addFriend' }
  | { name: 'newGroup' }
  | { name: 'joinGroup' };

type InboxFilter = 'all' | 'friends' | 'groups';

interface Conversation {
  kind: 'dm' | 'group';
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastAt: string;
  lastSenderCode: string;
  unread: number;
}

const CHAT_BASE = 'https://englishtok-eight.vercel.app/api/admin';

const QUICK_PHRASES = [
  'Hi! How are you?',
  'Let’s practise English together.',
  'Can you help me with this word?',
  'Great job! 🎉',
];

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
};

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const formatListTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  if (day === today) return formatTime(iso);
  if (day === today - 86400000) return 'أمس';
  return date.toLocaleDateString('ar', { day: '2-digit', month: '2-digit' });
};

const formatDayLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  if (day === today) return 'اليوم';
  if (day === today - 86400000) return 'أمس';
  return date.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
};

const initialsOf = (value: string): string => {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const avatarTone = (value: string): string => {
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) sum = (sum + value.charCodeAt(i) * (i + 3)) % 997;
  return `is-tone-${(sum % 5) + 1}`;
};

const membersLabel = (count: number): string => `${count} ${count === 1 ? 'عضو' : 'أعضاء'}`;

const isOnline = (lastSeenAt?: string): boolean => {
  if (!lastSeenAt) return false;
  const time = new Date(lastSeenAt).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time < 2 * 60 * 1000;
};

const previewOf = (conversation: Conversation, myCode: string): string => {
  if (!conversation.lastMessage) {
    return conversation.kind === 'group' ? 'ابدأ المحادثة الجماعية' : 'ابدأ المحادثة';
  }
  const mine = normalizeFriendCode(conversation.lastSenderCode) === myCode;
  const prefix = mine ? 'أنت: ' : '';
  return `${prefix}${conversation.lastMessage}`;
};

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

  const [screen, setScreen] = useState<Screen>({ name: 'inbox' });
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'ok' | 'error'>('info');
  const [addCode, setAddCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);

  const notify = useCallback((message: string, tone: 'info' | 'ok' | 'error' = 'info') => {
    setStatus(message);
    setStatusTone(tone);
  }, []);

  const loadLists = useCallback(async () => {
    try {
      const [friendsResponse, groupsResponse] = await Promise.all([
        fetch(`${CHAT_BASE}?action=friends_list&code=${encodeURIComponent(myCode)}&device=${encodeURIComponent(device)}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }),
        fetch(`${CHAT_BASE}?action=groups_list&code=${encodeURIComponent(myCode)}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        }),
      ]);
      if (friendsResponse.ok) {
        const payload = await friendsResponse.json().catch(() => ({}));
        if (Array.isArray(payload.friends)) setFriends(payload.friends);
        if (Array.isArray(payload.requests)) setRequests(payload.requests);
      }
      if (groupsResponse.ok) {
        const payload = await groupsResponse.json().catch(() => ({}));
        if (Array.isArray(payload.groups)) setGroups(payload.groups);
      }
    } catch {
      /* offline — keep the last known lists */
    } finally {
      setLoadingLists(false);
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
    void loadLists();
    const interval = window.setInterval(() => void loadLists(), 5000);
    return () => window.clearInterval(interval);
  }, [loadLists]);

  const dmCode = screen.name === 'dm' ? screen.code : '';
  const groupId = screen.name === 'group' ? screen.id : '';

  useEffect(() => {
    if (!dmCode) return;
    void loadMessages(dmCode);
    const interval = window.setInterval(() => void loadMessages(dmCode), 2000);
    return () => window.clearInterval(interval);
  }, [dmCode, loadMessages]);

  useEffect(() => {
    if (!groupId) return;
    void loadGroupMessages(groupId);
    const interval = window.setInterval(() => void loadGroupMessages(groupId), 2000);
    return () => window.clearInterval(interval);
  }, [groupId, loadGroupMessages]);

  const threadMessages: Array<FriendMessage | GroupMessage> =
    screen.name === 'group' ? groupMessages : messages;

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [threadMessages, screen.name]);

  const activeFriend = useMemo(
    () => (screen.name === 'dm' ? friends.find((f) => f.code === screen.code) ?? null : null),
    [screen, friends],
  );

  const activeGroup = useMemo(
    () => (screen.name === 'group' ? groups.find((g) => g.id === screen.id) ?? null : null),
    [screen, groups],
  );

  const conversations = useMemo<Conversation[]>(() => {
    const dmItems: Conversation[] = friends.map((f) => ({
      kind: 'dm',
      id: f.code,
      title: f.name || f.code,
      subtitle: f.code,
      lastMessage: f.lastMessage ?? '',
      lastAt: f.lastAt ?? '',
      lastSenderCode: f.lastSenderCode ?? '',
      unread: f.unread ?? 0,
    }));
    const groupItems: Conversation[] = groups.map((g) => ({
      kind: 'group',
      id: g.id,
      title: g.name,
      subtitle: membersLabel(g.members.length),
      lastMessage: g.lastMessage ?? '',
      lastAt: g.lastAt ?? '',
      lastSenderCode: g.lastSenderCode ?? '',
      unread: g.unread ?? 0,
    }));
    const merged = filter === 'friends' ? dmItems : filter === 'groups' ? groupItems : [...dmItems, ...groupItems];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? merged.filter(
          (item) =>
            item.title.toLowerCase().includes(needle) ||
            item.subtitle.toLowerCase().includes(needle) ||
            item.lastMessage.toLowerCase().includes(needle),
        )
      : merged;
    return filtered.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  }, [friends, groups, filter, query]);

  const totalUnread = useMemo(
    () => friends.reduce((sum, f) => sum + (f.unread ?? 0), 0) + groups.reduce((sum, g) => sum + (g.unread ?? 0), 0),
    [friends, groups],
  );

  const openConversation = (conversation: Conversation) => {
    setStatus('');
    setShowMembers(false);
    setShowQuick(false);
    setInput('');
    if (conversation.kind === 'dm') {
      setMessages([]);
      setScreen({ name: 'dm', code: conversation.id });
    } else {
      setGroupMessages([]);
      setScreen({ name: 'group', id: conversation.id });
    }
  };

  const goInbox = () => {
    setStatus('');
    setShowMembers(false);
    setShowQuick(false);
    setInput('');
    setScreen({ name: 'inbox' });
  };

  const handleAddFriend = async () => {
    const target = normalizeFriendCode(addCode);
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
      await loadLists();
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
      await loadLists();
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
      await loadLists();
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
      goInbox();
      notify('تمت إزالة الصديق.', 'ok');
      await loadLists();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إزالة الصديق.', 'error');
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (screen.name === 'dm' && activeFriend) {
        const response = await fetch(`${CHAT_BASE}?action=friends_chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            code: myCode,
            device,
            userName,
            friendCode: activeFriend.code,
            message: text,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
        setInput('');
        setShowQuick(false);
        await loadMessages(activeFriend.code);
      } else if (screen.name === 'group' && activeGroup) {
        const response = await fetch(`${CHAT_BASE}?action=groups_chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            code: myCode,
            device,
            userName,
            groupId: activeGroup.id,
            message: text,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'تعذر إرسال الرسالة.');
        setInput('');
        setShowQuick(false);
        await loadGroupMessages(activeGroup.id);
      }
      await loadLists();
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
      setStatus('');
      await loadLists();
      if (payload.group) {
        setGroupMessages([]);
        setScreen({ name: 'group', id: (payload.group as StudyGroup).id });
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر إنشاء المجموعة.', 'error');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async () => {
    const code = normalizeFriendCode(joinCode);
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
      setStatus('');
      await loadLists();
      if (payload.group) {
        setGroupMessages([]);
        setScreen({ name: 'group', id: (payload.group as StudyGroup).id });
      }
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
      goInbox();
      notify('غادرت المجموعة.', 'ok');
      await loadLists();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'تعذر مغادرة المجموعة.', 'error');
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      notify(`الكود: ${value}`, 'info');
    }
  };

  /* ---------------- render helpers ---------------- */

  const renderAvatar = (label: string, tone: string, size: 'lg' | 'md' | 'sm' | 'xs', group = false, online = false) => (
    <span className={`msgr-avatar-wrap msgr-avatar-wrap-${size}`} aria-hidden="true">
      <span className={`msgr-avatar ${size} ${group ? 'is-group' : tone}`}>
        {group ? <UsersRound /> : initialsOf(label)}
      </span>
      {online && !group && <span className="msgr-online-dot" />}
    </span>
  );

  const renderInbox = () => (
    <div className="msgr-inbox">
      <div className="msgr-search">
        <Search className="msgr-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث في المحادثات"
          aria-label="بحث في المحادثات"
        />
        {query && (
          <button type="button" className="msgr-search-clear" onClick={() => setQuery('')} aria-label="مسح البحث">
            <X />
          </button>
        )}
      </div>

      <div className="msgr-seg" role="tablist" aria-label="تصفية المحادثات">
        {(
          [
            ['all', 'الكل'],
            ['friends', 'أصدقاء'],
            ['groups', 'مجموعات'],
          ] as Array<[InboxFilter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={`msgr-seg-btn ${filter === value ? 'is-active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="msgr-scroll">
        {requests.length > 0 && (
          <section className="msgr-requests">
            <header>
              <span className="msgr-requests-dot" />
              طلبات صداقة
              <b>{requests.length}</b>
            </header>
            <ul>
              {requests.map((request) => (
                <li key={request.id}>
                  {renderAvatar(request.fromName || request.fromCode, avatarTone(request.fromCode), 'md')}
                  <div className="msgr-request-main">
                    <strong>{request.fromName || request.fromCode}</strong>
                    <small dir="ltr">{request.fromCode}</small>
                  </div>
                  <div className="msgr-request-actions">
                    <button type="button" className="msgr-accept" onClick={() => void handleAccept(request.id)}>
                      قبول
                    </button>
                    <button type="button" className="msgr-reject" onClick={() => void handleReject(request.id)}>
                      رفض
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status && <p className={`msgr-status is-${statusTone}`}>{status}</p>}

        {loadingLists && conversations.length === 0 ? (
          <div className="msgr-empty">
            <span className="msgr-spinner" aria-hidden="true" />
            <p>جارٍ تحميل المحادثات…</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="msgr-empty">
            <div className="msgr-empty-art">
              <Users />
            </div>
            <h3>{query ? 'لا نتائج' : 'لا محادثات بعد'}</h3>
            <p>
              {query
                ? 'جرّب اسماً آخر أو كوداً.'
                : 'أضف صديقاً بكوده، أو أنشئ مجموعة دراسة وشارك كودها.'}
            </p>
          </div>
        ) : (
          <ul className="msgr-list">
            {conversations.map((conversation) => (
              <li key={`${conversation.kind}-${conversation.id}`}>
                <button
                  type="button"
                  className={`msgr-row ${conversation.unread > 0 ? 'is-unread' : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  {renderAvatar(
                    conversation.title,
                    avatarTone(conversation.id),
                    'lg',
                    conversation.kind === 'group',
                    conversation.kind === 'dm' &&
                      isOnline(friends.find((friend) => friend.code === conversation.id)?.lastSeenAt),
                  )}
                  <span className="msgr-row-main">
                    <span className="msgr-row-top">
                      <strong>{conversation.title}</strong>
                      <time>{conversation.lastAt ? formatListTime(conversation.lastAt) : ''}</time>
                    </span>
                    <span className="msgr-row-bottom">
                      <span className="msgr-preview">{previewOf(conversation, myCode)}</span>
                      {conversation.unread > 0 && <span className="msgr-unread">{conversation.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="msgr-actions">
        <button type="button" className="msgr-action" onClick={() => setScreen({ name: 'addFriend' })}>
          <UserPlus />
          <span>إضافة صديق</span>
        </button>
        <button type="button" className="msgr-action" onClick={() => setScreen({ name: 'newGroup' })}>
          <Plus />
          <span>مجموعة جديدة</span>
        </button>
        <button type="button" className="msgr-action" onClick={() => setScreen({ name: 'joinGroup' })}>
          <UsersRound />
          <span>انضمام بكود</span>
        </button>
      </div>
    </div>
  );

  const renderThread = () => {
    const isGroup = screen.name === 'group';
    const peerTitle = isGroup ? activeGroup?.name ?? '' : activeFriend?.name || activeFriend?.code || '';
    const peerCode = isGroup ? activeGroup?.code ?? '' : activeFriend?.code ?? '';
    const peerSubtitle = isGroup
      ? activeGroup
        ? membersLabel(activeGroup.members.length)
        : ''
      : peerCode;

    return (
      <div className="msgr-thread">
        <header className="msgr-thread-head">
          <button type="button" className="msgr-back" onClick={goInbox} aria-label="رجوع">
            <ArrowRight />
          </button>
          {renderAvatar(peerTitle, avatarTone(peerCode), 'md', isGroup, !isGroup && isOnline(activeFriend?.lastSeenAt))}
          <div className="msgr-peer">
            <strong>{peerTitle}</strong>
            <small>{peerSubtitle}</small>
          </div>
          {isGroup ? (
            <>
              <button
                type="button"
                className={`msgr-head-btn ${showMembers ? 'is-active' : ''}`}
                onClick={() => setShowMembers((value) => !value)}
                aria-label="أعضاء المجموعة"
              >
                <Users />
              </button>
              <button
                type="button"
                className="msgr-head-btn is-danger"
                onClick={() => activeGroup && void handleLeaveGroup(activeGroup)}
                aria-label="مغادرة المجموعة"
              >
                <LogOut />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="msgr-head-btn is-danger"
              onClick={() => activeFriend && void handleRemoveFriend(activeFriend.code)}
              aria-label="إزالة الصديق"
            >
              <Trash2 />
            </button>
          )}
        </header>

        {isGroup && showMembers && activeGroup && (
          <div className="msgr-members-panel">
            {activeGroup.description && <p className="msgr-group-desc">{activeGroup.description}</p>}
            <ul>
              {activeGroup.members.map((member) => (
                <li key={member.code}>
                  {renderAvatar(member.name || member.code, avatarTone(member.code), 'sm', false, isOnline(member.lastSeenAt))}
                  <span>{member.name || member.code}</span>
                  {member.code === activeGroup.ownerCode && <em>المشرف</em>}
                </li>
              ))}
            </ul>
            <button type="button" className="msgr-code-chip" onClick={() => void handleCopy(activeGroup.code)}>
              <Copy />
              <span dir="ltr">{activeGroup.code}</span>
              <b>{copied ? 'تم النسخ' : 'نسخ كود المجموعة'}</b>
            </button>
          </div>
        )}

        <div className="msgr-scroll msgr-messages" ref={threadRef}>
          {threadMessages.length === 0 ? (
            <div className="msgr-empty is-thread">
              <div className="msgr-empty-art">
                <Smile />
              </div>
              <h3>ابدأ المحادثة</h3>
              <p>تدرّب على الإنجليزية مع {isGroup ? 'المجموعة' : 'صديقك'} — جملة واحدة تكفي للبدء.</p>
            </div>
          ) : (
            threadMessages.map((message, index) => {
              const previous = threadMessages[index - 1];
              const showDay =
                !previous || startOfDay(new Date(previous.at)) !== startOfDay(new Date(message.at));
              const mine = normalizeFriendCode(message.senderCode) === myCode;
              const authorName = message.senderName || message.senderCode;
              const readByPeer =
                !isGroup && activeFriend
                  ? ((message as FriendMessage).readBy ?? []).includes(activeFriend.code)
                  : false;
              return (
                <React.Fragment key={message.id}>
                  {showDay && <div className="msgr-day">{formatDayLabel(message.at)}</div>}
                  <div className={`msgr-msg ${mine ? 'is-mine' : 'is-theirs'}`}>
                    {!mine && renderAvatar(authorName, avatarTone(message.senderCode), 'xs')}
                    <div className="msgr-msg-body">
                      {!mine && isGroup && <span className="msgr-author">{authorName}</span>}
                      <div className="msgr-bubble" dir="auto">
                        {message.message}
                      </div>
                      <span className="msgr-meta">
                        {formatTime(message.at)}
                        {mine && !isGroup && (
                          <span className={`msgr-ticks ${readByPeer ? 'is-read' : ''}`} aria-hidden="true">
                            {readByPeer ? <CheckCheck /> : <Check />}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {status && <p className={`msgr-status is-${statusTone}`}>{status}</p>}

        {showQuick && (
          <div className="msgr-quick">
            {QUICK_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                className="msgr-quick-chip"
                onClick={() => {
                  setInput(phrase);
                  setShowQuick(false);
                }}
              >
                {phrase}
              </button>
            ))}
          </div>
        )}

        <form
          className="msgr-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <button
            type="button"
            className={`msgr-composer-btn ${showQuick ? 'is-active' : ''}`}
            onClick={() => setShowQuick((value) => !value)}
            aria-label="عبارات جاهزة"
          >
            <Smile />
          </button>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="اكتب بالإنجليزية…"
            className="msgr-input"
            dir="auto"
            autoComplete="off"
            aria-label="رسالة"
          />
          <button
            type="submit"
            className="msgr-send"
            disabled={sending || !input.trim()}
            aria-label="إرسال"
          >
            <Send />
          </button>
        </form>
      </div>
    );
  };

  const renderSubScreen = () => {
    if (screen.name === 'addFriend') {
      return (
        <div className="msgr-sub">
          <header className="msgr-sub-head">
            <button type="button" className="msgr-back" onClick={goInbox} aria-label="رجوع">
              <ArrowRight />
            </button>
            <h2>إضافة صديق</h2>
          </header>
          <div className="msgr-scroll">
            <div className="msgr-code-card">
              <small>كودك الشخصي</small>
              <code dir="ltr">{myCode}</code>
              <button type="button" onClick={() => void handleCopy(myCode)}>
                {copied ? <Check /> : <Copy />}
                <span>{copied ? 'تم النسخ' : 'نسخ كودي'}</span>
              </button>
              <p>شارك هذا الكود مع صديقك ليرسل لك طلب صداقة. لا يكشف الكود ترخيصك.</p>
            </div>

            <label className="msgr-field">
              <span>كود صديقك</span>
              <input
                type="text"
                value={addCode}
                onChange={(event) => setAddCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleAddFriend();
                  }
                }}
                placeholder="U-XXXXXXXX"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <button
              type="button"
              className="msgr-primary"
              onClick={() => void handleAddFriend()}
              disabled={adding || !addCode.trim()}
            >
              <UserPlus />
              <span>{adding ? 'جارٍ الإرسال…' : 'إرسال طلب صداقة'}</span>
            </button>

            {status && <p className={`msgr-status is-${statusTone}`}>{status}</p>}
          </div>
        </div>
      );
    }

    if (screen.name === 'newGroup') {
      return (
        <div className="msgr-sub">
          <header className="msgr-sub-head">
            <button type="button" className="msgr-back" onClick={goInbox} aria-label="رجوع">
              <ArrowRight />
            </button>
            <h2>مجموعة جديدة</h2>
          </header>
          <div className="msgr-scroll">
            <label className="msgr-field">
              <span>اسم المجموعة</span>
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="مثال: نادي المحادثة"
                maxLength={80}
              />
            </label>
            <label className="msgr-field">
              <span>الوصف (اختياري)</span>
              <textarea
                value={groupDesc}
                onChange={(event) => setGroupDesc(event.target.value)}
                placeholder="ما هدف المجموعة؟"
                maxLength={300}
                rows={3}
              />
            </label>
            <button
              type="button"
              className="msgr-primary"
              onClick={() => void handleCreateGroup()}
              disabled={creatingGroup || !groupName.trim()}
            >
              <Plus />
              <span>{creatingGroup ? 'جارٍ الإنشاء…' : 'إنشاء المجموعة'}</span>
            </button>
            <p className="msgr-hint">سيُنشأ كود انضمام تلقائي مثل <b dir="ltr">G-XXXXXX</b> لمشاركته مع أصدقائك.</p>
            {status && <p className={`msgr-status is-${statusTone}`}>{status}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="msgr-sub">
        <header className="msgr-sub-head">
          <button type="button" className="msgr-back" onClick={goInbox} aria-label="رجوع">
            <ArrowRight />
          </button>
          <h2>الانضمام إلى مجموعة</h2>
        </header>
        <div className="msgr-scroll">
          <label className="msgr-field">
            <span>كود المجموعة</span>
            <input
              type="text"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void handleJoinGroup();
                }
              }}
              placeholder="G-XXXXXX"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="msgr-primary"
            onClick={() => void handleJoinGroup()}
            disabled={joiningGroup || !joinCode.trim()}
          >
            <UsersRound />
            <span>{joiningGroup ? 'جارٍ الانضمام…' : 'انضمام'}</span>
          </button>
          {status && <p className={`msgr-status is-${statusTone}`}>{status}</p>}
        </div>
      </div>
    );
  };

  const title = screen.name === 'inbox' ? 'المحادثات' : 'تعلّم مع الأصدقاء';

  return (
    <div className="msgr-overlay" role="dialog" aria-modal="true" aria-labelledby="msgr-title">
      <div className="msgr-app">
        <header className="msgr-topbar">
          <div className="msgr-topbar-title">
            <span className="msgr-logo" aria-hidden="true">
              <MessageBadge />
            </span>
            <h1 id="msgr-title">{title}</h1>
            {totalUnread > 0 && screen.name === 'inbox' && (
              <span className="msgr-total-unread">{totalUnread > 99 ? '99+' : totalUnread}</span>
            )}
          </div>
          {onClose && (
            <button type="button" className="msgr-close" onClick={onClose} aria-label="إغلاق">
              <X />
            </button>
          )}
        </header>

        {screen.name === 'inbox' && renderInbox()}
        {(screen.name === 'dm' || screen.name === 'group') && renderThread()}
        {(screen.name === 'addFriend' || screen.name === 'newGroup' || screen.name === 'joinGroup') &&
          renderSubScreen()}
      </div>
    </div>
  );
};

const MessageBadge: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
